import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import type { Mission } from "~/mocks/missions";
import { useI18n } from "~/lib/i18n";
import { usePartnerPath } from "~/lib/theme";
import { CoinIcon } from "./coin-icon";
import { cn, formatDate } from "~/lib/utils";
import { cardClass } from "~/components/ui/card";

/**
 * การ์ดภารกิจแบบแนวนอน (TabSlide ในหน้า home)
 * Card p-4 + Badge teriary + ชื่อ 14/Semi + คำอธิบาย 14/Med gray line-clamp-2 + ปุ่มขวา (หน้าตา Button sm 32px) + progress
 */
export function MissionSlideCard(props: { mission: Mission; class?: string }) {
  const { t } = useI18n();
  const to = usePartnerPath();
  const m = () => props.mission;
  return (
    <A
      href={to(`missions/${m().id}`)}
      class={cn(cardClass, "block p-4", props.class)}
    >
      {/* ภารกิจสะสมคอยน์ = คอยน์ที่สะสมในภารกิจ · ภารกิจอื่น = คอยน์ที่จะได้ (ไม่มีรางวัลคอยน์ = ไม่แสดงป้าย) */}
      <Show
        when={m().type === "coin"}
        fallback={
          <Show when={m().reward_coins > 0}>
            <Badge size="md">
              <CoinIcon size={14} />+{m().reward_coins} {t("common.coins")}
            </Badge>
          </Show>
        }
      >
        <Badge size="md">
          <CoinIcon size={14} />
          {t("mis.coins_amount", { coins: m().coin_balance ?? 0 })}
        </Badge>
      </Show>
      <div class="mt-2 grid grid-cols-12 items-center">
        <div class="col-span-8 h-[65px]">
          <h2 class="truncate text-14 font-semibold text-dark">{m().title}</h2>
          <h2 class="mt-1 line-clamp-2 text-14 font-normal text-gray">{m().subtitle}</h2>
        </div>
        <div class="col-span-4 flex h-full items-center justify-end">
          <span
            class={cn(
              buttonVariants({ size: "sm" }),
              m().status === "completed" && "bg-success-surface text-success",
            )}
          >
            {m().status === "completed"
              ? t("common.success")
              : m().status === "in_progress"
                ? t("component.tab_slide_dialog.continue_mission")
                : t("component.tab_slide_dialog.start_mission")}
          </span>
        </div>
      </div>
      <Show when={m().target > 1}>
        <div class="mt-2">
          <Progress value={m().progress} max={m().target} />
        </div>
      </Show>
      <p class="mt-1 text-12 text-gray">{t("loyalty.until_date", { date: formatDate(m().end_date) })}</p>
    </A>
  );
}
