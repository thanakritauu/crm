import { useNavigate, useParams } from "@solidjs/router";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { PageHeader } from "~/components/layout/page-header";
import { CoinIcon } from "~/components/mission/coin-icon";
import { AlertDialog } from "~/components/ui/modal";
import { Button } from "~/components/ui/button";
import { EmptyData } from "~/components/ui/empty-data";
import { PageLoading } from "~/components/ui/page-loading";
import { useI18n } from "~/lib/i18n";
import { sessionActions } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { cn, delay, formatNumber } from "~/lib/utils";
import { missionService } from "~/services/mission-service";
import { IconCheck } from "~/components/ui/icons";

/**
 * /:partner/quiz-activity/:id — กิจกรรมตอบคำถาม (id = id ภารกิจแบบ quiz เช่น m-002)
 * ต้นฉบับ: _id_-df5102d3.js — กล่องคำถาม bg-primary rounded-2xl + Hint, ตัวเลือก rounded-2xl border p-4
 * (เลือกแล้ว bg-primary-surface), ปุ่ม "ส่งคำตอบ" ติดล่าง; ตอบผิด → dialog "เกือบแล้ว!..." ให้ตอบใหม่
 * ต้นฉบับตอบถูกแล้วไปหน้า leaderboard — prototype ทำ 3 ข้อทีละข้อ แล้วแสดงหน้าสรุป + เพิ่มคอยน์ + dialog สำเร็จ
 * Mock: คำถามใน mocks/missions.ts (m-002.quiz)
 */
