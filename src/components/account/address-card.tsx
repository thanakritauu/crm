import { Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { useI18n } from "~/lib/i18n";
import { cn } from "~/lib/utils";
import { addressService, type AddressType, type ShippingAddress } from "~/services/address-service";
import { IconHome, IconMapPin, IconWork } from "~/components/ui/icons";

/** ประเภทที่อยู่: ชื่อ (i18n key) + ไอคอน 16px (Figma home / coffee / map-pin) สีชมพู = เลือก, สีเทา = ไม่เลือก */
export const ADDRESS_TYPES: { value: AddressType; label: string; icon: string }[] = [
  { value: "home", label: "profile.form_address.type_home", icon: "home" },
  { value: "work", label: "profile.form_address.type_work", icon: "coffee" },
  { value: "other", label: "profile.form_address.type_other", icon: "map-pin" },
];
/** ไอคอนประเภทที่อยู่ (บ้าน / ที่ทำงาน / อื่นๆ) — Solar Linear · สีชมพูเมื่อเลือก สีเทาเมื่อไม่เลือก */
export function AddressTypeIcon(props: { type?: AddressType; active?: boolean }) {
  const icon = () => (props.type === "home" ? IconHome : props.type === "work" ? IconWork : IconMapPin);
  return <Dynamic component={icon()} size={16} class={cn("shrink-0", props.active === false ? "text-gray" : "text-primary")} />;
}
export const addressTypeLabel = (type: AddressType) => ADDRESS_TYPES.find((x) => x.value === type)?.label ?? "profile.form_address.type_other";

/** 0918889999 → 091 888 9999 */
const formatPhone = (p: string) => (/^\d{10}$/.test(p) ? `${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6)}` : p);

/**
 * การ์ดที่อยู่ (Figma My Add address 871:7070)
 * พื้นขาว มุม 16 + เงา Card · padding 16 · ป้าย "ค่าเริ่มต้น" มุมซ้ายบน (พื้นม่วง) · selected = ขอบชมพู
 * แถวบน: ไอคอน + ประเภท (14/Semi ชมพู) · ชื่อ นามสกุล · เบอร์ (14/Semi) · ลิงก์ "แก้ไข" (12/Med ชมพู ขีดเส้นใต้)
 * แถวล่าง: ที่อยู่ 14/Reg สีเทา · มี onSelect → แสดง radio และกดทั้งการ์ดเพื่อเลือก
 */
export function AddressCard(props: {
  address: ShippingAddress;
  onEdit?: () => void;
  selected?: boolean;
  onSelect?: () => void;
  showDefault?: boolean;
  class?: string;
}) {
  const { t } = useI18n();
  const a = () => props.address;
  const ribbon = () => props.showDefault && a().is_default;
  const selectable = () => !!props.onSelect;

  return (
    <div
      role={selectable() ? "radio" : undefined}
      aria-checked={selectable() ? !!props.selected : undefined}
      tabIndex={selectable() ? 0 : undefined}
      onClick={() => props.onSelect?.()}
      onKeyDown={(e) => {
        if (selectable() && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          props.onSelect?.();
        }
      }}
      class={cn(
        "relative flex w-full items-center gap-2 rounded-2xl border bg-white px-4 pb-4 text-left shadow-card",
        ribbon() ? "pt-6" : "pt-4",
        props.selected ? "border-primary" : "border-transparent",
        selectable() && "cursor-pointer",
        props.class,
      )}
    >
      <Show when={ribbon()}>
        <span class="absolute -left-px -top-px rounded-br-xl rounded-tl-2xl rounded-tr-xl bg-secondary px-2 text-12 font-medium text-white">
          {t("profile.default")}
        </span>
      </Show>

      <Show when={selectable()}>
        <Show when={props.selected} fallback={<img src="/images/figma/icon-radio.svg" alt="" width="24" height="24" class="shrink-0" />}>
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-primary">
            <span class="size-3 rounded-full bg-primary" />
          </span>
        </Show>
      </Show>

      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <div class="flex items-start justify-between gap-2">
          <div class="flex min-w-0 flex-wrap items-center gap-x-2 text-14 font-semibold">
            <span class="flex items-center gap-2 text-primary">
              <AddressTypeIcon type={a().type} />
              {t(addressTypeLabel(a().type))}
            </span>
            <span class="text-dark">{`${a().name} ${a().surname}`.trim()}</span>
            <span class="text-dark">{formatPhone(a().phone)}</span>
          </div>
          <Show when={props.onEdit}>
            <button
              type="button"
              class="hit-area shrink-0 text-12 font-medium text-primary underline"
              onClick={(e) => {
                e.stopPropagation();
                props.onEdit?.();
              }}
            >
              {t("common.edit")}
            </button>
          </Show>
        </div>
        <p class="text-14 text-gray">{addressService.format(a())}</p>
      </div>
    </div>
  );
}
