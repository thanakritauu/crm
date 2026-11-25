import { For, type JSX } from "solid-js";
import { useI18n } from "~/lib/i18n";
import { Input, Label, selectClass } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { customerService } from "~/services/customer-service";
import { IconChevronDown } from "~/components/ui/icons";

export type AddressParts = { province: string; district: string; sub_district: string; zipcode: string };

/**
 * จังหวัด → เขต/อำเภอ → แขวง/ตำบล → รหัสไปรษณีย์ (เติมอัตโนมัติ)
 * grid 2 คอลัมน์ ช่องห่าง 16 · select สูง 48 มุม 12 (เหมือน ui/input) + ลูกศรลง absolute right-4
 * ข้อมูลจาก province-service — prototype ใช้ customerService (mock addressTree)
 */

function Chevron() {
  return (
    <div class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray">
      <IconChevronDown size={16} />
    </div>
  );
}

function Field(props: { label: string; children: JSX.Element; class?: string }) {
  return (
    <div class={cn("relative col-span-2", props.class)}>
      <Label>{props.label}</Label>
      <div class="relative">{props.children}</div>
    </div>
  );
}

export function AddressSelect(props: { value: AddressParts; onChange: (value: AddressParts) => void; invalid?: boolean }) {
  const { t } = useI18n();
  const v = () => props.value;

  const setProvince = (province: string) => props.onChange({ province, district: "", sub_district: "", zipcode: "" });
  const setDistrict = (district: string) => props.onChange({ ...v(), district, sub_district: "", zipcode: "" });
  const setSub = (sub_district: string) =>
    props.onChange({ ...v(), sub_district, zipcode: customerService.zipcode(v().province, v().district, sub_district) });

  const missing = (x: string) => props.invalid && !x;

  return (
    <div class="grid grid-cols-2 gap-4">
      <Field label={t("account.province")}>
        <select class={selectClass(missing(v().province))} value={v().province} onChange={(e) => setProvince(e.currentTarget.value)}>
          <option value="" disabled>{t("profile.form_address.province_placeholder")}</option>
          <For each={customerService.provinces()}>{(p) => <option value={p} selected={p === v().province}>{p}</option>}</For>
        </select>
        <Chevron />
      </Field>
      <Field label={t("account.district")}>
        <select class={selectClass(missing(v().district))} value={v().district} disabled={!v().province} onChange={(e) => setDistrict(e.currentTarget.value)}>
          <option value="" disabled>{t("profile.form_address.amphoe_placeholder")}</option>
          <For each={customerService.districts(v().province)}>{(d) => <option value={d} selected={d === v().district}>{d}</option>}</For>
        </select>
        <Chevron />
      </Field>
      <Field label={t("account.sub_district")} class="col-span-1">
        <select class={selectClass(missing(v().sub_district))} value={v().sub_district} disabled={!v().district} onChange={(e) => setSub(e.currentTarget.value)}>
          <option value="" disabled>{t("profile.form_address.district_placeholder")}</option>
          <For each={customerService.subDistricts(v().province, v().district)}>{(s) => <option value={s} selected={s === v().sub_district}>{s}</option>}</For>
        </select>
        <Chevron />
      </Field>
      <Field label={t("profile.form_address.zipcode_placeholder")} class="col-span-1">
        <Input
          inputmode="numeric"
          readOnly
          value={v().zipcode}
          placeholder={t("profile.form_address.zipcode_placeholder")}
          class="bg-surface-gray focus-within:border-stroke-strong"
        />
      </Field>
    </div>
  );
}
