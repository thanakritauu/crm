import { useNavigate, useSearchParams } from "@solidjs/router";
import { createSignal, For, Match, onMount, Switch } from "solid-js";
import { pendingRegister } from "~/lib/pending-register";
import { ConsentDialog } from "~/components/account/consent-dialog";
import { NavigationTopbar } from "~/components/layout/navigation-topbar";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { FieldError, Input, Label } from "~/components/ui/input";
import { PageLoading } from "~/components/ui/page-loading";
import { useI18n } from "~/lib/i18n";
import { session, sessionActions } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { customerService } from "~/services/customer-service";
import { IconCheck } from "~/components/ui/icons";

/**
 * /:partner/register — สมัครสมาชิกใหม่ (มาจาก user-verification "ไม่เคย")
 * ต้นฉบับ: index-a27e4111 (หัวสี 256 + ฟอร์ม detail_customer + หน้าลงทะเบียนสำเร็จ หัวสี 200)
 *   register-form / dialog-register / dialog-register-member (ฟอร์มรุ่นเก่า + ป๊อปอัปยินยอม)
 * Prototype: ฟิลด์มาจาก theme.registration_settings (mocks/policy.ts → enabled: ชื่อ, นามสกุล, เบอร์โทร, บัตรประชาชน)
 *   + ช่องยินยอมนโยบาย (เปิด ConsentDialog) · บันทึกแบบจำลอง → updateCustomer + setMember → หน้าสำเร็จ → home (new_member)
 */
type FieldKey = "name" | "surname" | "phone" | "id_card";

const digitsOnly = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);

