import { createSignal, onMount, Show } from "solid-js";
import { IconRefresh } from "~/components/ui/icons";
import { ResultModal } from "~/components/ui/modal";
import { PageLoading } from "~/components/ui/page-loading";
import { useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { cn, delay, formatNumber } from "~/lib/utils";
import { earnService } from "~/services/earn-service";

/**
 * ปุ่มอัปเดตยอด — ใช้ร่วมกัน
 * - unit "points" (ค่าเริ่มต้น): อัปเดตคะแนนจากแพลตฟอร์มออนไลน์ — หัวข้อผลลัพธ์ต่างกันตามจุดที่กด
 *     หน้าแรก (inline): "อัปเดตคะแนนสำเร็จ คุณได้รับ X" · "คะแนนของคุณเป็นปัจจุบันแล้ว" (ยังไม่เชื่อมต่อ = ชวนเชื่อมต่อในคำอธิบาย)
 *     หน้าเชื่อมต่อแพลตฟอร์ม (header): "พบคำสั่งซื้อใหม่ N รายการ คุณได้รับ X" · "ไม่มีคำสั่งซื้อใหม่จากแพลตฟอร์มออนไลน์" · ยังไม่เชื่อมต่อ = error
 * - unit "all": ปุ่มเดียวหน้าแรก (วงกลมขาวข้างกระดิ่ง) อัปเดตทั้งคะแนนและคอยน์ → "อัปเดตคะแนนและคอยน์แล้ว / คะแนน X · คอยน์ Y"
 * - unit "coins": ดึงยอดคอยน์ล่าสุด → "คอยน์ของท่านเป็นปัจจุบันแล้ว · X คอยน์" (คอยน์ได้จากภารกิจ ไม่มีแหล่งให้ซิงค์)
 * variant
 * - header: วงกลมขาว 40px + เงา (มุมขวาบนหน้าเชื่อมต่อแพลตฟอร์ม — แบบเดียวกับกระดิ่งหน้าแรก)
 * - inline: ไอคอน 16px มุมขวาบนของการ์ดคะแนน/คอยน์หน้าแรก แทน ">" (พื้นที่กด 40px · อยู่เหนือลิงก์ของการ์ด)
 * นับถอยหลัง 5 นาที (2026-11-25 · แบบ production "อัพเดตคะแนนได้อีกครั้งใน 02:36 นาที"):
 * - กดอัปเดตจุดไหนก็ได้ → ทุกปุ่มอัปเดต (หน้าแรก · สะสมคะแนน · เชื่อมต่อแพลตฟอร์ม) กดไม่ได้ 5 นาที ใช้เวลาร่วมกัน (localStorage)
 * - ระหว่างรอ: ปุ่มแสดงเวลาที่เหลือ "04:59" แทนไอคอน · ครบเวลาแล้วกลับเป็นไอคอนรีเฟรช
 * - เมนู prototype › รีเซ็ตข้อมูลจำลอง ล้างเวลานับถอยหลัง (resetRefreshCooldown)
 */
const COOLDOWN_KEY = "charmiss-refresh-cooldown-until";
const COOLDOWN_MS = 5 * 60 * 1000;
const [cooldownUntil, setCooldownUntil] = createSignal(0);
const [nowMs, setNowMs] = createSignal(0);
let ticker: ReturnType<typeof setInterval> | undefined;

const tick = () => {
  if (ticker) return;
  ticker = setInterval(() => {
    setNowMs(Date.now());
    if (Date.now() >= cooldownUntil()) {
      clearInterval(ticker);
      ticker = undefined;
    }
  }, 1000);
};
const loadCooldown = () => {
  try {
    setCooldownUntil(Number(localStorage.getItem(COOLDOWN_KEY)) || 0);
  } catch {
    /* ignore */
  }
  setNowMs(Date.now());
  if (cooldownUntil() > Date.now()) tick();
};
const startCooldown = () => {
  const until = Date.now() + COOLDOWN_MS;
  setCooldownUntil(until);
  setNowMs(Date.now());
  try {
    localStorage.setItem(COOLDOWN_KEY, String(until));
  } catch {
    /* ignore */
  }
  tick();
};
/** มิลลิวินาทีที่เหลือก่อนกดอัปเดตได้อีกครั้ง (0 = กดได้) */
export const refreshRemaining = () => Math.max(0, cooldownUntil() - nowMs());
export const resetRefreshCooldown = () => {
  setCooldownUntil(0);
  try {
    localStorage.removeItem(COOLDOWN_KEY);
  } catch {
    /* ignore */
  }
};
const mmss = (ms: number) => {
  const sec = Math.ceil(ms / 1000);
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
};
export function PlatformRefreshButton(props: { class?: string; unit?: "points" | "coins" | "all"; variant?: "header" | "inline" }) {
  const { t } = useI18n();
  const [loading, setLoading] = createSignal(false);
  const [result, setResult] = createSignal<{ variant: "success" | "error"; title: string; description?: string } | null>(null);
  onMount(loadCooldown);
  const waiting = () => refreshRemaining() > 0;
  const coins = () => props.unit === "coins";

  const refresh = async (e: MouseEvent) => {
    // อยู่ในการ์ดที่ทั้งใบเป็นลิงก์ → ไม่ให้คลิกทะลุไปเปิดหน้าอื่น
    e.preventDefault();
    e.stopPropagation();
    if (waiting()) return;
    setLoading(true);
    await delay(900);
    setLoading(false);
    // เริ่มนับถอยหลัง 5 นาที (ใช้ร่วมทุกปุ่มอัปเดต)
    startCooldown();
    // หัวข้อผลลัพธ์แยกตามจุดที่กด: คอยน์ (หน้าแรก) · คะแนน (หน้าแรก) · หัวหน้าเชื่อมต่อแพลตฟอร์ม
    if (coins()) return setResult({ variant: "success", title: t("club.coins_is_now"), description: t("mis.coins_amount", { coins: formatNumber(session.customer.coins) }) });
    // ปุ่มเดียวหน้าแรก: อัปเดตทั้งคะแนน (จากแพลตฟอร์ม) และคอยน์ พร้อมกัน
    if (props.unit === "all") {
      const r = earnService.syncPlatforms();
      const balances = t("club.balances_now", { points: formatNumber(session.customer.points), coins: formatNumber(session.customer.coins) });
      return setResult({
        variant: "success",
        title: r.status === "success" ? `${t("club.balances_updated")}\n${t("dialog.refresh_point.you_received")} ${t("core.points_amount", { points: r.points })}` : t("club.balances_up_to_date"),
        description: balances,
      });
    }
    const home = props.variant === "inline";
    const total = t("core.total_points_amount", { points: formatNumber(session.customer.points) });
    const r = earnService.syncPlatforms();
    if (r.status === "not_connected")
      return home
        ? setResult({ variant: "success", title: t("club.points_is_now"), description: `${total}\n${t("club.connect_for_auto_points")}` })
        : setResult({ variant: "error", title: t("core.platform_not_connected_title"), description: t("core.platform_not_connected_desc") });
    if (r.status === "up_to_date")
      return setResult({ variant: "success", title: home ? t("club.points_is_now") : t("club.no_new_platform_orders"), description: total });
    setResult({
      variant: "success",
      title: home
        ? `${t("club.points_updated")}\n${t("dialog.refresh_point.you_received")} ${t("core.points_amount", { points: r.points })}`
        : `${t("club.new_platform_orders", { count: r.orders.length })}\n${t("dialog.refresh_point.you_received")} ${t("core.points_amount", { points: r.points })}`,
      description: t("core.from_orders_total", {
        count: r.orders.length,
        platforms: r.orders.map((o) => o.platform).join(", "),
        points: formatNumber(session.customer.points),
      }),
    });
  };

  return (
    <>
      <PageLoading show={loading()} message={t("common.loading")} />
      <button
        type="button"
        onClick={refresh}
        class={cn(
          props.variant === "inline"
            ? "hit-area relative z-raised flex shrink-0 items-center justify-center"
            : "flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-dark shadow-card",
          props.class,
        )}
        disabled={waiting()}
        aria-label={
          waiting()
            ? t("club.refresh_again_in", { time: mmss(refreshRemaining()) })
            : props.unit === "all"
              ? t("club.refresh_all")
              : coins()
                ? t("club.refresh_coins")
                : t("core.refresh_platform_points")
        }
      >
        {/* ระหว่างนับถอยหลัง: แสดงเวลาที่เหลือแทนไอคอน */}
        <Show when={waiting()} fallback={<IconRefresh size={props.variant === "inline" ? 16 : 24} />}>
          <span class="text-12 font-semibold tabular-nums text-gray">{mmss(refreshRemaining())}</span>
        </Show>
      </button>
      <ResultModal
        open={!!result()}
        onOpenChange={(o) => !o && setResult(null)}
        variant={result()?.variant}
        title={result()?.title ?? ""}
        description={result()?.description}
      />
    </>
  );
}
