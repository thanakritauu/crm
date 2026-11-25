import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { CoinIcon } from "~/components/mission/coin-icon";
import { cardClass } from "~/components/ui/card";
import { CoverImage } from "~/components/ui/cover-image";
import { IconLock } from "~/components/ui/icons";
import { useI18n } from "~/lib/i18n";
import { useTheme } from "~/lib/theme";
import { cn, formatNumber } from "~/lib/utils";

/**
 * การ์ดของรางวัลแบบ grid 2 คอลัมน์ (แบบ Okya) — ใช้ร่วมกัน: หน้าแรก "แลกด้วยคะแนน", แท็บสิทธิพิเศษ/ของรางวัล, รางวัลของภารกิจ
 * - รูป 1:1 ด้านบน · ชื่อ 14/Semi สูงสุด 2 บรรทัด (เกินตัด …) · ราคา (ไอคอน + จำนวน) · ไม่แสดงจำนวนคงเหลือ (หมด = ป้ายทับรูป)
 * - overlay: ข้อความทับรูป (หมดเขต / หมด / แลกแล้ว) — มาก่อนสถานะล็อก
 * - ยอดไม่พอ (balance < cost) → รูปจาง + ไอคอนกุญแจ + "ขาดอีก X คะแนน/คอยน์" ใต้ราคา
 * - unit: points (ไอคอนคะแนนของธีม สีชมพู) | coins (เหรียญ C สีส้ม) — สองสกุลแยกกันเสมอ
 */
export function RewardGridCard(props: {
  /** ลิงก์ไปหน้ารายละเอียด หรือ onClick (เช่นคูปองที่แลกผ่าน dialog) */
  href?: string;
  onClick?: () => void;
  image: { colors: [string, string]; src?: string };
  title: string;
  cost: number;
  unit: "points" | "coins";
  balance: number;
  overlay?: string;
  class?: string;
}) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const short = () => Math.max(0, props.cost - props.balance);
  const locked = () => !props.overlay && short() > 0;
  const coins = () => props.unit === "coins";
  const body = () => (
    <>
      <div class="relative aspect-square w-full">
        <CoverImage colors={props.image.colors} src={props.image.src} label={props.title} class="absolute inset-0 size-full" />
        <Show when={props.overlay}>
          <span class="absolute inset-0 flex items-center justify-center bg-black/40 px-2 text-center text-14 font-medium text-white">{props.overlay}</span>
        </Show>
        <Show when={locked()}>
          <span class="absolute inset-0 flex items-center justify-center bg-white/50">
            <span class="flex size-10 items-center justify-center rounded-full bg-dark/60 text-white">
              <IconLock size={24} />
            </span>
          </span>
        </Show>
      </div>
      <div class="flex flex-1 flex-col justify-between gap-2 p-2">
        <p class="line-clamp-2 break-words text-14 font-semibold text-dark">{props.title}</p>
        <div class="flex flex-col">
          <p class={cn("flex items-center gap-1 text-14 font-medium", coins() ? "text-teriary" : "text-primary")}>
            <Show when={coins()} fallback={<img src={theme().image_point} alt="" class="size-4 rounded-full object-cover" />}>
              <CoinIcon size={16} />
            </Show>
            {coins() ? t("mis.use_coins", { coins: formatNumber(props.cost) }) : t("core.use_points", { points: formatNumber(props.cost) })}
          </p>
          <Show when={locked()}>
            <p class="text-12 text-gray">{t(coins() ? "club.short_coins" : "club.short_points", { amount: formatNumber(short()) })}</p>
          </Show>
        </div>
      </div>
    </>
  );
  return (
    <Show
      when={props.href}
      fallback={
        <button type="button" onClick={props.onClick} class={cn(cardClass, "flex flex-col overflow-hidden text-left", props.class)}>
          {body()}
        </button>
      }
    >
      <A href={props.href!} class={cn(cardClass, "flex flex-col overflow-hidden", props.class)}>
        {body()}
      </A>
    </Show>
  );
}
