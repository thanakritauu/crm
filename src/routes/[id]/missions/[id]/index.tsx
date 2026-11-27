import { A, useNavigate, useParams } from "@solidjs/router";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { ResultModal } from "~/components/ui/modal";
import { DetailActionBar, DetailLayout, DetailMeta, DetailSectionTitle, DetailTitle } from "~/components/detail/detail-layout";
import { CoinIcon } from "~/components/mission/coin-icon";
import { BalanceBar } from "~/components/ui/balance-bar";
import { CountdownTimer } from "~/components/mission/countdown-timer";
import { InfoTabs } from "~/components/ui/info-tabs";
import { isCoinTarget, missionActionPath, missionCtaLabel, missionFull } from "~/components/mission/mission-status";
import { StampGrid } from "~/components/mission/stamp-grid";
import { AlertDialog } from "~/components/ui/modal";
import { Button } from "~/components/ui/button";
import { CoverImage } from "~/components/ui/cover-image";
import { EmptyData } from "~/components/ui/empty-data";
import { useI18n } from "~/lib/i18n";
import { usePartnerPath } from "~/lib/theme";
import { formatDate, formatNumber } from "~/lib/utils";
import { missionService } from "~/services/mission-service";
import { rewardService } from "~/services/reward-service";
import { Badge } from "~/components/ui/badge";
import { ImageRowCard } from "~/components/ui/image-row-card";
import { Card } from "~/components/ui/card";
import type { Mission } from "~/mocks/missions";
import { IconCalendar, IconCheck, IconChevronRight, IconClock, IconInfo, IconRanking } from "~/components/ui/icons";

/**
 * /:partner/mission/detail/:id — รายละเอียดภารกิจ
 * ต้นฉบับ: _id_-7feeb608.js (+ countdown-timer, dialog-redeem, mission-capability)
 * - ภาพ banner aspect-cover + แถบสถานะ h-10 (teriary-light = ความคืบหน้า, success = สำเร็จ)
 * - section#title: ชื่อ 16/700, คำอธิบาย (ดูเพิ่ม/ย่อ), ระยะเวลาภารกิจ, นับถอยหลัง
 * - section#product-top-down: "รางวัลที่แลกได้" (bg-primary-surface rounded-t-[16px]) + ระยะเวลาการแลก
 * - section#mission-info-tabs: ขั้นตอน / เงื่อนไข
 * - BottomActionBar ปุ่ม block ตามสถานะ; เริ่มภารกิจต้องยืนยันใน dialog ก่อน (mission.confirm_join_mission)
 * Figma Mission:
 * - ภารกิจสะสมคอยน์ (type "coin"): แถบ "จำนวนคอยน์ที่สะสมได้" · กติกาได้คอยน์ · "รางวัลที่แลกได้" ราคาเป็นคอยน์
 *   กดรางวัล → ยืนยันใช้คอยน์ → แลกสำเร็จ (คอยน์ไม่พอ = แจ้งเตือน) · รางวัลที่แลกแล้ว/หมดเขตแลก มีป้ายทับรูป
 * - ภารกิจแสตมป์: กดรางวัลก่อนทำสำเร็จ → "ยังไม่สามารถแลกสินค้าได้ในตอนนี้" · ทำครบแล้วเปิดหน้านี้ครั้งแรก → "ยินดีด้วย"
 * Mock: missionService (start/addProgress เก็บใน store), ไม่มีการเรียก API
 */