export default function Register() {
  const { t, locale } = useI18n();
  const to = usePartnerPath();
  const navigate = useNavigate();

  const fields = customerService.registrationFields().filter((f) => f.enabled && (f.key as string) !== "address");
  const [values, setValues] = createSignal<Record<FieldKey, string>>({
    name: "",
    surname: "",
    phone: "",
    id_card: "",
  });
  const [errors, setErrors] = createSignal<Partial<Record<FieldKey | "consent", string>>>({});
  const [consent, setConsent] = createSignal(false);
  const [consentOpen, setConsentOpen] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [done, setDone] = createSignal(false);
  const [search] = useSearchParams<{ done?: string }>();
  // กลับมาจาก OTP สำเร็จ → หน้าสมัครสำเร็จ
  onMount(() => {
    if (search.done) return setDone(true);
    // กลับมาจากหน้า OTP (ย้อนกลับ / ผิดครบ) → ข้อมูลที่กรอกไว้ยังอยู่
    const p = pendingRegister.load();
    if (p) setValues((v) => ({ ...v, name: p.name, surname: p.surname, phone: p.phone, id_card: p.id_card ?? "" }));
  });

  const setValue = (key: FieldKey, raw: string) => {
    const v = key === "phone" ? digitsOnly(raw, 10) : key === "id_card" ? raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 20) : raw.trimStart();
    setValues((s) => ({ ...s, [key]: v }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    return v;
  };

  /** ข้อความผิดของช่องเดียว (ใช้ทั้งตอนออกจากช่องและตอนกดถัดไป) */
  const fieldError = (key: FieldKey): string | undefined => {
    const f = fields.find((x) => x.key === key)!;
    const val = values()[key].trim();
    if (f.required && !val) return t("account.please_enter_field", { label: f.label[locale()] });
    if (key === "phone" && val && val.length !== 10) return t("profile.form_address.phone.error");
    if (key === "phone" && val === "0811111111") return t("otp.phone_registered_title");
    if (key === "id_card" && val && !/^\d{13}$/.test(val) && !/^[A-Z][A-Z0-9]{5,19}$/.test(val)) return t("account.invalid_id_card_or_passport");
    return undefined;
  };
  const blur = (key: FieldKey) => setErrors((e) => ({ ...e, [key]: fieldError(key) }));

  const validate = () => {
    const e: Partial<Record<FieldKey | "consent", string>> = {};
    for (const f of fields) {
      const key = f.key as FieldKey;
      const err = fieldError(key);
      if (err) e[key] = err;
    }
    if (!consent()) e.consent = t("account.please_accept_privacy_policy");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: SubmitEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    // ยืนยันเบอร์ด้วย OTP ก่อน (เหมือนเข้าสู่ระบบ / รวมบัญชี / เปลี่ยนเบอร์) — หน้า OTP บันทึกข้อมูลแล้วกลับมาหน้าสำเร็จ
    const v = values();
    pendingRegister.save({ name: v.name.trim(), surname: v.surname.trim(), phone: v.phone, ...(v.id_card ? { id_card: v.id_card } : {}) });
    navigate(to(`auth/verify-phone?action=register&phone=${v.phone}`));
  };

  const finish = () => navigate(to("home"), { state: { new_member: true }, replace: true });

  return (
    <div class="flex min-h-screen flex-col bg-white">
      <Switch>
        <Match when={!done()}>
          <NavigationTopbar isLightColor />
          {/* หัวสีชมพู สูง 256 มุมล่าง 24 (NavigationTopbar ซ้อนทับ) */}
          <div class="flex h-64 w-full flex-col items-center justify-center gap-1 rounded-b-3xl bg-primary p-4 text-center text-white">
            <h2 class="text-24 font-semibold">{t("profile.register_button")}</h2>
            <p class="text-16">{t("profile.register_description")}</p>
          </div>

          <div class="mt-8 flex flex-1 flex-col px-4">
            <form id="detail_customer" onSubmit={submit} novalidate>
              <div class="flex flex-col gap-4">
                <For each={fields}>
                  {(f) => {
                    const key = f.key as FieldKey;
                    return (
                      <div>
                        <Label for={key} required={f.required}>
                          {f.label[locale()]}
                        </Label>
                        <Input
                          id={key}
                          inputmode={key === "phone" ? "numeric" : undefined}
                          maxLength={key === "phone" ? 10 : key === "id_card" ? 20 : 100}
                          placeholder={f.placeholder[locale()]}
                          value={values()[key]}
                          invalid={!!errors()[key]}
                          type={key === "phone" ? "tel" : "text"}
                          autocomplete={key === "name" ? "given-name" : key === "surname" ? "family-name" : key === "phone" ? "tel" : "off"}
                          onBlur={() => blur(key)}
                          onInput={(e) => (e.currentTarget.value = setValue(key, e.currentTarget.value))}
                        />
                        <FieldError>{errors()[key]}</FieldError>
                      </div>
                    );
                  }}
                </For>

                <div class="pt-2">
                  <div class="flex flex-wrap items-start gap-x-1">
                    <Checkbox
                      checked={consent()}
                      onChange={(c) => {
                        setConsent(c);
                        setErrors((e) => ({ ...e, consent: undefined }));
                      }}
                    >
                      {t("account.i_have_read_and_accept")}
                    </Checkbox>
                    <button type="button" class="text-14 font-medium text-primary underline" onClick={() => setConsentOpen(true)}>
                      {t("common.privacy_policy")}
                    </button>
                  </div>
                  <FieldError>{errors().consent}</FieldError>
                </div>
              </div>
            </form>
          </div>

          <div class="p-4 pt-8">
            <Button form="detail_customer" type="submit" size="block">
              {t("common.next")}
            </Button>
          </div>
        </Match>

        {/* ลงทะเบียนสำเร็จ: หัวชมพู 200 มุมล่าง 24 + วงกลมเขียว 80 ซ้อนขอบ · หัวข้อ 18/Semi · ปุ่ม 48 ชิดล่าง */}
        <Match when={done()}>
          <div class="flex h-hero items-end justify-center rounded-b-3xl bg-primary">
            <div class="-mb-10 flex size-20 items-center justify-center rounded-full border-4 border-white bg-success text-white shadow-card">
              <IconCheck size={40} strokeWidth={2.5} />
            </div>
          </div>
          <div class="mt-16 flex flex-col gap-2 px-4 text-center">
            <h2 class="text-18 font-semibold text-dark">{t("account.register_success")}</h2>
            <p class="px-8 text-14 font-normal text-gray">
              {t("account.register_success_description", { name: session.customer.name })}
            </p>
          </div>
          <div class="mt-auto p-4 pt-8">
            <Button size="block" onClick={finish}>
              {t("common.done")}
            </Button>
          </div>
        </Match>
      </Switch>

      <ConsentDialog
        open={consentOpen()}
        onOpenChange={setConsentOpen}
        onAccept={() => {
          setConsent(true);
          setErrors((e) => ({ ...e, consent: undefined }));
        }}
      />
      <PageLoading show={saving()} message={t("common.in_progress_wait_a_moment")} />
    </div>
  );
}
