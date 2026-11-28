import { For } from "solid-js";
import { useI18n } from "~/lib/i18n";
import { cn } from "~/lib/utils";

/**
 * ความคืบหน้าแบบทีละขั้น (DSL 2026-11-28) — ต้นแบบ: ตอบคำถามตอนเชื่อมต่อแพลตฟอร์ม
 * กรอบขาว ขอบเทา มุม 16 padding 8 · "คำถามข้อที่ x / y" 12/Semibold ตัวดำ · ขีดแต่ละข้อสูง 8 ห่าง 4
 *   ข้อที่ผ่าน/ปัจจุบัน = ชมพู · ยังไม่ถึง = เทา · ข้อปัจจุบันทึบ ข้ออื่นจาง 60% · ไม่แสดง %
 * ใช้กับทุกหน้าที่ตอบคำถาม/ทำทีละขั้น (เชื่อมต่อแพลตฟอร์ม, ภารกิจตอบคำถาม …)
 */
export function StepProgress(props: { current: number; total: number; class?: string }) {
  const { t } = useI18n();
  return (
    <div class={cn("flex flex-col gap-2 rounded-2xl border border-stroke bg-white p-2", props.class)}>
      <span class="text-12 font-semibold text-dark">{t("platform.question_step_progress", { current: props.current + 1, total: props.total })}</span>
      <div class="flex items-center gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={props.total} aria-valuenow={props.current + 1}>
        <For each={Array.from({ length: props.total })}>
          {(_, i) => (
            <span
              class={cn("h-2 flex-1 rounded-full transition-all", i() <= props.current ? "bg-primary" : "bg-surface-gray", i() === props.current ? "opacity-100" : "opacity-60")}
            />
          )}
        </For>
      </div>
    </div>
  );
}