export default function MissionDetail() {
  const { t } = useI18n();
  const params = useParams();
  const navigate = useNavigate();
  const to = usePartnerPath();
  const [expanded, setExpanded] = createSignal(false);
  const [confirmOpen, setConfirmOpen] = createSignal(false);
  onMount(() => missionService.restore());

  const mission = createMemo(() => missionService.get(params.id ?? ""));
  const rewards = createMemo(() => (mission()?.reward_ids ?? []).map((id) => rewardService.get(id)).filter((r) => !!r));
  const isCoin = () => mission()?.type === "coin";
  const coinRewards = createMemo(() =>
    (mission()?.coin_rewards ?? []).map((cr) => ({ ...cr, reward: rewardService.get(cr.reward_id)! })).filter((x) => !!x.reward),
  );
  const [coinTarget, setCoinTarget] = createSignal<{ reward_id: string; coins: number; name: string }>();
  const [notice, setNotice] = createSignal<null | "cannot_redeem" | "not_enough" | "coin_success" | "congrats">(null);
  const [missingCoins, setMissingCoins] = createSignal(0);
  const [checkinResult, setCheckinResult] = createSignal<ReturnType<typeof missionService.checkIn> | null>(null);
  // AlertDialog ปิดตัวเอง (onOpenChange) ก่อนเรียก onConfirm → เก็บรางวัลที่เลือกไว้แยก
  let pendingReward = "";

  // ทำภารกิจครบแล้วกลับมาหน้านี้ครั้งแรก → "ยินดีด้วย"
  onMount(() => {
    const m = mission();
    if (m && missionService.needsCelebration(m.id)) {
      missionService.markCelebrated(m.id);
      setNotice("congrats");
    }
  });

  /** กดรางวัลของภารกิจแสตมป์ */
  const openReward = (rewardId: string) => {
    const m = mission();
    if (m && m.status !== "completed") return setNotice("cannot_redeem");
    navigate(to(`rewards/${rewardId}`));
  };

  /** กดรางวัลของภารกิจสะสมคอยน์ */
  const pickCoinReward = (cr: { reward_id: string; coins: number; reward: { name: string } }) => {
    const m = mission()!;
    if (missionService.coinRewardState(m, cr.reward_id) !== "available") return;
    if ((m.coin_balance ?? 0) < cr.coins) {
      setMissingCoins(cr.coins - (m.coin_balance ?? 0));
      return setNotice("not_enough");
    }
    pendingReward = cr.reward_id;
    setCoinTarget({ reward_id: cr.reward_id, coins: cr.coins, name: cr.reward.name });
  };

  const joinQuestion = () => {
    const m = mission();
    if (m?.type === "coin") return t("mis.start_question_desc");
    if (m?.type === "stamp") return `${t("mission.confirm_join_mission_stamp_question")} ${t("mission.confirm_join_mission_coin_question_2")}`;
    if (m?.type === "receipt") return `${t("mission.confirm_join_mission_coin_question")} ${t("mission.confirm_join_mission_coin_question_2")}`;
    return t("mission.confirm_join_mission_question");
  };

  const onCta = () => {
    const m = mission();
    if (!m) return;
    if (m.status === "not_started") return setConfirmOpen(true);
    if (m.type === "checkin" && m.status === "in_progress") return setCheckinResult(missionService.checkIn(m.id));
    if (m.status === "in_progress" && missionFull(m)) return;
    if (m.status === "in_progress") return navigate(to(missionActionPath(m)));
    if (m.status === "completed" && m.reward_ids.length) return navigate(to(`missions/${m.id}/rewards/${m.reward_ids[0]}`));
  };

  const ctaDisabled = () => {
    const m = mission();
    return (
      !m ||
      m.status === "expired" ||
      (m.status === "completed" && !m.reward_ids.length) ||
      (m.type === "checkin" && m.status === "in_progress" && missionService.checkedInToday(m)) ||
      // สะสมครบเป้าแล้ว (แสตมป์/ใบเสร็จ/เช็คอิน/สะสมคอยน์แบบมีเป้า) → ปุ่มกดไม่ได้ (ตัดสินใจ 2026-11-25)
      (m.status === "in_progress" && missionFull(m))
    );
  };

  return (
    <Show
      when={mission()}
      fallback={
        <div class="flex min-h-screen flex-col items-center justify-center bg-white px-4">
          <EmptyData title={t("mission.not_found_title")} description={t("mission.mission_not_found")} />
          <Button size="block" class="mt-4 max-w-xs" onClick={() => navigate(to("missions"))}>
            {t("mission.mission")}
          </Button>
        </div>
      }
    >
      {(m) => (
        <DetailLayout
          title={t("mission.mission")}
          backTo="missions"
          cover={{
            colors: m().cover,
            src: m().image,
            overlay: m().status === "expired" ? { text: t("common.mission_timeout"), tone: "dark" } : undefined,
          }}
          status={
            // ไม่มีแถบสถานะใต้รูปแล้ว — ความคืบหน้า/สำเร็จ อยู่ในการ์ด MissionProgressCard ทั้งกำลังทำและสำเร็จแล้ว (2026-11-27)
            // แถบเขียวเหลือเฉพาะภารกิจที่ไม่มีเป้าและไม่ใช่ภารกิจสะสมคอยน์
            <Show when={!isCoin() && m().status === "completed" && !(m().target > 0)}>
              <div class="flex h-10 w-full items-center justify-between bg-success px-4">
                <span class="text-14 font-semibold text-white">{t("mission.mission_completed")}</span>
                <span class="flex items-center gap-1 text-14 font-semibold text-white">
                  <CoinIcon size={14} />
                  {formatNumber(m().reward_coins)} {t("common.coins")}
                </span>
              </div>
            </Show>
          }
        >
          {/* ความคืบหน้า = การ์ดแยก ทุกภารกิจที่มีเป้า (แสตมป์ / ใบเสร็จ / เช็คอิน / ควิซ / สะสมคอยน์แบบมีจำนวนครั้ง) — ทั้งกำลังทำและสำเร็จแล้ว (2026-11-27) */}
          <Show when={m().target > 0 && m().status !== "expired"}>
            <MissionProgressCard mission={m()} />
          </Show>
          {/* คอยน์ของภารกิจนี้ (แยกจากคอยน์รวม) — BalanceBar pattern เดียวกับทุกหน้า */}
          <Show when={isCoin()}>
            <BalanceBar
              unit="coins"
              inline
              amount={m().coin_balance ?? 0}
              label={t("club.this_mission_coins")}
              history={false}
              countId={`mission-coins:${m().id}`}
            />
          </Show>
          <DetailTitle title={m().title} description={m().description}>
            <Show when={m().coin_rules?.length}>
              <ul class="list-disc pl-6 text-14 text-dark">
                <For each={m().coin_rules}>{(r) => <li>{r}</li>}</For>
              </ul>
            </Show>
          </DetailTitle>
          <DetailMeta
            items={[
              { icon: IconCalendar, text: `${t("mission.mission_duration")}: ${formatDate(m().start_date)} - ${formatDate(m().end_date)}` },
              isCoin() &&
                !!m().redeem_start &&
                !!m().redeem_end && { icon: IconCalendar, text: `${t("mission.redemption_period")}: ${formatDate(m().redeem_start!)} - ${formatDate(m().redeem_end!)}` },
              {
                icon: IconClock,
                text: m().status !== "expired" ? <CountdownTimer end={m().end_date} class="text-14 text-gray" /> : t("common.event_ended"),
              },
            ]}
          />

          {/* ตารางแสตมป์ */}
          <Show when={m().type === "stamp"}>
            <div class="flex flex-col gap-2">
              <DetailSectionTitle>{t("common.earn_stamps_from_mission")}</DetailSectionTitle>
              <StampGrid progress={m().progress} target={m().target} />
            </div>
          </Show>

          {/* อันดับ */}
          <Show when={m().has_leaderboard}>
            <A href={to(`missions/${m().id}/leaderboard`)} class="flex h-14 items-center justify-between rounded-2xl bg-secondary-surface px-4">
              <span class="flex items-center gap-2 text-14 font-semibold text-secondary">
                <IconRanking size={20} />
                {t("common.coin_acc_ranking")}
              </span>
              <IconChevronRight size={16} class="text-secondary" />
            </A>
          </Show>

          {/* รางวัลที่แลกได้หลังทำภารกิจ — การ์ดแบบเดียวกับรางวัลของภารกิจสะสมคอยน์ (ImageRowCard: รูป 1:1 102px · ชื่อสูงสุด 2 บรรทัด — 2026-11-26) */}
          <Show when={rewards().length > 0}>
            <section class="flex flex-col gap-4 rounded-2xl bg-primary-surface p-4">
              <div>
                <h2 class="text-16 font-semibold text-primary">{t("mission.reward_can_redeem")}</h2>
                <Show when={m().redeem_start && m().redeem_end}>
                  <p class="mt-1 text-12 text-gray">
                    {t("mission.redemption_period")}: {formatDate(m().redeem_start!)} - {formatDate(m().redeem_end!)}
                  </p>
                </Show>
              </div>
              <For each={rewards()}>
                {(r) => (
                  <ImageRowCard
                    onClick={() => openReward(r!.id)}
                    image={{ colors: r!.cover, src: r!.image }}
                    badge={
                      <Badge>
                        <Show when={m().redeem_coins} fallback={t("mission.use_your_rights_to_redeem")}>
                          <CoinIcon size={14} />
                          {formatNumber(m().redeem_coins)} {t("common.coins")}
                        </Show>
                      </Badge>
                    }
                    title={r!.name}
                  />
                )}
              </For>
              <Show when={m().status !== "completed"}>
                <p class="text-12 text-gray">{t("mission.complete_mission_description")}</p>
              </Show>
            </section>
          </Show>

          {/* รางวัลที่แลกได้ด้วยคอยน์ของภารกิจ (Figma Mission coin) */}
          <Show when={isCoin() && coinRewards().length > 0}>
            <section class="flex flex-col gap-4 rounded-2xl bg-primary-surface p-4">
              <h2 class="text-16 font-semibold text-primary">{t("mis.rewards_title")}</h2>
              <For each={coinRewards()}>
                {(cr) => {
                  const st = () => missionService.coinRewardState(m(), cr.reward_id);
                  return (
                    <ImageRowCard
                      onClick={() => pickCoinReward(cr)}
                      image={{ colors: cr.reward.cover, src: cr.reward.image }}
                      overlay={st() === "redeemed" ? t("mis.redeemed") : st() === "redeem_expired" ? t("mis.redeem_expired") : undefined}
                      overlayTone="gray"
                      badge={
                        // ป้าย "ใช้ X คอยน์" + (คอยน์ไม่พอ) "ขาดอีก X คอยน์" บรรทัดเดียวกัน → การ์ดสูง 102 รูป 1:1 พอดี (2026-11-26)
                        <span class="flex items-center gap-2">
                          <Badge>
                            <CoinIcon size={14} />
                            {t("mis.use_coins", { coins: cr.coins })}
                          </Badge>
                          <Show when={st() === "available" && (m().coin_balance ?? 0) < cr.coins}>
                            <span class="text-12 text-error">{t("club.short_coins_brief", { amount: formatNumber(cr.coins - (m().coin_balance ?? 0)) })}</span>
                          </Show>
                        </span>
                      }
                      title={cr.reward.name}
                    />
                  );
                }}
              </For>
            </section>
          </Show>

          <InfoTabs
            hideEmpty
            items={[
              { value: "howto", label: t("common.step"), content: m().how_to ?? [] },
              { value: "condition", label: t("common.condition"), content: m().conditions },
            ]}
          />

          <DetailActionBar>
            <Button size="block" disabled={ctaDisabled()} onClick={onCta}>
              <Show when={m().status === "completed"}>
                <IconCheck size={20} strokeWidth={2.5} />
              </Show>
              {missionCtaLabel(m(), t, missionService.checkedInToday(m()))}
            </Button>
          </DetailActionBar>

            <AlertDialog
              open={!!coinTarget()}
              onOpenChange={(o) => !o && setCoinTarget(undefined)}
              tone="warning"
              icon={<CoinIcon size={28} />}
              title={t("mis.confirm_coin_redeem", { coins: coinTarget()?.coins ?? 0 })}
              description={t("mis.confirm_coin_redeem_desc", { reward: coinTarget()?.name ?? "" })}
              cancelText={t("common.cancel")}
              confirmText={t("common.confirm")}
              onConfirm={() => {
                const r = missionService.redeemCoinReward(m().id, pendingReward);
                setCoinTarget(undefined);
                if (r === "ok") setNotice("coin_success");
              }}
            />
            <ResultModal
              open={notice() === "coin_success" || notice() === "congrats"}
              onOpenChange={(o) => !o && setNotice(null)}
              title={notice() === "congrats" ? t("mis.congrats_title") : t("mis.coin_redeem_success")}
              description={notice() === "congrats" ? t("mis.congrats_desc", { mission: m().title }) : t("mis.coin_redeem_success_desc")}
            />
            <AlertDialog
              open={notice() === "cannot_redeem" || notice() === "not_enough"}
              onOpenChange={(o) => !o && setNotice(null)}
              tone="warning"
              icon={<IconInfo size={24} />}
              title={notice() === "not_enough" ? t("mis.not_enough_coins") : t("mis.cannot_redeem_title")}
              description={notice() === "not_enough" ? t("mis.not_enough_coins_desc", { coins: missingCoins() }) : t("mis.cannot_redeem_desc")}
              confirmText={t("common.ok")}
            />
            <AlertDialog
              open={confirmOpen()}
              onOpenChange={setConfirmOpen}
              title={isCoin() ? t("mis.start_question") : t("mission.confirm_join_mission")}
              description={joinQuestion()}
              tone="warning"
              icon={<CoinIcon size={28} />}
              cancelText={t("common.cancel")}
              confirmText={t("common.get_started")}
              onConfirm={() => {
                missionService.start(m().id);
                // เช็คอิน: เริ่มแล้วเช็คอินวันแรกเลย
                if (m().type === "checkin") return setCheckinResult(missionService.checkIn(m().id));
                navigate(to(missionActionPath(m())));
              }}
            />
            <ResultModal
              open={!!checkinResult()}
              onOpenChange={(o) => !o && setCheckinResult(null)}
              variant={checkinResult()?.variant}
              title={checkinResult()?.title ?? ""}
              description={checkinResult()?.description}
            />
        </DetailLayout>
      )}
    </Show>
  );
}

