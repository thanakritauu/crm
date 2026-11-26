import { cn } from "~/lib/utils";

/**
 * ป้ายตัวเลข (DSL 2026-11-26) — วงกลมกว้าง = สูง 20px · ขอบขาว 1px · ตัวขาว 12/Medium · เกิน 9 = "9+"
 * tone error = แดง (แจ้งเตือนที่ยังไม่อ่าน · คูปองที่ใช้ได้) · success = เขียว (จำนวนแพลตฟอร์มที่เชื่อมต่อแล้ว)
 * วางมุมขวาบนของไอคอน: class="absolute -right-1 -top-1"
 * text = ข้อความแทนตัวเลข เช่น "1/4" (จำนวนแพลตฟอร์มที่เชื่อมแล้ว/ทั้งหมด) → สูง 20 เท่าเดิม กว้างตามข้อความ (แคปซูล)
 */
export function CountBadge(props: { count?: number; text?: string; tone?: "error" | "success"; class?: string }) {
  return (
    <span
      class={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-white text-12 font-medium text-white",
        props.text ? "h-5 min-w-5 px-1" : "size-5",
        props.tone === "success" ? "bg-success" : "bg-error",
        props.class,
      )}
    >
      {props.text ?? ((props.count ?? 0) > 9 ? "9+" : props.count)}
    </span>
  );
}
