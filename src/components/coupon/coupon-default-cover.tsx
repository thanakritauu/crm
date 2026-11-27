import { Show } from "solid-js";
import { IconTicket } from "~/components/ui/icons";
import { cn } from "~/lib/utils";

/**
 * ภาพปกเริ่มต้นของคูปองที่ยังไม่มีรูป (2026-11-27) — ใช้ทั้งการ์ดคูปองและหน้ารายละเอียด
 * พื้นชมพูอ่อน + วงขาว ไอคอนตั๋วชมพู (DSL พื้นอ่อน + ไอคอนสีเดียวกันเข้ม) + มูลค่าส่วนลด (ถ้ามี) ตัวชมพู
 * ตัวอย่าง: คูปองจากการแลกคะแนน (ไม่มีรูปจาก backend)
 */
export function CouponDefaultCover(props: { discount?: string; class?: string; size?: "md" | "lg" }) {
  return (
    <div class={cn("flex flex-col items-center justify-center gap-2 bg-primary-surface text-primary", props.class)}>
      <span class={cn("flex items-center justify-center rounded-full bg-white", props.size === "lg" ? "size-16" : "size-12")}>
        <IconTicket size={props.size === "lg" ? 32 : 24} />
      </span>
      <Show when={props.discount}>
        <span class={cn("font-semibold", props.size === "lg" ? "text-24" : "text-18")}>{props.discount}</span>
      </Show>
    </div>
  );
}