export default function QuizActivity() {
  const { t } = useI18n();
  const params = useParams();
  const navigate = useNavigate();
  const to = usePartnerPath();
  const [step, setStep] = createSignal(0);
  const [selected, setSelected] = createSignal<number | null>(null);
  const [wrongOpen, setWrongOpen] = createSignal(false);
  const [finished, setFinished] = createSignal(false);
  const [successOpen, setSuccessOpen] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  onMount(() => missionService.restore());

  const mission = createMemo(() => missionService.get(params.id ?? ""));
  const questions = () => mission()?.quiz ?? [];
  const question = () => questions()[step()];
  const alreadyDone = () => mission()?.status === "completed" && !finished();

  const submit = async () => {
    const q = question();
    const m = mission();
    if (!q || !m || selected() === null) return;
    if (selected() !== q.answer) return setWrongOpen(true);
    if (step() < questions().length - 1) {
      setStep((s) => s + 1);
      setSelected(null);
      return;
    }
    // ตอบครบทุกข้อ
    setLoading(true);
    await delay(700);
    if (m.status !== "completed") {
      missionService.complete(m.id);
      sessionActions.addCoins(m.reward_coins, { key: "loyalty.history_mission", params: { name: m.title } });
    }
    setLoading(false);
    setFinished(true);
    setSuccessOpen(true);
  };

  return (
    <div class="mx-auto flex h-full min-h-screen flex-1 flex-col bg-white">
      <PageHeader title={t("loyalty.quiz_title")} />
      <PageLoading show={loading()} />
      <Show
        when={mission() && questions().length > 0}
        fallback={
          <div class="flex flex-1 flex-col items-center justify-center px-4">
            <EmptyData title={t("mission.not_found_title")} description={t("mission.not_found_desc")} />
            <Button size="block" class="mt-4 max-w-xs" onClick={() => navigate(to("missions"))}>
              {t("mission.mission")}
            </Button>
          </div>
        }
      >
        <Show
          when={!finished() && !alreadyDone()}
          fallback={
            /* หน้าสรุปผล */
            <div class="flex flex-1 flex-col px-4">
              <div class="mt-4 flex min-h-[120px] w-full flex-col items-center rounded-2xl bg-primary p-6 text-center">
                <span class="inline-flex items-center justify-center rounded-full bg-white/20 p-4">
                  <IconCheck size={40} strokeWidth={2.5} class="text-white" />
                </span>
                <h2 class="mt-2 text-18 font-semibold text-white">{t("mission.congratulations")}</h2>
                <p class="mt-1 text-14 text-white/90">
                  {t("loyalty.quiz_score", { correct: questions().length, total: questions().length })} — {t("common.mission_complete")}
                </p>
                <div class="mt-4 flex items-center gap-x-2 rounded-full bg-white px-4 py-2">
                  <CoinIcon size={20} />
                  <span class="text-16 font-semibold text-teriary">
                    +{formatNumber(mission()!.reward_coins)} {t("common.coins")}
                  </span>
                </div>
              </div>
              <Show when={alreadyDone()}>
                <p class="mt-4 text-center text-12 text-gray">{t("mission.already_joined")}</p>
              </Show>
              <div class="mt-auto flex flex-col gap-2 py-4">
                <Show when={mission()!.has_leaderboard}>
                  <Button variant="secondary" size="block" onClick={() => navigate(to(`missions/${mission()!.id}/leaderboard`))}>
                    {t("common.coin_acc_ranking")}
                  </Button>
                </Show>
                <Button size="block" onClick={() => navigate(to(`missions/${mission()!.id}`))}>
                  {t("common.view_mission_detail")}
                </Button>
                <Button variant="ghost" size="block" class="text-gray" onClick={() => navigate(to("missions"))}>
                  {t("mission.mission")}
                </Button>
              </div>
            </div>
          }
        >
          <div class="px-4">
            <div class="min-h-[120px] w-full rounded-2xl bg-primary p-4">
              <p class="mb-2 text-center text-12 font-semibold text-white/80">
                {t("common.step")} {step() + 1}/{questions().length}
              </p>
              <h2 class="text-center text-16 font-semibold text-white">{question()?.question}</h2>
              <section id="hint" class="mt-2">
                <div class="flex min-h-12 items-center justify-center rounded-lg bg-white/20 p-2">
                  <strong class="text-14 font-semibold text-white">
                    {t("loyalty.hint")} <span class="font-normal">{question()?.hint}</span>
                  </strong>
                </div>
              </section>
            </div>
            <section id="choice" class="mt-4">
              <div class="grid grid-cols-12 gap-2">
                <For each={question()?.choices}>
                  {(choice, i) => (
                    <div
                      role="radio"
                      aria-checked={selected() === i()}
                      onClick={() => setSelected((s) => (s === i() ? null : i()))}
                      class={cn(
                        "col-span-12 cursor-pointer rounded-2xl border p-4 transition-all duration-300",
                        selected() === i() ? "border-primary bg-primary-surface text-primary" : "border-stroke bg-white text-dark",
                      )}
                    >
                      <div class="flex items-center justify-between gap-x-2">
                        <strong class="text-14 font-semibold">{choice}</strong>
                        <Show
                          when={selected() === i()}
                          fallback={<span class="size-6 flex-shrink-0 rounded-full border-2 border-stroke" />}
                        >
                          <span class="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white">
                            <IconCheck size={14} strokeWidth={3} />
                          </span>
                        </Show>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </section>
          </div>
          <div class="flex flex-1 flex-col justify-end p-4">
            <Button size="block" disabled={selected() === null} onClick={submit}>
              {step() < questions().length - 1 ? t("common.next") : t("loyalty.quiz_submit")}
            </Button>
          </div>
        </Show>
      </Show>

      <AlertDialog
        open={wrongOpen()}
        onOpenChange={setWrongOpen}
        title={t("loyalty.quiz_wrong_title")}
        description={t("loyalty.quiz_wrong_desc")}
        confirmText={t("common.ok")}
      />
      <AlertDialog
        open={successOpen()}
        onOpenChange={setSuccessOpen}
        title={t("common.reward_collect_success_title_amount", { amount: mission()?.reward_coins ?? 0, unit: t("common.unit.coins") })}
        description={t("common.reward_collect_coin_notify", { amount: mission()?.reward_coins ?? 0, mission: mission()?.title ?? "" })}
        icon={<CoinIcon size={32} />}
        confirmText={t("common.ok")}
      />
    </div>
  );
}