/**
 * การ์ดความคืบหน้าภารกิจ (2026-11-27) — แยกจากรูป/แถบสถานะ ให้รู้ง่ายว่าต้องทำอีกเท่าไร
 * หัว "ความคืบหน้า" + "2/5 ครั้ง" (ตัวดำ · DSL) · แถบ 8px · บรรทัดสรุป:
 *  - สะสมคอยน์แบบมีจำนวนครั้ง: "สะสมได้อีก 3 ครั้ง · ครั้งละ 10 คอยน์" (ได้คอยน์ทุกครั้ง)
 *  - อื่นๆ: "อีก 3 ดวง รับ 20 คอยน์" (ได้คอยน์เมื่อทำครบ) · ไม่มีคอยน์ = "อีก 3 ครั้ง ภารกิจสำเร็จ"
 *  สำเร็จแล้ว/ครบแล้ว: แถบเขียวเต็ม + ✓ (แทนแถบเขียวใต้รูป)
 *  บรรทัดสรุปเป็นตัวดำ น้ำหนักปกติทั้งบรรทัด (ไม่มีตัวหนา/สีเหลือง · 2026-11-27)
 *  หน่วย: แสตมป์ = ดวง · เช็คอิน = วัน · ควิซ = ข้อ · อื่นๆ = ครั้ง
 */
