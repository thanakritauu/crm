import type { ParentComponent } from "solid-js";
import { cn } from "~/lib/utils";

/**
 * BottomActionBar (footer ของหน้า) — แถบปุ่มติดล่างจอ
 * พื้นขาว padding 16 มุมบน 16 + shadow-card (flat = ไม่มีมุม/เงา) · Spacer สูง 96 (ปุ่ม 48 + padding)
 * prototype ใช้ .fixed-frame เพื่อไม่ให้ล้นกรอบมือถือบนจอใหญ่
 * อย่าลืมเว้นที่ด้านล่างของหน้า (<BottomActionBarSpacer />)
 */
export const BottomActionBar: ParentComponent<{ class?: string; flat?: boolean }> = (props) => (
  <div
    class={cn(
      "fixed-frame bottom-0 z-bar bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
      !props.flat && "rounded-t-2xl shadow-card",
      props.class,
    )}
  >
    {props.children}
  </div>
);

export const BottomActionBarSpacer = () => <div class="h-24" aria-hidden="true" />;
