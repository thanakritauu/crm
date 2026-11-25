import { useLocation, useNavigate } from "@solidjs/router";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { BirthdayDialog, formatThaiBirthday } from "~/components/account/birthday-dialog";
import { BottomActionBar } from "~/components/layout/bottom-action-bar";
import { PageHeader } from "~/components/layout/page-header";
import { Button } from "~/components/ui/button";
import { FieldError, Input, Label } from "~/components/ui/input";
import { PageLoading } from "~/components/ui/page-loading";
import { useI18n } from "~/lib/i18n";
import { session, sessionActions } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { cn } from "~/lib/utils";
import type { Customer } from "~/mocks/customer";
import { pendingProfile } from "~/lib/pending-profile";
import { DiscardChangesModal } from "~/components/ui/discard-changes-modal";
import { useMemberOnly } from "~/lib/member-gate";
import { IconCalendar } from "~/components/ui/icons";
import { useGoBack, useBackWith } from "~/lib/navigation";
import { Avatar } from "~/components/ui/avatar";

/**
 * /:partner/personal-information — แก้ไขข้อมูลส่วนตัว
 * ต้นฉบับ: index-10825115 + dialog-birthday-b3144903
 *   แถบสี h-[90px] + รูปโปรไฟล์ + ชื่อ, ฟอร์ม customerForm: ชื่อ, นามสกุล, เบอร์โทร (นับ x/10), บัตรประชาชน/พาสปอร์ต,
 *   วันเกิด (เปิด sheet เลือกวัน — บันทึกแล้วล็อก), เพศ (ปุ่ม 3 ช่อง rounded-[16px] เลือกแล้ว bg-primary-surface),
 *   แถบล่างปุ่มบันทึก Button block (disabled = เทาอัตโนมัติ เมื่อยังไม่แก้ไข/ข้อมูลไม่ครบ)
 *   ต้นฉบับเปลี่ยนเบอร์ต้องยืนยัน OTP (verify-by-phone?action=change_phone...) และไปหน้า consent ถ้าผู้เยาว์
 * Figma (871:5312 → OTP → Profile toast): เพิ่มช่องอีเมล, ไม่มีช่องบัตรประชาชน
 *   บันทึก: เปลี่ยนเบอร์มือถือ → เก็บข้อมูลไว้ (lib/pending-profile) แล้วไปยืนยัน OTP ที่เบอร์ใหม่
 *          (verify-by-phone?action=change_phone) · ไม่ได้เปลี่ยนเบอร์ → บันทึกทันที
 *   สำเร็จ → กลับหน้าโปรไฟล์พร้อม toast "อัปเดตข้อมูล สำเร็จ" (ไม่มี modal คั่นตาม Figma)
 *   วันเกิด: ล็อกหลังบันทึกครั้งแรก (เหมือนเว็บเดิม) + ข้อความบอกใต้ช่อง
 * ตรวจข้อมูล: ปุ่มบันทึกกดได้เมื่อมีการแก้ไข · ข้อความผิดขึ้นใต้ช่องเมื่อออกจากช่อง และทุกช่องเมื่อกดบันทึก
 * กลับมาจากหน้า OTP (ย้อนกลับ / ใส่ผิดครบ) → ฟอร์มยังเป็นข้อมูลที่แก้ไว้ (pendingProfile) · เข้าจากหน้าโปรไฟล์ = เริ่มจากข้อมูลจริง
 */
type Form = Pick<Customer, "name" | "surname" | "phone" | "email" | "birthday" | "gender">;

