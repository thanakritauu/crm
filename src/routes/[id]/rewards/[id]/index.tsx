import { useParams } from "@solidjs/router";
import { Show } from "solid-js";
import PrivilegeDetail from "~/views/privilege-detail";
import RewardDetail from "~/views/reward-detail";

/**
 * /:partner/rewards/:id — รายละเอียดของที่แลกด้วยคะแนน (หน้าเดียวสำหรับทุกแคตตาล็อก)
 * id ขึ้นต้น "r-" = ของรางวัล (เดิม /reward/detail/:id) · อื่นๆ = สิทธิพิเศษ (เดิม /privilage/detail/:id)
 */
export default function RewardItemPage() {
  const params = useParams();
  return (
    <Show when={params.id?.startsWith("r-")} fallback={<PrivilegeDetail />}>
      <RewardDetail />
    </Show>
  );
}
