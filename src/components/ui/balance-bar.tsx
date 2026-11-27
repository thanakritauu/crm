import { A } from "@solidjs/router";
import { Show, type JSX } from "solid-js";
import { CoinIcon } from "~/components/mission/coin-icon";
import { cardClass } from "~/components/ui/card";
import { IconChevronRight, IconClock } from "~/components/ui/icons";
import { useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { cn, formatNumber } from "~/lib/utils";
import { pointsExpire } from "~/prototype/settings";
import { tierStatus } from "~/services/tier-service";
import { PlatformRefreshButton } from "~/components/platform/platform-refresh-button";
import { CountUp } from "~/components/ui/count-up";
import { expiringPoints } from "~/services/history-service";

/**
 * แสดงคะแนน / คอยน์ — pattern เดียวทั้งแอป (ตัดสินใจ 2026-11-23: Option A + กฎ)
 *
 * กฎ
 * - ไอคอนซ้ายตัวเลขเสมอ (P = คะแนน, C = คอยน์) · หน่วยต่อท้ายตัวเลข · คะแนน = ชมพู, คอยน์ = ส้ม
 * - ขนาดตัวเลข: lg 24 (หน้าแรก) · md 18 (หน้าอื่น) · แถวสรุปตอนแลก 14 (RedeemSummary)
 * - แตะตัวแถบ → หน้าที่ใช้สกุลนั้น (คะแนน → แลกรางวัล · คอยน์ → ภารกิจ) · แตะ ">" มุมขวาบน → ประวัติของสกุลนั้น
 * - คะแนนใกล้หมดอายุ (โหมด "คะแนนมีวันหมดอายุ") → บรรทัดท้ายแถบคะแนน → แท็บหมดอายุ
 *
 * มี 2 รูปแบบ (ตัดสินใจ 2026-11-23)
 *   1. การ์ด 2 บรรทัด (ป้าย + ">" / ตัวเลข / วิธีได้) — หน้าแรก, โปรไฟล์ (BalanceSplit) และหน้าอื่น (ประวัติ, แลกคะแนนเป็นคูปอง, คอยน์ของภารกิจ)
 *   2. บรรทัดเดียว `inline` "คะแนนของคุณ ··· 1,250 คะแนน >" — เฉพาะหน้าแลกรางวัล (คะแนน) และหน้าภารกิจ (คอยน์)
 *      หลักการ: ใช้ UI/ขนาด/น้ำหนักเดียวกับการ์ดหน้าแรก แค่จัดให้อยู่บรรทัดเดียว
 * BalanceBar — แถบเดียว
 * BalanceSplit — สองแถบคู่กัน คะแนน | คอยน์ (หน้าแรก, โปรไฟล์) + บรรทัดวิธีได้ "ซื้อสินค้าเพื่อสะสม" / "ทำภารกิจเพื่อสะสม"
 */
export type BalanceUnit = "points" | "coins";

const SPEND: Record<BalanceUnit, string> = { points: "rewards", coins: "missions" };
// ประวัติแยกหน้า (2026-11-26) — หน้ารวม /wallet/history เข้าจากเมนูโปรไฟล์เท่านั้น
const HISTORY: Record<BalanceUnit, string> = { points: "wallet/points-history", coins: "wallet/coins-history" };

/** ring = ขอบขาวรอบไอคอน (ใช้บนพื้นชมพูเข้ม ไม่ให้ไอคอน P สีชมพูกลืนกับพื้น) */
export function BalanceIcon(props: { unit: BalanceUnit; size: number; ring?: boolean }) {
  const cls = () => (props.ring ? "rounded-full ring-1 ring-white" : undefined);
  return (
    <Show
      when={props.unit === "coins"}
      fallback={<img src="/images/icons/point.png" alt="" width={props.size} height={props.size} class={cls()} style={{ width: `${props.size}px`, height: `${props.size}px` }} />}
    >
      <CoinIcon size={props.size} class={cls()} />
    </Show>
  );
}

/** เนื้อในของแถบ (ใช้ทั้งแบบเดี่ยวและแบบคู่) */
function BalanceBody(props: {
  unit: BalanceUnit;
  amount: number;
  label?: string;
  size: "lg" | "md";
  /** ปลายทางเมื่อแตะแถบ (ค่าเริ่มต้น: หน้าที่ใช้สกุลนั้น) · false = แตะไม่ได้ (เช่นอยู่หน้านั้นอยู่แล้ว) */
  href?: string | false;
  /** false = ไม่แสดงลิงก์ประวัติ (เช่นอยู่หน้าประวัติ / คอยน์ของภารกิจ) */
  history?: boolean;
  /** บรรทัดบอกวิธีได้ใต้ตัวเลข (12 เทา) — การ์ดคู่หน้าแรก/โปรไฟล์ */
  hint?: string;
  /** อยู่บนพื้นชมพูเข้ม (แบบ B) → ตัวอักษรทั้งหมดสีขาว */
  onBrand?: boolean;
  /** ไอคอนรีเฟรชแทน ">" มุมขวา (การ์ดหน้าแรก) — ไม่มีลิงก์ประวัติ */
  refresh?: boolean;
  /** ตัวเลขนับขึ้น/ลงเมื่อยอดเปลี่ยน (หน้าแรก) */
  countUp?: boolean;
}) {
  const { t } = useI18n();
  const to = usePartnerPath();
  const coins = () => props.unit === "coins";
  // การ์ดหน้าแรก/โปรไฟล์ (มีบรรทัดวิธีได้): กดได้แค่ ">" → ประวัติ (ตัวการ์ด/ไอคอนไม่เป็นลิงก์ — ตัดสินใจ 2026-11-25)
  const href = () => (props.href === false || props.hint ? undefined : to(props.href ?? SPEND[props.unit]));
  // ">" = ประวัติของสกุลนั้น (ตัวแถบพาไปแลกรางวัล/ภารกิจ) — ตัดสินใจ 2026-11-23
  const historyLink = () => (
    <Show when={props.history !== false && !props.refresh}>
      <A
        href={to(HISTORY[props.unit])}
        class={cn("hit-area relative z-raised flex shrink-0 items-center", props.onBrand ? "text-white" : "text-gray")}
        aria-label={t(coins() ? "club.coins_history" : "club.points_history")}
      >
        <IconChevronRight size={16} />
      </A>
    </Show>
  );
  return (
    <div class="relative flex min-w-0 flex-1 flex-col gap-1 p-4">
      {/* stretched link: ทั้งแถบแตะได้ · ลิงก์ประวัติอยู่ชั้นบน */}
      <Show when={href()}>{(h) => <A href={h()} class="absolute inset-0" aria-label={props.label ?? t(coins() ? "club.your_coins" : "club.your_points")} />}</Show>
      <span class="flex items-center justify-between gap-2">
        <span class="flex min-w-0 items-center gap-1">
          <BalanceIcon unit={props.unit} size={16} />
          {/* "คะแนนของคุณ / คอยน์ของคุณ" สีดำ ขนาดเท่าคำว่า "คะแนน" ข้างตัวเลข (14/Medium — 2026-11-26) */}
          <span class={cn("truncate text-14 font-medium", props.onBrand ? "text-white" : "text-dark")}>{props.label ?? t(coins() ? "club.your_coins" : "club.your_points")}</span>
        </span>
        {/* การ์ดหน้าแรก: ไอคอนรีเฟรชแทน ">" ตำแหน่งเดียวกัน (กดแล้วอัปเดตยอดทันที) · อื่นๆ: ">" = ประวัติ */}
        <Show when={props.refresh}>
          <PlatformRefreshButton variant="inline" unit={props.unit} class={props.onBrand ? "text-white" : "text-gray"} />
        </Show>
        {/* ">" → ประวัติของสกุลนั้น อยู่บรรทัดเดียวกับ "คะแนนของคุณ / คอยน์ของคุณ" (2026-11-25) */}
        {historyLink()}
      </span>
      <span class={cn("flex items-baseline gap-1", props.onBrand ? "text-white" : coins() ? "text-teriary" : "text-primary")}>
        <span class={cn("truncate font-semibold", props.size === "lg" ? "text-24" : "text-18")}>
          <Show when={props.countUp} fallback={formatNumber(props.amount)}>
            <CountUp value={props.amount} id={props.unit} waitFor={props.unit} />
          </Show>
        </span>
        <span class="shrink-0 text-14 font-medium">{coins() ? t("common.coins") : t("common.points")}</span>
      </span>
      <Show when={props.hint}>
        {/* ชิดตัวเลขขึ้น (-mt-1) */}
        <span class={cn("-mt-1 truncate text-12", props.onBrand ? "text-white" : "text-gray")}>{props.hint}</span>
      </Show>
    </div>
  );
}

/**
 * คอลัมน์ระดับสมาชิก (แบบ A — คะแนนอย่างเดียว: ซ้ายคะแนน | ขวาระดับ แทนคอยน์ · 2026-11-27)
 * โครงเดียวกับฝั่งคอยน์: ป้าย "ระดับสมาชิกของคุณ" 14/Medium + ตรา 16 (ไม่มี ">") · ชื่อระดับ Semibold ขนาดเท่ายอดคะแนน (ตัด … ถ้ายาว) · แถบความคืบหน้า + "อีก X คะแนน" 12 เทา
 * ทั้งคอลัมน์ → หน้าระดับสมาชิก
 */
function TierColumn(props: { onBrand?: boolean; size?: "lg" | "md" }) {
  const { t } = useI18n();
  const to = usePartnerPath();
  const tier = () => tierStatus();
  // ครึ่งการ์ด → ชื่อระดับแบบสั้น ตัด "Charmiss " นำหน้า (Charmiss Radiance → Radiance) ไม่ให้โดนตัด … (2026-11-27)
  const shortName = (id: string) => t(`tier.name_${id}`).replace(/^Charmiss\s+/i, "");
  return (
    // justify-between: บรรทัดล่างสุด (แถบ + "อีก X คะแนน") ตรงกับ "ซื้อสินค้าเพื่อสะสมคะแนน" ฝั่งคะแนน (2026-11-27)
    <A href={to("profile/tier")} class="flex min-w-0 flex-1 flex-col justify-between gap-1 p-4">
      {/* ไม่มี ">" แล้ว ให้ "ระดับสมาชิกของคุณ" แสดงเต็ม (ทั้งคอลัมน์ยังกดไปหน้าระดับสมาชิกได้ · 2026-11-27) */}
      <span class="flex min-w-0 items-center gap-1">
        <img src={tier().current.mark} alt="" width="16" height="16" class="size-4 shrink-0 object-contain" />
        <span class={cn("truncate text-14 font-medium", props.onBrand ? "text-white" : "text-dark")}>{t("tier.your_tier")}</span>
      </span>
      {/* ชื่อระดับขนาดเท่ายอดคะแนนฝั่งซ้าย (lg 24 · md 18 · 2026-11-27) */}
      <span class={cn("truncate font-semibold", props.size === "lg" ? "text-24" : "text-18", props.onBrand ? "text-white" : "text-primary")}>
        {shortName(tier().current.id)}
      </span>
      <span class="flex items-center gap-2">
        <span class="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-gray">
          <span class="block h-1 rounded-full bg-primary" style={{ width: `${Math.round(tier().progress * 100)}%` }} />
        </span>
        <span class={cn("shrink-0 text-12", props.onBrand ? "text-white" : "text-gray")}>
          <Show when={tier().next} fallback={t("tier.top_short")}>
            {t("tier.to_next_short", { points: formatNumber(tier().needed) })}
          </Show>
        </span>
      </span>
    </A>
  );
}

/** บรรทัดคะแนนใกล้หมดอายุ (ท้ายแถบคะแนน) */
function ExpiringLine(props: { onBrand?: boolean }) {
  const to = usePartnerPath();
  // ก้อนที่ใกล้หมดอายุที่สุดที่ยังไม่หมด (id = "exp-<วันหมดอายุ YYYY-MM-DD>")
  const next = () => (pointsExpire() ? expiringPoints().find((e) => new Date(e.id.slice(4)).getTime() >= Date.now()) : undefined);
  return (
    <Show when={next()}>
      {(e) => (
        <A
          href={to("wallet/points-history?filter=expired")}
          class={cn("flex items-center gap-2 border-t px-4 py-2 text-12", props.onBrand ? "border-white/30 text-white" : "border-stroke text-warning")}
        >
          <IconClock size={16} class="shrink-0" />
          <span class="min-w-0 flex-1 truncate">{e().title}</span>
          <IconChevronRight size={16} class={cn("shrink-0", props.onBrand ? "text-white" : "text-gray")} />
        </A>
      )}
    </Show>
  );
}

/**
 * แบบบรรทัดเดียว (หน้าแลกรางวัล = คะแนน · หน้าภารกิจ = คอยน์): "คะแนนของคุณ ······ 1,250 คะแนน >"
 * อยู่หน้าที่ใช้สกุลนั้นแล้ว → ทั้งแถบแตะไปประวัติของสกุลนั้น
 */
function BalanceInline(props: { unit: BalanceUnit; amount: number; label?: string; link?: boolean; countId?: string }) {
  const { t } = useI18n();
  const to = usePartnerPath();
  const coins = () => props.unit === "coins";
  const body = () => (
    <>
      {/* ไอคอน 24 · ป้าย 14 Medium (ใหญ่กว่าการ์ดคู่ เพราะมีที่ทั้งบรรทัด) · ตัวเลข 24 Semibold · หน่วย 14 Medium · ">" 16 เว้นจากหน่วย 8 */}
      <span class="flex min-w-0 items-center gap-2">
        <BalanceIcon unit={props.unit} size={24} />
        <span class="truncate text-14 font-medium text-dark">{props.label ?? t(coins() ? "club.your_coins" : "club.your_points")}</span>
      </span>
      <span class={cn("flex shrink-0 items-center gap-2", coins() ? "text-teriary" : "text-primary")}>
        <span class="flex items-baseline gap-1">
          {/* countId: ปลายทางเหรียญปลิว + ตัวเลขนับขึ้น (ยอดคอยน์ของภารกิจ) */}
          <span class="text-24 font-semibold" data-fly-target={props.countId}>
            <Show when={props.countId} fallback={formatNumber(props.amount)}>
              {(id) => <CountUp value={props.amount} id={id()} waitFor={id()} />}
            </Show>
          </span>
          <span class="text-14 font-medium">{coins() ? t("common.coins") : t("common.points")}</span>
        </span>
        <Show when={props.link !== false}>
          <IconChevronRight size={16} class="text-gray" />
        </Show>
      </span>
    </>
  );
  return (
    <Show when={props.link !== false} fallback={<div class="flex items-center justify-between gap-2 p-4">{body()}</div>}>
      <A href={to(HISTORY[props.unit])} class="flex items-center justify-between gap-2 p-4" aria-label={t(coins() ? "club.coins_history" : "club.points_history")}>
        {body()}
      </A>
    </Show>
  );
}

export function BalanceBar(props: {
  unit: BalanceUnit;
  /** บรรทัดเดียว (หน้าแลกรางวัล/ภารกิจ) */
  inline?: boolean;
  /** ค่าเริ่มต้น: ยอดของผู้ใช้ (session) */
  amount?: number;
  label?: string;
  size?: "lg" | "md";
  href?: string | false;
  history?: boolean;
  class?: string;
  /** (inline) ปลายทางเหรียญปลิว + ตัวเลขนับขึ้น เช่น "mission-coins:<id>" */
  countId?: string;
  /** เนื้อหาเพิ่มใต้แถบยอดในการ์ดเดียวกัน (เช่น ความคืบหน้าจำนวนครั้งของภารกิจสะสมคอยน์) */
  extra?: JSX.Element;
}) {
  const amount = () => props.amount ?? (props.unit === "coins" ? session.customer.coins : session.customer.points);
  return (
    <div class={cn(cardClass, "flex flex-col text-left", props.class)}>
      <Show
        when={props.inline}
        fallback={<BalanceBody unit={props.unit} amount={amount()} label={props.label} size={props.size ?? "md"} href={props.href} history={props.history} />}
      >
        <BalanceInline unit={props.unit} amount={amount()} label={props.label} link={props.history !== false} countId={props.countId} />
      </Show>
      {props.extra}
      <Show when={props.unit === "points" && props.amount === undefined}>
        <ExpiringLine />
      </Show>
    </div>
  );
}

export function BalanceSplit(props: {
  size?: "lg" | "md";
  class?: string;
  /** pink = พื้นชมพูอ่อน (แบบ A) · brand = พื้นชมพูเข้มทึบ ตัวอักษรขาว (แบบ B — สีคะแนน/คอยน์เหมือนกัน เหลือไอคอน P/C แยก) */
  tone?: "white" | "pink" | "brand";
  /** ไอคอนรีเฟรชแทน ">" ทั้งคะแนนและคอยน์ (หน้าแรก) */
  refresh?: boolean;
  /** ปลายทางเมื่อแตะฝั่งคะแนน (ค่าเริ่มต้น: แลกรางวัล) — หน้าแรกใช้ "earn" (สะสมคะแนน) */
  pointsHref?: string;
  /** ตัวเลขนับขึ้น/ลงเมื่อยอดเปลี่ยน */
  countUp?: boolean;
  /** false = ไม่มี ">" ประวัติ (หน้าแรก: อัปเดตด้วยปุ่มรีเฟรชข้างกระดิ่งแทน) */
  history?: boolean;
  /** แสดงสกุลเดียว (หน้าแรก — ตัวเลือก prototype) · ไม่ใส่ = ทั้งคะแนนและคอยน์ */
  only?: "points" | "coins";
  /** ระดับสมาชิกเป็นคอลัมน์ขวาของการ์ดคะแนน (ใช้กับ only="points" — แบบ A) */
  tierInline?: boolean;
}) {
  const { t } = useI18n();
  const pink = () => props.tone === "pink";
  const brand = () => props.tone === "brand";
  const tierCol = () => !!props.tierInline && props.only === "points";
  // ป้าย "คะแนนของคุณ" / "คอยน์ของคุณ" (ขอให้ชัดว่าเป็นยอดของผู้ใช้ — ลิงก์ประวัติเหลือแค่ ">" จึงพอดีครึ่งความกว้าง)
  // สีตัวอักษรคงเดิมทั้งสองโทน: คะแนนชมพู · คอยน์ส้ม · ป้าย/วิธีได้สีเทา → ยังแยกสองสกุลได้ชัด
  return (
    <div class={cn(cardClass, "flex flex-col text-left", pink() && "bg-primary-surface", brand() && "bg-primary", props.class)}>
      {/* only = สกุลเดียวเต็มความกว้าง · ไม่ใส่ = 2 คอลัมน์ คะแนน | คอยน์ */}
      {/* คะแนนอย่างเดียว + ระดับ (แบบ A) = 2 คอลัมน์ คะแนน | ระดับ */}
      <div class={cn("grid divide-x", props.only && !tierCol() ? "grid-cols-1" : "grid-cols-2", pink() ? "divide-white" : brand() ? "divide-white/30" : "divide-stroke")}>
        <Show when={props.only !== "coins"}>
          <BalanceBody unit="points" amount={session.customer.points} label={t("club.your_points")} hint={t("club.points_how")} size={props.size ?? "md"} onBrand={brand()} refresh={props.refresh} href={props.pointsHref} countUp={props.countUp} history={props.history} />
        </Show>
        <Show when={tierCol()}>
          <TierColumn onBrand={brand()} size={props.size} />
        </Show>
        <Show when={props.only !== "points"}>
          <BalanceBody unit="coins" amount={session.customer.coins} label={t("club.your_coins")} hint={t("club.coins_how")} size={props.size ?? "md"} onBrand={brand()} refresh={props.refresh} countUp={props.countUp} history={props.history} />
        </Show>
      </div>
      <Show when={props.only !== "coins"}>
        <ExpiringLine onBrand={brand()} />
      </Show>
    </div>
  );
}

/**
 * แถวสรุปตอนแลก (บนปุ่มล่างของหน้ารายละเอียด / สรุปการแลก / แลกรางวัลของภารกิจ)
 * ซ้าย "ใช้ X คะแนน" (ไม่พอ = "ขาดอีก X คะแนน" สีแดง) · ขวา "คงเหลือ (P) 1,250" · ตัวเลข 14
 */
export function RedeemSummary(props: { unit: BalanceUnit; cost: number; balance?: number }) {
  const { t } = useI18n();
  const coins = () => props.unit === "coins";
  const balance = () => props.balance ?? (coins() ? session.customer.coins : session.customer.points);
  const short = () => props.cost - balance();
  return (
    <div class="flex items-center justify-between gap-2 text-14">
      <Show
        when={short() > 0}
        fallback={<span class="font-semibold text-dark">{coins() ? t("mis.use_coins", { coins: formatNumber(props.cost) }) : t("core.use_points", { points: formatNumber(props.cost) })}</span>}
      >
        <span class="font-semibold text-error">{t(coins() ? "club.short_coins" : "club.short_points", { amount: formatNumber(short()) })}</span>
      </Show>
      <span class="flex shrink-0 items-center gap-1 text-gray">
        {t("club.balance")}
        <BalanceIcon unit={props.unit} size={16} />
        <span class={cn("font-semibold", coins() ? "text-teriary" : "text-primary")}>{formatNumber(balance())}</span>
      </span>
    </div>
  );
}