export default function PersonalInformation() {
  useMemberOnly();
  const { t } = useI18n();
  const to = usePartnerPath();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const backWith = useBackWith();
  const location = useLocation<{ profile?: boolean }>();

  const initial = (): Form => ({
    name: session.customer.name,
    surname: session.customer.surname,
    phone: session.customer.phone,
    email: session.customer.email,
    birthday: session.customer.birthday,
    gender: session.customer.gender,
  });
  const [form, setForm] = createSignal<Form>(initial());
  const [touched, setTouched] = createSignal(false);
  const [blurred, setBlurred] = createSignal<Set<keyof Form>>(new Set());
  const blur = (key: keyof Form) => setBlurred((b) => new Set(b).add(key));
  /** แสดงข้อความผิดของช่องนี้หรือยัง */
  const show = (key: keyof Form) => touched() || blurred().has(key);

  onMount(() => {
    if (location.state?.profile) return pendingProfile.clear();
    const pending = pendingProfile.load();
    if (pending) setForm(pending);
  });
  const [birthdayOpen, setBirthdayOpen] = createSignal(false);
  const [saving, setSaving] = createSignal(false);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const errors = createMemo(() => {
    const f = form();
    return {
      name: !f.name.trim() ? t("me.error_required", { field: t("profile.form.name.label") }) : "",
      surname: !f.surname.trim() ? t("me.error_required", { field: t("profile.form.surname.label") }) : "",
      phone: /^0\d{9}$/.test(f.phone) ? "" : t("me.error_phone"),
      email: f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) ? t("me.error_email") : "",
      birthday: "",
      gender: !f.gender ? t("profile.form.gender.required") : "",
    };
  });
  const changed = createMemo(() => {
    const a = form();
    const b = initial();
    return (Object.keys(a) as (keyof Form)[]).some((k) => a[k] !== b[k]);
  });
  const valid = () => Object.values(errors()).every((e) => !e);
  const canSave = () => changed() && valid();
  const [discardOpen, setDiscardOpen] = createSignal(false);
  const leaveNow = () => {
    pendingProfile.clear();
    goBack("profile");
  };
  /** ย้อนกลับ: แก้ไขแล้วยังไม่บันทึก → ถามก่อน */
  const leave = () => (changed() ? setDiscardOpen(true) : leaveNow());

  const genders: { value: Customer["gender"]; label: string }[] = [
    { value: "female", get label() { return t("profile.form.gender.women"); } },
    { value: "male", get label() { return t("profile.form.gender.men"); } },
    { value: "unspecified", get label() { return t("profile.form.gender.unspecified"); } },
  ];

  const submit = (e: SubmitEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSave()) return;
    const f = form();
    const next = { ...f, name: f.name.trim(), surname: f.surname.trim(), email: f.email.trim() };
    // เปลี่ยนเบอร์ → ยืนยัน OTP ที่เบอร์ใหม่ก่อน แล้วหน้า OTP จะบันทึกให้
    if (next.phone !== session.customer.phone) {
      pendingProfile.save(next);
      navigate(to(`auth/verify-phone?action=change_phone&phone=${next.phone}&path=profile`));
      return;
    }
    setSaving(true);
    setTimeout(() => {
      sessionActions.updateCustomer(next);
      setSaving(false);
      backWith("profile", { status: "success", update: "success" });
    }, 700);
  };

  return (
    <div class="min-h-screen bg-white">
      {/* Figma Prosonal Info (871:5312): PageHeader ชมพู สูง 90px + ปุ่มย้อนกลับขาว, รูป 64px + ชื่อ 18/700 ซ้อนขอบล่าง */}
      <PageHeader tone="primary" class="h-[90px]" onBack={leave} />
      <div class="relative z-raised mt-[-34px] flex flex-col items-center gap-1">
        <Avatar size={64} class="ring-2 ring-white" />
        <p class="text-18 font-semibold text-dark">{session.customer.name} {session.customer.surname}</p>
      </div>
      <div class="h-4" />

      <div class="flex flex-col overflow-y-auto px-4">
        <form id="customerForm" class="flex flex-grow flex-col" onSubmit={submit} novalidate>
          <div class="grid grid-cols-1 gap-y-4">
            <div>
              <Label for="name" required>{t("profile.form.name.label")}</Label>
              <Input id="name" maxLength={50} placeholder={t("profile.form.name.placeholder")} value={form().name} invalid={show("name") && !!errors().name} onBlur={() => blur("name")} onInput={(e) => set("name", e.currentTarget.value.trimStart())} />
              <FieldError>{show("name") && errors().name}</FieldError>
            </div>
            <div>
              <Label for="surname" required>{t("profile.form.surname.label")}</Label>
              <Input id="surname" maxLength={50} placeholder={t("profile.form.surname.placeholder")} value={form().surname} invalid={show("surname") && !!errors().surname} onBlur={() => blur("surname")} onInput={(e) => set("surname", e.currentTarget.value.trimStart())} />
              <FieldError>{show("surname") && errors().surname}</FieldError>
            </div>
            <div>
              <Label for="date_of_birth_display" required>{t("profile.form.date_of_birth.label")}</Label>
              <button
                type="button"
                id="date_of_birth_display"
                disabled={!!session.customer.birthday}
                onClick={() => setBirthdayOpen(true)}
                class="relative flex h-12 w-full cursor-pointer items-center rounded-xl border border-stroke-strong bg-white px-4 pr-12 text-left text-14 font-normal disabled:cursor-not-allowed disabled:bg-surface-gray"
              >
                <span class={form().birthday ? "text-dark" : "text-gray-placeholder"}>
                  {formatThaiBirthday(form().birthday) || t("profile.form.date_of_birth.placeholder")}
                </span>
                <IconCalendar size={24} class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray" />
              </button>
              <Show when={session.customer.birthday}>
                <p class="mt-1 text-12 text-gray">{t("profile.form.date_of_birth.locked_help")}</p>
              </Show>
            </div>
            <div class="grid grid-cols-12 gap-x-2">
              <div class="col-span-12">
                <Label required>{t("profile.form.gender.label")}</Label>
              </div>
              <For each={genders}>
                {(g) => (
                  <div class="col-span-4">
                    <button
                      type="button"
                      onClick={() => set("gender", g.value)}
                      class={cn(
                        "flex h-12 w-full cursor-pointer items-center justify-center gap-x-2 rounded-xl px-4 text-14 font-medium",
                        form().gender === g.value ? "border border-primary bg-primary-surface text-primary" : "border border-stroke-strong bg-white text-gray",
                      )}
                    >
                      {g.label}
                    </button>
                  </div>
                )}
              </For>
              <div class="col-span-12">
                <FieldError>{touched() && errors().gender}</FieldError>
              </div>
            </div>
            <div>
              <Label for="phone" required>{t("me.mobile_label")}</Label>
              <Input id="phone" inputmode="numeric" maxLength={10} placeholder={t("me.mobile_placeholder")} value={form().phone} invalid={show("phone") && !!errors().phone} onBlur={() => blur("phone")} onInput={(e) => set("phone", e.currentTarget.value.replace(/\D/g, ""))} />
              <FieldError>{show("phone") && errors().phone}</FieldError>
            </div>
            <div>
              <Label for="email">{t("me.email_label")}</Label>
              <Input id="email" type="email" inputmode="email" maxLength={100} placeholder={t("me.email_placeholder")} value={form().email} invalid={show("email") && !!errors().email} onBlur={() => blur("email")} onInput={(e) => set("email", e.currentTarget.value.trim())} />
              <FieldError>{show("email") && errors().email}</FieldError>
            </div>
          </div>
          <div class="mb-20 flex-grow py-4" />
        </form>
      </div>

      <BottomActionBar class="flex items-center pb-8">
        <Button type="submit" form="customerForm" size="block" disabled={!changed()}>
          {t("profile.form.save")}
        </Button>
      </BottomActionBar>

      <BirthdayDialog
        open={birthdayOpen()}
        onOpenChange={setBirthdayOpen}
        value={form().birthday}
        title={t("profile.form.date_of_birth.placeholder")}
        onSelect={(v) => set("birthday", v)}
      />
      <DiscardChangesModal open={discardOpen()} onOpenChange={setDiscardOpen} onDiscard={leaveNow} />
      <PageLoading show={saving()} message={t("common.in_progress_wait_a_moment")} />
    </div>
  );
}
