import { A } from "@solidjs/router";
import { children, Show, type JSX } from "solid-js";
import { Badge } from "~/components/ui/badge";
import { cardClass } from "~/components/ui/card";
import { CoverImage } from "~/components/ui/cover-image";
import { IconGift } from "~/components/ui/icons";
import { useI18n } from "~/lib/i18n";
import { useTheme } from "~/lib/theme";
import { cn, formatNumber } from "~/lib/utils";

/**
 * การ์ดแถว "รูปซ้าย 102px + ป้าย + ชื่อ" — ใช้ร่วมกันทุกหน้า
 * (หน้าแรก สิทธิพิเศษ, รายการสิทธิพิเศษ/ประวัติการแลก, ของรางวัล, รางวัลของภารกิจสะสมคอยน์)
 * - รูปเต็มกรอบซ้าย กว้าง 102 สูงเท่าการ์ด (การ์ดสูง 102 = รูป 1:1 พอดี: ป้าย + ชื่อ 2 บรรทัด) · ไฟล์รูปต้องเป็น 1:1
 * - image: { colors, src } หรือ undefined (พื้นเทา)
 * - overlay: ข้อความทับรูป (หมดเขต / หมด / แลกแล้ว) · overlayTone dark = ดำโปร่ง, gray = เทา
 * - badge: ป้ายด้านบน (ใช้ <PointsBadge/> สำหรับ "ใช้ X คะแนน")
 * - children: บรรทัดเพิ่มเติมใต้ชื่อ (12 สีเทา)
 * - href = ลิงก์ · onClick = ปุ่ม
 */
export function ImageRowCard(props: {
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  image?: { colors: [string, string]; src?: string; fit?: "cover" | "contain" };
  overlay?: string;
  overlayTone?: "dark" | "gray";
  badge?: JSX.Element;
  title: JSX.Element;
  children?: JSX.Element;
  class?: string;
}) {
  // resolve JSX ครั้งเดียว (อ่าน props.badge/children ซ้ำจะสร้าง DOM ซ้ำ → hydration ไม่ตรง)
  const badge = children(() => props.badge);
  const extra = children(() => props.children);
  const body = () => (
    <>
      {/* รูปเต็มกรอบซ้ายเสมอ (ไม่มีขอบขาวบน/ล่าง — 2026-11-26): กว้าง 102 สูงเท่าการ์ด (ขั้นต่ำ 102 = 1:1) · object-cover
          ไฟล์รูปต้องเป็น 1:1 — การ์ดที่มีบรรทัดเพิ่ม (สูงกว่า 102) รูปถูกครอปบน/ล่างเล็กน้อย ไม่ยืด */}
      <div class="relative min-h-[102px] w-[102px] shrink-0 self-stretch border-r border-stroke">
        {/* ไม่มีรูป = ภาพเริ่มต้น: พื้นม่วงอ่อน + ไอคอนของขวัญม่วง (เดิมกล่องเทาว่าง ดูเหมือนยังทำไม่เสร็จ · 2026-11-28) */}
        <Show
          when={props.image}
          fallback={
            <div class="absolute inset-0 flex items-center justify-center bg-secondary-surface text-secondary">
              <IconGift size={32} />
            </div>
          }
        >
          {(img) => <CoverImage colors={img().colors} src={img().src} fit={img().fit} class="absolute inset-0 size-full" />}
        </Show>
        <Show when={props.overlay}>
          <span
            class={cn(
              "absolute inset-0 flex items-center justify-center px-2 text-center text-12 font-medium text-white",
              props.overlayTone === "gray" ? "bg-gray/70" : "bg-black/40",
            )}
          >
            {props.overlay}
          </span>
        </Show>
      </div>
      <div class="flex min-h-[102px] min-w-0 flex-1 flex-col justify-center gap-1 p-4">
        <Show when={badge()}>
          <div class="self-start">{badge()}</div>
        </Show>
        <p class="line-clamp-2 break-words text-14 font-semibold text-dark">{props.title}</p>
        <Show when={extra()}>
          <div class="flex flex-col text-12 text-gray">{extra()}</div>
        </Show>
      </div>
    </>
  );
  const cls = () => cn(cardClass, "flex w-full overflow-hidden text-left", props.class);
  return (
    <Show
      when={props.href}
      fallback={
        <button type="button" onClick={props.onClick} disabled={props.disabled} class={cls()}>
          {body()}
        </button>
      }
    >
      <A href={props.href!} class={cls()}>
        {body()}
      </A>
    </Show>
  );
}

/** ป้าย "ใช้ X คะแนน" (ไอคอนคะแนนของธีม) */
export function PointsBadge(props: { points: number }) {
  const { t } = useI18n();
  const { theme } = useTheme();
  return (
    <Badge>
      <img src={theme().image_point} alt="" class="size-3.5 rounded-full object-cover" />
      {t("core.use_points", { points: formatNumber(props.points) })}
    </Badge>
  );
}
