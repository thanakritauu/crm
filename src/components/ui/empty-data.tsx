import { A } from "@solidjs/router";
import { Show, type Component } from "solid-js";
import { Dynamic } from "solid-js/web";
import { translate } from "~/lib/i18n";
import { IconBox } from "~/components/ui/icons";

type IconComp = Component<{ size?: number; class?: string }>;

/**
 * สถานะไม่มีข้อมูล (Figma "Nodata")
 * แบบเดียวทั้งเว็บ (2026-11-28): วงม่วงอ่อน 64 + ไอคอนม่วง 32 ตามเรื่องของหน้า (ตั๋ว / กระดิ่ง / ของขวัญ / ภารกิจ …)
 *   ไม่ส่ง icon = กล่อง (IconBox) · เลิกใช้รูปกล่อง "?" (ดูเหมือนข้อผิดพลาด)
 * - หัวข้อ 14/Semi · คำอธิบาย 12 เทา · action = ปุ่มรอง (outline) ไปทำสิ่งถัดไป
 */
export function EmptyData(props: { title?: string; description?: string; class?: string; icon?: IconComp; action?: { label: string; href: string } }) {
  return (
    <div class={`flex flex-col items-center gap-2 py-8 text-center ${props.class ?? ""}`}>
      <span class="mb-2 flex size-16 items-center justify-center rounded-full bg-secondary-surface text-secondary">
        <Dynamic component={props.icon ?? IconBox} size={32} />
      </span>
      <h2 class="text-14 font-semibold text-dark">{props.title ?? translate("profile.no_data_found")}</h2>
      {props.description && <p class="max-w-[280px] text-12 text-gray">{props.description}</p>}
      <Show when={props.action}>
        {(a) => (
          <A href={a().href} class="mt-2 flex h-10 items-center rounded-full border border-primary px-6 text-14 font-medium text-primary">
            {a().label}
          </A>
        )}
      </Show>
    </div>
  );
}
