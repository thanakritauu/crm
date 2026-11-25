import { useNavigate, useParams } from "@solidjs/router";
import { createMemo, For, onMount, Show } from "solid-js";
import { BottomActionBar, BottomActionBarSpacer } from "~/components/layout/bottom-action-bar";
import { PageHeader } from "~/components/layout/page-header";
import { CountdownTimer } from "~/components/mission/countdown-timer";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { EmptyData } from "~/components/ui/empty-data";
import type { LeaderboardEntry } from "~/mocks/missions";
import { useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { cn, formatDate, formatNumber } from "~/lib/utils";
import { missionService } from "~/services/mission-service";

/**
 * /:partner/leaderboard/:id — อันดับการสะสมคอยน์ของภารกิจ
 * ต้นฉบับ: _id_-980bb7c4.js
 * - PageHeader ชมพู + ชื่อภารกิจ (Badge teriary) + section#end-event นับถอยหลัง
 * - โพเดียม 3 อันดับแรก (กลางสูง 162px, ข้าง 97×132) — ต้นฉบับใช้รูป /images/badge-1..3.png ซึ่งไม่มี จึงวาดเหรียญเอง
 * - รายการอันดับ rounded-2xl p-4 bg-primary-surface ห่างกัน 8 + วงกลมเลขอันดับ bg-primary
 * - กล่อง "คอยน์ที่สะสมทั้งหมด / คุณอยู่อันดับที่" ของผู้ใช้ (prototype ปักไว้ด้านล่างจอ)
 * Mock: missionService.leaderboard (แถว me ใช้คอยน์ปัจจุบันจาก session)
 */
const MEDAL = ["bg-medal-gold", "bg-medal-silver", "bg-medal-bronze"];

function Medal(props: { rank: number; class?: string }) {
  return (
    <span
      class={cn("flex items-center justify-center rounded-full border-2 border-white text-12 font-semibold text-white shadow-card", MEDAL[props.rank - 1], props.class)}
    >
      {props.rank}
    </span>
  );
}

export default function Leaderboard() {
  const { t } = useI18n();
  const params = useParams();
  const navigate = useNavigate();
  const to = usePartnerPath();
  onMount(() => missionService.restore());

  const mission = createMemo(() => missionService.get(params.id ?? ""));
  const rows = createMemo<LeaderboardEntry[]>(() =>
    missionService.leaderboard(params.id ?? "").map((r) => (r.me ? { ...r, name: session.customer.name, coins: session.customer.coins } : r)),
  );
  const top3 = () => rows().filter((r) => !r.me).slice(0, 3);
  const others = () => rows().filter((r) => !r.me && r.rank > 3);
  const me = () => rows().find((r) => r.me);

  const PodiumCard = (p: { entry?: LeaderboardEntry; big?: boolean }) => (
    <Show when={p.entry}>
      {(e) => (
        <div
          class={cn(
            "relative bg-white text-center",
            p.big ? "-mt-6 h-[162px] w-[132px] self-start rounded-2xl p-6 shadow-card" : "h-[132px] w-[97px] rounded-2xl p-4 shadow-card",
          )}
        >
          <Medal rank={e().rank} class={p.big ? "absolute -top-5 left-1/2 size-10 -translate-x-1/2" : "mx-auto -mt-8 size-8"} />
          <div class={cn("line-clamp-1 truncate font-semibold text-gray", p.big ? "text-14" : "mt-2 text-12")}>{e().name}</div>
          <div class={cn("font-semibold text-dark", p.big ? "mt-2 text-24" : "pt-1 text-16")}>{formatNumber(e().coins)}</div>
          <div class="-mt-1 text-12 font-semibold text-dark">{t("common.coins")}</div>
          <div class="mt-2 text-12 font-normal text-gray">{t("common.leaderboard.rank_alt", { rank: e().rank })}</div>
        </div>
      )}
    </Show>
  );

  return (
    <div class="min-h-screen bg-white">
      <Show
        when={mission()?.has_leaderboard ? mission() : undefined}
        fallback={
          <div class="flex min-h-screen flex-col">
            <PageHeader title={t("common.coin_acc_ranking")} backTo="missions" />
            <div class="flex flex-1 flex-col items-center justify-center px-4">
              <EmptyData title={mission() ? t("common.mission_not_leaderboard") : t("common.mission_not_found")} />
              <Button size="block" class="mt-4 max-w-xs" onClick={() => navigate(to("missions"))}>
                {t("mission.mission")}
              </Button>
            </div>
          </div>
        }
      >
        {(m) => (
          <>
            <PageHeader tone="primary" align="center" backTo={`missions/${params.id}`} title={t("common.coin_acc_ranking")} class="pb-6">
              <div class="flex flex-col items-center gap-2">
                <Badge size="lg" class="max-w-full">
                  <strong class="truncate font-semibold">{m().title}</strong>
                </Badge>
                <section id="end-event" class="text-center">
                  <Show when={m().status !== "expired"} fallback={<span class="text-12 text-white">{t("common.leaderboard.event_ended")}</span>}>
                    <CountdownTimer end={m().end_date} class="text-12 font-normal text-white" />
                  </Show>
                </section>
                {/* โพเดียม: อันดับ 2 | 1 | 3 */}
                <div class="mt-12 flex items-center justify-center gap-2">
                  <PodiumCard entry={top3()[1]} />
                  <PodiumCard entry={top3()[0]} big />
                  <PodiumCard entry={top3()[2]} />
                </div>
              </div>
            </PageHeader>

            <section>
              <div class="flex flex-col gap-2 px-4 pb-6 pt-4">
                <For each={others()}>
                  {(r) => (
                    <div class="flex items-center justify-between rounded-2xl bg-primary-surface p-4">
                      <div class="flex min-w-0 flex-1 items-center gap-x-2 pr-2">
                        <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-14 font-semibold text-white">{r.rank}</span>
                        <span class="block min-w-0 truncate text-14 font-semibold text-dark">{r.name}</span>
                      </div>
                      <div class="flex flex-shrink-0 flex-col items-end whitespace-nowrap">
                        <div class="flex items-center gap-x-1">
                          <span class="text-16 font-semibold text-dark">{formatNumber(r.coins)}</span>
                          <span class="text-12 font-semibold text-dark">{t("common.coins")}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
                <div class="pt-2 text-center">
                  <p class="text-12 font-normal text-gray">
                    {t("common.last_updated")}: {formatDate(new Date("2026-11-17T09:00:00+07:00"), true)}
                  </p>
                  <p class="text-12 font-normal text-gray">*{t("common.the_ranking_change")}</p>
                </div>
              </div>
            </section>

            <Show when={me()}>
              {(e) => (
                <>
                  <BottomActionBarSpacer />
                  <BottomActionBar>
                    <div class="flex items-center justify-between rounded-2xl bg-primary-surface p-4">
                      <strong class="flex min-w-0 items-center gap-x-2 text-14 text-dark">
                        <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-14 font-semibold text-white">{e().rank}</span>
                        <div class="flex min-w-0 flex-col items-start">
                          <h2 class="line-clamp-1 text-14 font-semibold">{t("common.leaderboard.you_are_ranked", { rank: e().rank })}</h2>
                          <p class="text-12 font-normal text-gray">{t("common.total_coin")}</p>
                        </div>
                      </strong>
                      <div class="ml-4 flex items-center gap-x-1 whitespace-nowrap">
                        <span class="text-18 font-semibold text-dark">{formatNumber(e().coins)}</span>
                        <span class="text-12 font-semibold text-dark">{t("common.coins")}</span>
                      </div>
                    </div>
                  </BottomActionBar>
                </>
              )}
            </Show>
          </>
        )}
      </Show>
    </div>
  );
}
