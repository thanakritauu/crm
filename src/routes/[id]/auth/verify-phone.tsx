import { useNavigate, useSearchParams } from "@solidjs/router";
import { createSignal, Match, onCleanup, onMount, Show, Switch } from "solid-js";
import { OtpInput } from "~/components/account/otp-input";
import { NavigationTopbar } from "~/components/layout/navigation-topbar";
import { Button } from "~/components/ui/button";
import { FieldError, Input, Label } from "~/components/ui/input";
import { AlertDialog, ResultModal } from "~/components/ui/modal";
import { PageLoading } from "~/components/ui/page-loading";
import { useI18n } from "~/lib/i18n";
import { pendingProfile } from "~/lib/pending-profile";
import { session, sessionActions } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { pendingRegister } from "~/lib/pending-register";
import { IconInfo } from "~/components/ui/icons";

/**
 * /:partner/verify-by-phone?action=merge|register|signin|change_phone — ยืนยันตัวตนด้วยเบอร์โทร + OTP
 *   change_phone (มาจากหน้าข้อมูลส่วนตัว, &phone=เบอร์ใหม่&path=profile): เริ่มที่ขั้น OTP ทันที
 *     ยืนยันแล้วบันทึกข้อมูลที่รอไว้ (lib/pending-profile) → กลับหน้าโปรไฟล์พร้อม toast · ย้อนกลับ = กลับไปแก้ฟอร์ม
 * ต้นฉบับ: index-286e4c0c (หน้า) + verify-phone-73837822 (ฟอร์ม 2 ขั้น) + sms-otp-service (ขอ/ตรวจ OTP)
 *   ขั้น 1 "ตรวจสอบสถานะสมาชิก" กรอกเบอร์ 10 หลัก (จัดรูปแบบ 081 234 5678) → ถัดไป
 *   ขั้น 2 "ยืนยันตัวตน" ขอ OTP อัตโนมัติ แสดงรหัสอ้างอิง + นับถอยหลัง 5 นาที + ขอรหัสอีกครั้ง → ยืนยัน OTP
 *   สำเร็จ → ?path=... (กลับหน้าที่มา state success) หรือ /home state { new_member: true }
 *   action=merge: OTP ผ่านแล้วถามยืนยันการรวมบัญชีก่อน (guest = ถามล็อคอิน, ไม่ต้องการ = เป็น guest ต่อไป /home)
 * Mock (ไม่ส่ง SMS จริง, OTP เลขใดก็ได้ 6 หลักผ่าน ยกเว้น):
 *   OTP 000000 = รหัสผิด (ผิดครบ 3 ครั้งต่อรอบ OTP = ล็อก กลับขั้น 1 / change_phone กลับหน้าข้อมูลส่วนตัว)
 *   OTP 111111 = หมดอายุ (OTP จริงหมดอายุ 5 นาทีหลังขอ)
 *   เบอร์ 0900000000 = ส่ง OTP ไม่สำเร็จในครั้งแรก (ขอใหม่สำเร็จ)
 *   เบอร์ 0811111111 = เบอร์ถูกใช้สมัครแล้ว (เฉพาะ action=register)
 *   เบอร์ 0000000000 = ยังไม่เคยเป็นสมาชิก (เฉพาะ action=merge/signin)
 */
const RESEND_SECONDS = 300;
const OTP_VALID_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

const formatPhone = (digits: string) =>
  digits.replace(/(\d{3})(\d{3})?(\d{0,4})?/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" "));

type ErrorModal = { title: string; description: string; onClose?: () => void };

