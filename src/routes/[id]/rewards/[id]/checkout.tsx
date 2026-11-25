import { useParams } from "@solidjs/router";
import { Show } from "solid-js";
import PrivilegeCheckout from "~/views/privilege-checkout";
import RewardCheckout from "~/views/reward-checkout";

/**
 * /:partner/rewards/:id/checkout — สรุปการแลก (ที่อยู่จัดส่ง + ยืนยัน)
 * id ขึ้นต้น "r-" = ของรางวัล (เดิม /reward/summarize?id=) · อื่นๆ = สิทธิพิเศษ (เดิม /privilage/summary/:id)
 */
export default function RewardCheckoutPage() {
  const params = useParams();
  return (
    <Show when={params.id?.startsWith("r-")} fallback={<PrivilegeCheckout />}>
      <RewardCheckout />
    </Show>
  );
}
