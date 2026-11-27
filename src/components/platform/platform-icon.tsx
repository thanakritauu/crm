import { cn } from "~/lib/utils";
import type { PlatformConfig } from "~/mocks/platforms";

/**
 * ไอคอนแพลตฟอร์ม — ไฟล์จากเจ้าของ (2026-11-27): public/images/platforms/<platform>.png (120×120 · มุมโค้งในไฟล์แล้ว)
 * กรอบ rounded-xl + overflow-hidden ตัดมุมให้ตรงกันทุกขนาด · ไม่มีเงา (ใส่ class เพิ่มเองได้)
 */
export function PlatformIcon(props: { platform: PlatformConfig; disabled?: boolean; class?: string }) {
  return (
    <span class={cn("block h-full w-full overflow-hidden rounded-xl", props.disabled && "opacity-55 grayscale", props.class)}>
      <img src={`/images/platforms/${props.platform.platform}.png`} alt={props.platform.display_name} width="120" height="120" class="h-full w-full object-cover" />
    </span>
  );
}

/**
 * ไอคอนแพลตฟอร์มขนาดคงที่ + ป้ายถูกสีเขียวมุมขวาล่างเมื่อเชื่อมต่อแล้ว (2026-11-27)
 * ใช้ชุดเดียวกันทั้งการ์ดชวนเชื่อม (หน้าสะสมคะแนน · size 32) และรายการหน้าเชื่อมต่อแพลตฟอร์ม (size 40) ให้สองหน้าดูเป็นเรื่องเดียวกัน
 */
export function PlatformTile(props: { platform: PlatformConfig; connected?: boolean; size?: 32 | 40 }) {
  return (
    <span class={cn("relative block shrink-0", props.size === 32 ? "size-8" : "size-10")}>
      <PlatformIcon platform={props.platform} />
      {props.connected && (
        <span class="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full border-2 border-white bg-success">
          <svg viewBox="0 0 12 12" class="size-2" fill="none" aria-hidden="true">
            <path d="M2.5 6.2 5 8.5l4.5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      )}
    </span>
  );
}