export default function VerifyByPhone() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const navigate = useNavigate();
  const [params] = useSearchParams<{ action?: string; path?: string; phone?: string }>();
  const action = () => params.action ?? "merge";
  const changePhone = () => action() === "change_phone" && /^0\d{9}$/.test(params.phone ?? "");
  /** สมัครสมาชิก: เบอร์มาจากหน้าสมัคร → ข้ามขั้นกรอกเบอร์ */
  const registerFlow = () => action() === "register" && /^0\d{9}$/.test(params.phone ?? "");

  const [step, setStep] = createSignal<1 | 2>(changePhone() || registerFlow() ? 2 : 1);
  const [phone, setPhone] = createSignal(changePhone() || registerFlow() ? params.phone! : "");
  const [phoneError, setPhoneError] = createSignal("");
  const [otp, setOtp] = createSignal<string[]>(Array(6).fill(""));
  const [otpInvalid, setOtpInvalid] = createSignal(false);
  const [refCode, setRefCode] = createSignal("");
  const [seconds, setSeconds] = createSignal(0);
  const [canResend, setCanResend] = createSignal(true);
  const [checking, setChecking] = createSignal(false);
  const [error, setError] = createSignal<ErrorModal>();
  const [mergeOpen, setMergeOpen] = createSignal(false);

  /** เวลาที่ขอ OTP ล่าสุดสำเร็จ (0 = ยังไม่มี OTP ที่ใช้ได้) */
  let otpRequestedAt = 0;
  let wrongAttempts = 0;
  /** เบอร์ที่จำลองส่ง OTP ไม่สำเร็จไปแล้ว (ครั้งถัดไปส่งสำเร็จ) */
  const sendFailedPhones = new Set<string>();
  // guest ตอนเข้าหน้า (ก่อน setMember) — เลือกข้อความ dialog รวมบัญชี
  // อ่านตอนใช้งาน (session โหลดจาก localStorage หลัง mount)
  const isGuest = () => session.isMember === false;

  let timer: ReturnType<typeof setInterval> | undefined;
  onCleanup(() => clearInterval(timer));

  const stopCountdown = () => {
    clearInterval(timer);
    setSeconds(0);
    setCanResend(true);
  };

  const startCountdown = () => {
    clearInterval(timer);
    setSeconds(RESEND_SECONDS);
    setCanResend(false);
    timer = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  /** จำลอง sms-otp-service.requestOtp → ได้ ref_code (เบอร์ 0900000000 ส่งไม่สำเร็จครั้งแรก) */
  const requestOtp = () => {
    setOtp(Array(6).fill(""));
    setOtpInvalid(false);
    wrongAttempts = 0;
    if (phone() === "0900000000" && !sendFailedPhones.has(phone())) {
      sendFailedPhones.add(phone());
      otpRequestedAt = 0;
      setRefCode("");
      stopCountdown();
      setError({ title: t("otp.send_failed_title"), description: t("otp.send_failed_description") });
      return;
    }
    otpRequestedAt = Date.now();
    setRefCode(Math.random().toString(36).slice(2, 6).toUpperCase());
    startCountdown();
  };

  const countdownText = () => {
    const m = Math.floor(seconds() / 60);
    const s = seconds() % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  /** กลับไปขั้นกรอกเบอร์ (หลังผิดครบ 3 ครั้ง) — change_phone กลับหน้าข้อมูลส่วนตัว */
  const resetToPhoneStep = () => {
    if (changePhone()) {
      navigate(to("profile/info"), { replace: true });
      return;
    }
    // สมัครสมาชิก → กลับหน้าสมัคร (ข้อมูลที่กรอกยังอยู่)
    if (registerFlow()) {
      navigate(to("auth/register"), { replace: true });
      return;
    }
    clearInterval(timer);
    otpRequestedAt = 0;
    wrongAttempts = 0;
    setOtp(Array(6).fill(""));
    setOtpInvalid(false);
    setRefCode("");
    setSeconds(0);
    setCanResend(true);
    setStep(1);
  };

  // เปลี่ยนเบอร์: ข้ามขั้นกรอกเบอร์ ขอ OTP ไปที่เบอร์ใหม่ทันที
  onMount(() => {
    if (changePhone() || registerFlow()) requestOtp();
  });

  const submitPhone = (e: SubmitEvent) => {
    e.preventDefault();
    if (phone().length !== 10) return setPhoneError(t("profile.form_address.phone.error"));
    if (["merge", "signin"].includes(action()) && phone() === "0000000000") {
      setPhoneError(t("otp.phone_not_member"));
      return;
    }
    setPhoneError("");
    if (action() === "register" && phone() === "0811111111") {
      setError({ title: t("otp.phone_registered_title"), description: t("otp.phone_registered_description") });
      return;
    }
    setStep(2);
    requestOtp();
  };

  /** ยืนยันสำเร็จ: บันทึกเบอร์ + เป็นสมาชิก → หน้าที่มา หรือ home */
  const completeSuccess = () => {
    sessionActions.updateCustomer({ phone: phone() });
    sessionActions.setMember(true);
    if (params.path) navigate(to(params.path), { state: { status: "success", update: "success" }, replace: true });
    else navigate(to("home"), { state: { new_member: true }, replace: true });
  };

  const submitOtp = (e: SubmitEvent) => {
    e.preventDefault();
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      const code = otp().join("");
      if (code === "111111" || !otpRequestedAt || Date.now() - otpRequestedAt > OTP_VALID_MS) {
        setOtp(Array(6).fill(""));
        stopCountdown();
        setError({ title: t("otp.expired_title"), description: t("otp.expired_description") });
        return;
      }
      if (code === "000000") {
        setOtp(Array(6).fill(""));
        wrongAttempts += 1;
        if (wrongAttempts >= MAX_ATTEMPTS) {
          setError({ title: t("otp.locked_title"), description: t("otp.locked_description"), onClose: resetToPhoneStep });
          return;
        }
        setOtpInvalid(true);
        setError({ title: t("me.otp_error_title"), description: t("me.otp_error_description") });
        return;
      }
      clearInterval(timer);
      if (changePhone()) {
        sessionActions.updateCustomer({ ...pendingProfile.load(), phone: phone() });
        pendingProfile.clear();
        navigate(to(params.path ?? "profile"), { state: { status: "success", update: "success" }, replace: true });
        return;
      }
      if (action() === "merge") {
        setMergeOpen(true);
        return;
      }
      if (registerFlow()) {
        const r = pendingRegister.load();
        sessionActions.updateCustomer({ ...(r ? { name: r.name, surname: r.surname, ...(r.id_card ? { id_card: r.id_card } : {}) } : {}), phone: phone() });
        sessionActions.setMember(true);
        pendingRegister.clear();
        navigate(to("auth/register?done=1"), { replace: true });
        return;
      }
      completeSuccess();
    }, 900);
  };

  return (
    <div class="flex min-h-screen flex-col bg-white">
      {/* ขั้น OTP: ย้อนกลับ = กลับไปแก้เบอร์ (เปลี่ยนเบอร์ = กลับหน้าข้อมูลส่วนตัว โดยข้อมูลที่แก้ยังอยู่) */}
      <NavigationTopbar isLightColor navTo={changePhone() ? "profile/info" : undefined} onBack={step() === 2 || registerFlow() ? resetToPhoneStep : undefined} />

      <Switch>
        {/* ขั้นที่ 1: กรอกเบอร์โทรศัพท์ */}
        <Match when={step() === 1}>
          <div class="flex h-hero w-full flex-col items-center justify-center gap-1 rounded-b-3xl bg-primary p-4 text-center text-white">
            <h2 class="text-24 font-semibold">{t("me.check_member_title")}</h2>
            <p class="text-16">{t("me.check_member_subtitle")}</p>
          </div>
          <div class="mt-8 px-4">
            <form id="phone" onSubmit={submitPhone}>
              <div class="w-full">
                <Label for="phone-input">{t("profile.form.phone.label")}</Label>
                <Input
                  id="phone-input"
                  required
                  inputmode="numeric"
                  maxLength={12}
                  placeholder={t("me.phone_placeholder")}
                  value={formatPhone(phone())}
                  onInput={(e) => {
                    const digits = e.currentTarget.value.replace(/\D/g, "").slice(0, 10);
                    setPhone(digits);
                    setPhoneError("");
                    e.currentTarget.value = formatPhone(digits);
                  }}
                  invalid={!!phoneError()}
                  type="tel"
                  autocomplete="tel"
                  onBlur={() => phone() && phone().length !== 10 && setPhoneError(t("profile.form_address.phone.error"))}
                />
                <FieldError>{phoneError()}</FieldError>
              </div>
            </form>
          </div>
          <div class="mt-auto p-4 pt-8">
            <Button form="phone" type="submit" size="block">
              {t("me.next")}
            </Button>
          </div>
        </Match>

        {/* ขั้นที่ 2: ยืนยัน OTP */}
        <Match when={step() === 2}>
          <div class="flex h-hero w-full flex-col items-center justify-center gap-1 rounded-b-3xl bg-primary p-4 text-center text-white">
            <h2 class="text-24 font-semibold">{changePhone() ? t("me.verify_new_phone_title") : t("me.verify_title")}</h2>
            <p class="text-16">
              {t("me.otp_sent_to")} <br /> {t("me.otp_sent_phone", { phone: `${phone().slice(0, 3)} ${phone().slice(3, 6)} xxxx` })}
            </p>
          </div>
          <div class="mt-8 flex flex-col gap-4 px-4">
            <form id="otp" onSubmit={submitOtp}>
              <div class="flex w-full flex-col gap-2">
                <div class="flex items-center justify-between text-dark">
                  <span class="text-16 font-medium">{t("me.confirm_otp")}</span>
                  <Show when={refCode()}>
                    <span class="text-14 font-normal">{t("me.ref_code", { code: refCode() })}</span>
                  </Show>
                </div>
                <OtpInput
                  value={otp()}
                  onChange={(v) => {
                    setOtp(v);
                    setOtpInvalid(false);
                  }}
                />
                <Show when={otpInvalid()}>
                  <p class="text-12 text-error">{t("otp.invalid_inline")}</p>
                </Show>
              </div>
            </form>
            <div class="w-full">
              <Show
                when={canResend()}
                fallback={
                  <h2 class="text-center text-dark">
                    <span class="text-16">{t("me.otp_not_received")}</span>
                    <span class="ml-2 text-14 font-normal text-gray-placeholder">{t("me.otp_resend_in", { time: countdownText() })}</span>
                  </h2>
                }
              >
                <div class="text-center">
                  <button class="hit-area text-primary underline" type="button" onClick={requestOtp}>
                    {t("otp.request_again")}
                  </button>
                </div>
              </Show>
            </div>
          </div>
          <div class="mt-auto p-4 pt-8">
            <Button form="otp" type="submit" size="block" disabled={otp().join("").length !== 6}>
              {t("me.confirm_otp")}
            </Button>
          </div>
        </Match>
      </Switch>

      <PageLoading show={checking()} message={t("me.checking_otp")} />
      <ResultModal
        open={!!error()}
        onOpenChange={(o) => {
          if (o) return;
          const onClose = error()?.onClose;
          setError(undefined);
          onClose?.();
        }}
        variant="error"
        title={error()?.title ?? ""}
        description={error()?.description}
        buttonText={t("common.close")}
      />
      <AlertDialog
        open={mergeOpen()}
        onOpenChange={setMergeOpen}
        tone="warning"
        icon={<IconInfo size={24} />}
        title={isGuest() ? t("otp.merge_guest_title") : t("otp.merge_title")}
        description={isGuest() ? t("otp.merge_guest_description") : t("otp.merge_description", { phone: formatPhone(phone()) })}
        cancelText={isGuest() ? t("otp.merge_guest_cancel") : t("otp.merge_cancel")}
        confirmText={isGuest() ? t("otp.merge_guest_confirm") : t("otp.merge_confirm")}
        onConfirm={completeSuccess}
        onCancel={() => navigate(isGuest() ? to("home") : to("welcome"), { replace: true })}
      />
    </div>
  );
}
