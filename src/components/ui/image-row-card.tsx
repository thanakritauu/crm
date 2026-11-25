import { A } from "@solidjs/router";
import { children, Show, type JSX } from "solid-js";
import { Badge } from "~/components/ui/badge";
import { cardClass } from "~/components/ui/card";
import { CoverImage } from "~/components/ui/cover-image";
import { useI18n } from "~/lib/i18n";
import { useTheme } from "~/lib/theme";
import { cn, formatNumber } from "~/lib/utils";

/**
 * การ์ดแถว "รูปซ้าย 102px + ป้าย + ชื่อ" — ใช้ร่วมกันทุกหน้า
 * (หน้าแรก สิทธิพิเศษ, รายการสิทธิพิเศษ/ประวัติการแลก, ของรางวัล, รางวัลของภารกิจสะสมคอยน์)
 * - รูปเป็นสี่เหลี่ยมจัตุรัส 1:1 (102×102) เสมอ — ถ้าเนื้อหาสูงกว่า 102 รูปอยู่กึ่งกลางแนวตั้ง
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
      <div class="flex w-[102px] shrink-0 items-center self-stretch border-r border-stroke bg-white">
        <div class="relative aspect-square w-full">
        <Show when={props.image} fallback={<div class="absolute inset-0 bg-surface-gray" />}>
          {(img) => (
            <CoverImage
              colors={img().colors}
              src={img().src}
              fit={img().fit}
              class="absolute inset-0 size-full"
            />
          )}
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
      </div>
      <div class="flex min-h-[102px] min-w-0 flex-1 flex-col gap-2 p-4">
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
