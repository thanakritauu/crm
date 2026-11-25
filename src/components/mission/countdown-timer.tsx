import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { useI18n } from "~/lib/i18n";

/**
 * นับถอยหลังถึงวันสิ้นสุดกิจกรรม (ต้นฉบับ: countdown-timer.js — <span> ข้อความเดียวอัปเดตทุกวินาที)
 * แสดงหลัง mount เท่านั้น เพื่อไม่ให้ข้อความ SSR กับ client ไม่ตรงกัน
 */
export function CountdownTimer(props: { end: string; class?: string; onEnd?: () => void }) {
  const { t } = useI18n();
  const [left, setLeft] = createSignal<number | null>(null);
  onMount(() => {
    // ถือว่าสิ้นสุดตอนปลายวัน end_date (เวลาไทย)
    const endAt = new Date(`${props.end}T23:59:59+07:00`).getTime();
    const tick = () => {
      const ms = Math.max(0, endAt - Date.now());
      setLeft(ms);
      if (ms === 0) {
        clearInterval(timer);
        props.onEnd?.();
      }
    };
    const timer = setInterval(tick, 1000);
    tick();
    onCleanup(() => clearInterval(timer));
  });
  const pad = (n: number) => String(n).padStart(2, "0");
  const text = () => {
    const ms = left() ?? 0;
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${d > 0 ? `${t("loyalty.countdown_days", { days: d })} ` : ""}${pad(h)}:${pad(m)}:${pad(s % 60)}`;
  };
  return (
    <Show when={left() !== null} fallback={<span class={props.class}>&nbsp;</span>}>
      <span class={props.class}>{left() === 0 ? t("common.event_ended") : `${t("common.event_end_in")} ${text()}`}</span>
    </Show>
  );
}
