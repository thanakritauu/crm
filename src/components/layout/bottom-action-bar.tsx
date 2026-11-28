import type { ParentComponent } from "solid-js";
import { cn } from "~/lib/utils";

/**
 * BottomActionBar (footer ของหน้า) — แถบปุ่มติดล่างจอ · แบบเดียวทั้งเว็บ (DSL 2026-11-28)
 * ต้นแบบ: หน้ากรอกหมายเลขคำสั่งซื้อ (ยืนยันบัญชีแพลตฟอร์ม) — พื้นขาว มุมบน 16 + shadow-card · ซ้าย/ขวา/บน 16 · ล่าง 32 (หรือ safe area ถ้ามากกว่า)
 * ปุ่มข้างใน size="block" (สูง 48) · 2 ปุ่ม = grid 2 คอลัมน์ ห่าง 16 (ปุ่มรองซ้าย · ปุ่มหลักขวา)
 * ห้ามทำปุ่มล่างแบบไม่ลอย (div mt-auto p-4) ในหน้าใหม่ — ใช้คอมโพเนนต์นี้ + <BottomActionBarSpacer />
 * Spacer สูง 112 (ปุ่ม 48 + บน 16 + ล่าง 32 + เผื่อ 16)
 * prototype ใช้ .fixed-frame เพื่อไม่ให้ล้นกรอบมือถือบนจอใหญ่
 * อย่าลืมเว้นที่ด้านล่างของหน้า (<BottomActionBarSpacer />)
 */
export const BottomActionBar: ParentComponent<{ class?: string; flat?: boolean }> = (props) => (
  <div
    class={cn(
      "fixed-frame bottom-0 z-bar bg-white p-4 pb-[max(2rem,env(safe-area-inset-bottom))]",
      !props.flat && "rounded-t-2xl shadow-card",
      props.class,
    )}
  >
    {props.children}
  </div>
);

export const BottomActionBarSpacer = () => <div class="h-28" aria-hidden="true" />;
