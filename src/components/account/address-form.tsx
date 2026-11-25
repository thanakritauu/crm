import { useSearchParams } from "@solidjs/router";
import { createMemo, createSignal, For } from "solid-js";
import { AddressSelect, type AddressParts } from "~/components/account/address-select";
import { ADDRESS_TYPES, AddressTypeIcon } from "~/components/account/address-card";
import { BottomActionBar, BottomActionBarSpacer } from "~/components/layout/bottom-action-bar";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { FieldError, Input, Label } from "~/components/ui/input";
import { useI18n } from "~/lib/i18n";
import { useTheme } from "~/lib/theme";
import { cn } from "~/lib/utils";
import type { AddressInput, AddressType } from "~/services/address-service";

/** toast ที่หน้ารายการแสดงเมื่อกลับมาจากฟอร์ม (ส่งผ่าน navigation state) */
export type AddressToast = "added" | "edited" | "deleted";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * path ของสมุดที่อยู่ + โหมดเลือกที่อยู่
 * ?select=1&return=<path ใต้ partner>[&selected=<id>] — คงค่า query นี้ไว้ทุกครั้งที่ไป-กลับ รายการ ↔ ฟอร์ม
 */
export function useAddressBookNav() {
  const [search] = useSearchParams();
  const { partner } = useTheme();
  // ตัด "/" นำหน้า กันลิงก์ไปโดเมนอื่น (//evil.com)
  const returnPath = () => one(search.return).trim().replace(/^[/\\]+/, "");
  const selectMode = () => one(search.select) === "1" && !!returnPath();
  const selectedId = () => one(search.selected);
  const query = () => {
    if (!selectMode()) return "";
    const q = new URLSearchParams({ select: "1", return: returnPath() });
    if (selectedId()) q.set("selected", selectedId());
    return `?${q}`;
  };
  const base = () => `/${partner()}/profile/addresses`;
  return {
    selectMode,
    selectedId,
    listPath: () => `${base()}${query()}`,
    newPath: () => `${base()}/new${query()}`,
    editPath: (id: string) => `${base()}/${encodeURIComponent(id)}${query()}`,
    /** กลับหน้าที่เรียกโหมดเลือก (ส่ง address=<id> เมื่อเลือกแล้ว) */
    returnTo: (addressId?: string) => {
      const p = `/${partner()}/${returnPath()}`;
      return addressId ? `${p}${p.includes("?") ? "&" : "?"}address=${encodeURIComponent(addressId)}` : p;
    },
  };
}

/** ค่าในฟอร์ม — ประเภทที่อยู่ยังไม่เลือกได้ (ฟอร์มว่าง) */
export type AddressFormValue = Omit<AddressInput, "type"> & { type?: AddressType };

export const emptyAddress = (): AddressFormValue => ({
  name: "",
  surname: "",
  phone: "",
  detail: "",
  province: "",
  district: "",
  sub_district: "",
  zipcode: "",
  type: undefined,
  is_default: false,
});

/**
 * ฟอร์มที่อยู่ (Figma Add address 393:2660 / Add address_Field 393:4163) — ใช้ร่วมกันหน้าเพิ่ม/แก้ไข
 * ส่วนห่าง 24: ข้อมูลผู้รับ (ชื่อ | นามสกุล, เบอร์มือถือ) · รายละเอียดที่อยู่ (+ AddressSelect)
 *   · ประเภทที่อยู่ (ปุ่ม 3 ช่อง แบบปุ่มเพศ) · checkbox ค่าเริ่มต้น · ปุ่มบันทึกติดล่าง
 * ตรวจข้อมูลแบบเดียวกับทุกฟอร์ม: ปุ่มบันทึกกดได้เสมอ · ข้อความผิดขึ้นใต้ช่องเมื่อออกจากช่อง และทุกช่องเมื่อกดบันทึก
 */
