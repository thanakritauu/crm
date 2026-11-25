import { Show } from "solid-js";
import { cn } from "~/lib/utils";

/**
 * Toast (Figma Style=Style4 875:8405): พื้นเขียวอ่อน (ผิดพลาด = แดงอ่อน) มุม 16 + วงกลม 20px + ข้อความ 14/Medium
 * ลอยเหนือแถบล่าง 110px · role="status" ให้โปรแกรมอ่านหน้าจอประกาศ
 * แสดงเมื่อ text มีค่า (ผู้เรียกจัดการเวลาซ่อนเอง)
 */
export function Toast(props: { text?: string; tone?: "success" | "error" }) {
  const ok = () => props.tone !== "error";
  return (
    <Show when={props.text}>
      <div class="fixed-frame bottom-[110px] z-toast px-4">
        <div class={cn("flex items-center gap-2 rounded-2xl p-4", ok() ? "bg-success-surface" : "bg-error-surface")} role="status" aria-live="polite">
          <span class={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-12 text-white", ok() ? "bg-success" : "bg-error")} aria-hidden="true">
            {ok() ? "✓" : "!"}
          </span>
          <span class="text-14 font-medium text-dark">{props.text}</span>
        </div>
      </div>
    </Show>
  );
}
