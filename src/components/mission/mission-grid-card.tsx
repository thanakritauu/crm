import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { CoverImage } from "~/components/ui/cover-image";
import { Progress } from "~/components/ui/progress";
import type { Mission } from "~/mocks/missions";
import { useI18n } from "~/lib/i18n";
import { usePartnerPath } from "~/lib/theme";
import { cn } from "~/lib/utils";
import { missionTrack } from "./mission-status";
import { CoinIcon } from "./coin-icon";
import { cardClass } from "~/components/ui/card";

/**
 * การ์ดภารกิจแบบ grid 2 คอลัมน์ในหน้า /mission
 * การ์ด rounded-2xl bg-white shadow-card — ภาพสี่เหลี่ยมจัตุรัส
 * ป้าย track มุมซ้ายบน 12/Semi, เนื้อหา p-2 min-h-[80px] ชื่อ 14/Semi สูงสุด 2 บรรทัด · รายละเอียด 12 สีเทา 1 บรรทัด
 * ภารกิจหมดเวลา: overlay กลางภาพ (SkeltonImageCanUseBase64 state="expired")
 */
export function MissionGridCard(props: { mission: Mission }) {
  const { t } = useI18n();
  const to = usePartnerPath();
  const m = () => props.mission;
  const track = () => missionTrack(m());
  return (
    <A
      href={to(`missions/${m().id}`)}
      class={cn(cardClass, "col-span-6 flex flex-col overflow-hidden")}
    >
      <div class="relative">
        <CoverImage colors={m().cover} src={m().image} label={m().title} class="aspect-square w-full rounded-t-2xl" />
        <Show when={m().status === "expired"}>
          <div class="absolute inset-0 flex items-center justify-center rounded-t-2xl bg-black/55 px-4 text-center text-14 font-semibold text-white">
            {t("common.mission_timeout")}
          </div>
        </Show>
        <Show when={track()}>
          {(tr) => (
            <h2 class={cn("absolute top-0 rounded-r-lg rounded-tl-2xl px-2 py-1 text-12 font-medium text-white", tr().class)}>
              {t(tr().key)}
            </h2>
          )}
        </Show>
      </div>
      <div class="flex min-h-[80px] flex-1 flex-col justify-between p-2">
        <div>
          {/* ชื่อสูงสุด 2 บรรทัด · รายละเอียด 1 บรรทัด (เกินตัด …) */}
          <h2 class="line-clamp-2 break-words text-left text-14 font-semibold text-dark">{m().title}</h2>
          <p class="line-clamp-1 break-all text-left text-12 font-normal text-gray">{m().subtitle}</p>
        </div>
        <Show when={m().target > 1}>
          <div class="mt-2">
            <Progress value={m().progress} max={m().target} />
          </div>
        </Show>
        {/* คอยน์: ภารกิจสะสมคอยน์ = คอยน์ของภารกิจนั้น (แยกจากยอดรวม) · ภารกิจอื่น = คอยน์ที่จะได้เมื่อสำเร็จ */}
        <Show
          when={m().type === "coin"}
          fallback={
            <Show when={m().reward_coins > 0}>
              <p class="mt-2 flex items-center gap-1 text-12 font-medium text-teriary">
                <CoinIcon size={14} />
                {t("club.mission_reward_coins", { coins: m().reward_coins })}
              </p>
            </Show>
          }
        >
          <p class="mt-2 flex items-center gap-1 text-12 font-medium text-teriary">
            <CoinIcon size={14} />
            {t("club.mission_reward_coins", { coins: m().coin_balance ?? 0 })}
          </p>
        </Show>
      </div>
    </A>
  );
}