export function AddressForm(props: { initial: AddressFormValue; onSubmit: (input: AddressInput) => void; onDirtyChange?: (dirty: boolean) => void }) {
  const { t } = useI18n();
  const [form, setForm] = createSignal<AddressFormValue>({ ...props.initial });
  const set = <K extends keyof AddressFormValue>(k: K, v: AddressFormValue[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    props.onDirtyChange?.(JSON.stringify(form()) !== JSON.stringify({ ...props.initial }));
  };
  const parts = (): AddressParts => ({ province: form().province, district: form().district, sub_district: form().sub_district, zipcode: form().zipcode });

  const phoneOk = () => /^0\d{9}$/.test(form().phone);
  const [touched, setTouched] = createSignal(false);
  const [blurred, setBlurred] = createSignal<Set<string>>(new Set());
  const blur = (k: string) => setBlurred((b) => new Set(b).add(k));
  const show = (k: string) => touched() || blurred().has(k);
  const errors = createMemo(() => {
    const f = form();
    return {
      name: f.name.trim() ? "" : t("me.error_required", { field: t("common.name") }),
      surname: f.surname.trim() ? "" : t("me.error_required", { field: t("common.surname") }),
      phone: phoneOk() ? "" : t("profile.form_address.phone.error"),
      detail: f.detail.trim() ? "" : t("me.error_required", { field: t("profile.form_address.address_detail") }),
      area: f.province && f.district && f.sub_district && f.zipcode ? "" : t("account.address_area_required"),
      type: f.type ? "" : t("profile.form_address.address_type_required"),
    };
  });
  const valid = () => Object.values(errors()).every((e) => !e);

  const submit = (e: SubmitEvent) => {
    e.preventDefault();
    setTouched(true);
    const f = form();
    if (!valid() || !f.type) return;
    props.onSubmit({ ...f, type: f.type, name: f.name.trim(), surname: f.surname.trim(), detail: f.detail.trim() });
  };

  return (
    <>
      <form id="addressForm" class="flex flex-col gap-6 px-4 pb-4" onSubmit={submit} novalidate>
        {/* ข้อมูลผู้รับ */}
        <section>
          <Label required>{t("profile.form_address.recipient_info")}</Label>
          <div class="flex flex-col gap-4">
            <div class="grid grid-cols-2 gap-4">
              <Input
                maxLength={50}
                aria-label={t("common.name")}
                placeholder={t("profile.form_address.name.placeholder")}
                value={form().name}
                invalid={show("name") && !!errors().name}
                onBlur={() => blur("name")}
                onInput={(e) => set("name", e.currentTarget.value.trimStart())}
              />
              <Input
                maxLength={50}
                aria-label={t("common.surname")}
                placeholder={t("profile.form_address.surname.placeholder")}
                value={form().surname}
                invalid={show("surname") && !!errors().surname}
                onBlur={() => blur("surname")}
                onInput={(e) => set("surname", e.currentTarget.value.trimStart())}
              />
            </div>
            <FieldError>{(show("name") && errors().name) || (show("surname") && errors().surname)}</FieldError>
            <div>
              <Input
                inputmode="numeric"
                maxLength={10}
                aria-label={t("me.mobile_label")}
                placeholder={t("me.mobile_placeholder")}
                value={form().phone}
                type="tel"
                autocomplete="tel"
                invalid={show("phone") && !!errors().phone}
                onBlur={() => blur("phone")}
                onInput={(e) => set("phone", e.currentTarget.value.replace(/\D/g, ""))}
              />
              <FieldError>{show("phone") && errors().phone}</FieldError>
            </div>
          </div>
        </section>

        {/* รายละเอียดที่อยู่ */}
        <section class="flex flex-col gap-4">
          <div>
            <Label for="address-detail" required>{t("profile.form_address.address_detail")}</Label>
            <Input
              id="address-detail"
              maxLength={200}
              placeholder={t("profile.form_address.address.placeholder")}
              value={form().detail}
              invalid={show("detail") && !!errors().detail}
              onBlur={() => blur("detail")}
              onInput={(e) => set("detail", e.currentTarget.value.trimStart())}
            />
            <FieldError>{show("detail") && errors().detail}</FieldError>
          </div>
          <div>
            <AddressSelect
              value={parts()}
              invalid={touched()}
              onChange={(p) => {
                setForm((f) => ({ ...f, ...p }));
                props.onDirtyChange?.(true);
              }}
            />
            <FieldError>{touched() && errors().area}</FieldError>
          </div>
        </section>

        {/* ประเภทที่อยู่ — หน้าตาเดียวกับปุ่มเลือกเพศ */}
        <section>
          <Label required>{t("profile.form_address.address_type_label")}</Label>
          <div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t("profile.form_address.address_type_label")}>
            <For each={ADDRESS_TYPES}>
              {(o) => {
                const active = () => form().type === o.value;
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active()}
                    onClick={() => set("type", o.value)}
                    class={cn(
                      "flex h-12 w-full items-center justify-center gap-x-2 rounded-xl border px-4 text-14 font-medium",
                      active() ? "border-primary bg-primary-surface text-primary" : "border-stroke-strong bg-white text-gray",
                    )}
                  >
                    <AddressTypeIcon type={o.value} active={active()} />
                    {t(o.label)}
                  </button>
                );
              }}
            </For>
          </div>
          <FieldError>{touched() && errors().type}</FieldError>
        </section>

        <Checkbox checked={form().is_default} onChange={(v) => set("is_default", v)}>
          {t("profile.form_address.set_default")}
        </Checkbox>
      </form>

      <BottomActionBarSpacer />
      <BottomActionBar>
        <Button type="submit" form="addressForm" size="block">
          {t("common.save")}
        </Button>
      </BottomActionBar>
    </>
  );
}