function MissionProgressCard(props: { mission: Mission }) {
  const { t } = useI18n();
  const m = () => props.mission;
  const unit = () => t(m().type === "stamp" ? "mis.unit_stamps" : m().type === "checkin" ? "mis.unit_days" : m().type === "quiz" ? "mis.unit_questions" : "mis.unit_times");
  const done = () => m().status === "completed" || missionFull(m());
  const shown = () => (done() ? m().target : m().progress);
  const left = () => Math.max(0, m().target - m().progress);
  const pct = () => Math.round((shown() / Math.max(1, m().target)) * 100);
  return (
    <Card class="flex flex-col gap-2 p-4">
      <div class="flex items-center justify-between gap-2">
        <span class="text-14 font-medium text-dark">{t("mis.progress_title")}</span>
        <span class="text-14 font-semibold text-dark">
          {shown()}/{m().target} {unit()}
        </span>
      </div>
      <div class={`h-2 w-full overflow-hidden rounded-full ${done() ? "bg-success-surface" : "bg-warning-surface"}`}>
        <div class={`h-2 rounded-full ${done() ? "bg-success" : "bg-teriary"}`} style={{ width: `${pct()}%` }} />
      </div>
      {/* สำเร็จแล้ว/ครบแล้ว: ✓ "ภารกิจสำเร็จ · ได้รับ 30 คอยน์" · สะสมคอยน์แบบมีจำนวนครั้ง = "สะสมครบ 5 ครั้งแล้ว" */}
      <Show
        when={!done()}
        fallback={
          <p class="flex items-center gap-1 text-14 text-dark">
            <IconCheck size={16} class="shrink-0 text-success" />
            <Show
              when={isCoinTarget(m())}
              fallback={
                <span>
                  <span>{t("mission.mission_completed")}</span>
                  <Show when={m().reward_coins > 0}> · {t("mis.coin_target_collected", { coins: formatNumber(m().reward_coins) })}</Show>
                </span>
              }
            >
              <span>{t("mis.collected_all", { n: m().target, unit: unit() })}</span>
            </Show>
          </p>
        }
      >
        <p class="text-14 text-dark">
        <Show
          when={isCoinTarget(m())}
          fallback={
            <>
              {t("mis.more_prefix")} <span>{`${left()} ${unit()}`}</span>{" "}
              <Show when={m().reward_coins > 0} fallback={t("mis.to_complete")}>
                {t("mis.get_prefix")} <span>{`${formatNumber(m().reward_coins)} ${t("common.coins")}`}</span>
              </Show>
            </>
          }
        >
          {t("mis.times_left_prefix")} <span>{`${left()} ${unit()}`}</span> · {t("mis.times_each_prefix")}{" "}
          <span>{`${formatNumber(m().coins_per_collect ?? 10)} ${t("common.coins")}`}</span>
        </Show>
        </p>
      </Show>
    </Card>
  );
}
