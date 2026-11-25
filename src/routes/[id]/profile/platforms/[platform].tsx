import { useParams } from "@solidjs/router";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { FIGMA_FIELD_LABEL } from "~/components/figma/question-example";
import { PageHeader } from "~/components/layout/page-header";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ResultModal } from "~/components/ui/modal";
import { BottomActionBar, BottomActionBarSpacer } from "~/components/layout/bottom-action-bar";
import { PageLoading } from "~/components/ui/page-loading";
import { useI18n } from "~/lib/i18n";
import { session, sessionActions } from "~/lib/session";
import { cn, delay } from "~/lib/utils";
import { restorePlatformState } from "~/mocks/platforms";
import { normalizePlatform, platformService, type PlatformQuestion } from "~/services/platform-service";
import { useMemberOnly } from "~/lib/member-gate";
import { IconInfo } from "~/components/ui/icons";
import { useBackWith, useGoBack } from "~/lib/navigation";

/**
 * /:partner/online-platform-connection/question-answer/:platform — ยืนยันบัญชีแพลตฟอร์มด้วยหมายเลขคำสั่งซื้อ
 * ต้นฉบับ: _platform_-f97d41a1.js
 * Flow ตามเว็บจริง (ตรวจ 2026-11-25 · club.charmiss.co/…/question-answer/:platform):
 *   ขั้น 1: กรอกหมายเลขคำสั่งซื้อ + รูปตัวอย่าง (tutorial ของแต่ละแพลตฟอร์ม) · ปุ่มล่าง "ยกเลิก" (→ หน้ารายการ) | "ตรวจสอบคำสั่งซื้อ"
 *     → dialog "คำแนะนำ" ("คุณกำลังจะทำการเชื่อมต่อข้อมูล X ด้วยหมายเลขคำสั่งซื้อ … โปรดตอบคำถามที่ถูกต้องทั้ง N ข้อ…") ปุ่มเดียว "เริ่มตอบคำถาม"
 *     · คำสั่งซื้อยืนยันแล้ว/ไม่ต้องตอบคำถาม → เชื่อมต่อทันที
 *   ขั้น 2: แถบความคืบหน้า "คำถามข้อที่ x / y" + % + ขีดแต่ละข้อ · คำถามทีละข้อ + รูปตัวอย่างของฟิลด์นั้น (guideline) · ตัวเลือก
 *     ปุ่มล่าง "ย้อนกลับ" | "ถัดไป" · ย้อนจากข้อแรก = กลับขั้น 1 และล้างหมายเลขคำสั่งซื้อ
 *   ตอบผิด → แจ้งเตือน "เชื่อมต่อไม่สำเร็จ" + modal ผิดพลาด → กลับขั้น 1 ล้างหมายเลข/คำตอบ
 *   สำเร็จ → แจ้งเตือน "เชื่อมต่อเรียบร้อยแล้ว" + modal สำเร็จ (LINE Shopping: แจ้งว่าซิงค์เบอร์โทรแล้ว) → ตกลง = หน้ารายการ
 * Mock (platform-service): เลขคำสั่งซื้อ < 6 ตัว = ไม่พบคำสั่งซื้อ · ขึ้นต้นด้วย X = ตอบผิด · U = บัญชีถูกคนอื่นเชื่อมแล้ว · V = ยืนยันแล้ว (ข้ามคำถาม)
 *   · เลขเดียวกับบัญชีที่เชื่อมอยู่ = เคยเชื่อมแล้ว · อื่น ๆ ตอบข้อใดก็ผ่าน
 * ผลไม่สำเร็จ (Figma Modal_AllNonSuccess / Permotation): ไม่พบหมายเลขคำสั่งซื้อ · เชื่อมต่อบัญชี X ไม่สำเร็จ (ตอบผิด → กลับขั้น 1
 *   โดยเก็บหมายเลขเดิม) · บัญชีนี้เคยเชื่อมต่อกับ Charmiss แล้ว / บัญชีนี้ถูกเชื่อมต่อแล้ว
 * หน้าตาตาม Figma Connect Platform: input_Receipt_* (589:6184), Question* (589:6213), Connected (589:13544), Modal_AllNonSuccess (589:14097)
 * รูปจากเว็บจริง: public/images/connect-platform/tutorial/<platform>.png · guideline/<platform>/<question_type>.png (ไม่มีรูป = ซ่อน)
 */
const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
const LOOKBACK_DAYS = 90;

export default function PlatformQuestionAnswer() {
  useMemberOnly();
  const { t } = useI18n();
  const params = useParams();
  const goBack = useGoBack();
  const backWith = useBackWith();
  onMount(restorePlatformState);

  const key = () => normalizePlatform(params.platform);
  const platform = createMemo(() => (key() ? platformService.get(key()!) : undefined));
  const name = () => platform()?.display_name ?? params.platform ?? "";

  const [step, setStep] = createSignal<1 | 2>(1);
  const [orderNumber, setOrderNumber] = createSignal("");
  const [questions, setQuestions] = createSignal<PlatformQuestion[]>([]);
  const [current, setCurrent] = createSignal(0);
  const [answers, setAnswers] = createSignal<(string | null)[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [suggestOpen, setSuggestOpen] = createSignal(false);
  const [error, setError] = createSignal<{ title: string; description: string; leave?: boolean }>();
  const [success, setSuccess] = createSignal(false);

  // ปุ่ม < / ปิด modal → หน้าก่อนหน้า (ไม่มี → รายการแพลตฟอร์ม)
  const backToList = () => goBack("profile/platforms");
  const question = () => questions()[current()];
  const total = () => Math.max(1, questions().length);

  onMount(() => {
    if (!platform()) setError({ title: t("platform.status.platform_not_supported"), description: t("core.check_and_retry"), leave: true });
    else if (!platform()!.is_enabled) setError({ title: t("platform.status.platform_disabled"), description: t("core.check_and_retry"), leave: true });
  });

  /** ข้อความ modal ไม่สำเร็จตาม Figma (หัวข้อ + คำอธิบาย) */
  const errorFor = (status: string) => {
    switch (status) {
      case "order_not_found":
        return { title: t("core.order_number_not_found"), description: t("core.check_and_retry") };
      case "answer_incorrect":
        return { title: t("core.connect_failed", { platform: name() }), description: t("core.please_try_again") };
      case "self_mapped":
        return { title: t("core.account_connected_before"), description: t("core.cannot_reconnect") };
      case "other_mapped":
        return { title: t("core.account_already_connected"), description: t("core.cannot_reconnect") };
      default:
        return { title: t(`platform.status.${status}`), description: t("core.check_and_retry") };
    }
  };

  const answerHint = (n: number) =>
    n === 1
      ? t("platform.please_answer_1_question_correctly_verify")
      : n === 3
        ? t("platform.please_answer_all_3_questions_correctly_verify")
        : t("platform.please_answer_n_questions_correctly_verify", { count: n });

  const questionText = (q: PlatformQuestion) => {
    const field = `<span class="text-primary text-16" style="font-weight: 600">${t(`platform.select.fields.${q.question_type}`)}</span>`;
    const key = /discount/.test(q.question_type) ? "platform.please_select_field_of_platform_incase_more_than_one" : "platform.please_select_field_of_platform";
    return t(key, { field, orderNumber: orderNumber().trim() });
  };

  /** เชื่อมต่อสำเร็จ: แจ้งเตือน + modal สำเร็จ (เว็บจริง) */
  const onBound = () => {
    sessionActions.pushNotification({ key: "seed_platform_connected", params: { platform: name() }, type: "other", icon: "bell", link: "profile/platforms" });
    setSuccess(true);
  };
  /** เชื่อมต่อไม่สำเร็จหลังตอบคำถาม: แจ้งเตือน + modal + กลับขั้น 1 ล้างหมายเลข/คำตอบ (เว็บจริง) */
  const onBindFailed = (status: string) => {
    sessionActions.pushNotification({ key: "platform_bind_failed", params: { platform: name() }, type: "other", icon: "bell", link: "profile/platforms" });
    setError(errorFor(status));
    resetToStep1();
  };

  const verify = async () => {
    const p = key();
    if (!p || !orderNumber().trim()) return;
    setLoading(true);
    await delay(700);
    const res = platformService.verifyOrder(p, orderNumber());
    setLoading(false);
    if (!res.result) return setError(errorFor(res.status));
    // ยืนยันแล้ว / ไม่ต้องตอบคำถาม → เชื่อมต่อทันที
    if (res.skip_questions) {
      const bound = platformService.submitAnswers(p, orderNumber());
      return bound.result ? onBound() : onBindFailed(bound.status);
    }
    setQuestions(res.questions);
    setAnswers(res.questions.map(() => null));
    setCurrent(0);
    setSuggestOpen(true);
  };

  const choose = (choice: string) =>
    setAnswers((prev) => {
      const next = [...prev];
      next[current()] = next[current()] === choice ? null : choice;
      return next;
    });

  /** กลับขั้นกรอกหมายเลขคำสั่งซื้อ — ล้างหมายเลขและคำตอบ (เหมือนเว็บจริง) */
  const resetToStep1 = () => {
    setStep(1);
    setCurrent(0);
    setAnswers([]);
    setOrderNumber("");
  };

  const back = () => {
    // ย้อนจากคำถามแรก → กลับขั้นกรอกหมายเลขคำสั่งซื้อ (ล้างหมายเลข — เว็บจริง)
    if (current() === 0) return resetToStep1();
    setAnswers((prev) => prev.map((a, i) => (i === current() ? null : a)));
    setCurrent(current() - 1);
  };

  const next = async () => {
    if (current() < questions().length - 1) return setCurrent(current() + 1);
    setLoading(true);
    await delay(800);
    const res = platformService.submitAnswers(key()!, orderNumber());
    setLoading(false);
    if (res.result) onBound();
    else onBindFailed(res.status);
  };

  /** ข้อความคำถามแบบ Figma: "เลือก <ชื่อฟิลด์สีชมพู> ที่สั่งซื้อสินค้า ด้วย หมายเลขคำสั่งซื้อ ..." */
  const fieldLabel = (q: PlatformQuestion) => {
    const label = FIGMA_FIELD_LABEL[q.question_type];
    return label ? t(label) : t(`platform.select.fields.${q.question_type}`);
  };
  /** รูปจากเว็บจริง — โหลดไม่ได้ (ไม่มีรูปของคำถามนั้น) = ซ่อน */
  const [brokenImg, setBrokenImg] = createSignal<Record<string, boolean>>({});
  const tutorialImg = () => (key() ? `/images/connect-platform/tutorial/${key()}.png` : "");
  const guidelineImg = (type: string) => (key() ? `/images/connect-platform/guideline/${key()}/${type}.png` : "");
  const markBroken = (src: string) => setBrokenImg((m) => ({ ...m, [src]: true }));

  return (
    <div class="min-h-screen bg-white">
      <PageLoading show={loading()} />
      {/* หัวข้อ (Figma): ย้อนกลับ + 18/700 */}
      <PageHeader
        title={step() === 1 ? t("platform.input_order_number") : t("core.answer_questions")}
        onBack={() => (step() === 2 ? back() : backToList())}
      />

      {/* ขั้นที่ 1 (Figma input_Receipt_* 589:6184) */}
      <Show when={step() === 1}>
        <div class="flex flex-col items-center gap-4">
          <div class="w-full px-4">
            <div class="flex flex-col gap-2 rounded-2xl bg-primary-surface p-4">
              <p class="text-14 font-medium text-dark">
                {t("core.bought_via_between", { platform: name() })}{" "}
                <b class="font-semibold text-primary">
                  {t("core.date_range", {
                    from: fmt(new Date(Date.now() - LOOKBACK_DAYS * 86_400_000)),
                    to: fmt(new Date(Date.now() - 86_400_000)),
                  })}
                </b>
                <br />
                {t("core.one_item")}
              </p>
              <Input
                placeholder={t("core.enter_field", { field: t("platform.order_number") })}
                value={orderNumber()}
                onInput={(e) => setOrderNumber(e.currentTarget.value.toUpperCase())}
                autocomplete="off"
              />
            </div>
          </div>
          <Show when={tutorialImg() && !brokenImg()[tutorialImg()]}>
            <div class="flex w-full max-w-mobile flex-col items-center gap-2 px-4">
              <img src={tutorialImg()} alt={name()} class="w-full rounded-2xl object-cover" onError={() => markBroken(tutorialImg())} />
              <p class="text-center text-12 text-gray">{t("platform.view_how_to", { field: t("platform.order_number") })}</p>
            </div>
          </Show>
        </div>
      </Show>

      {/* ขั้นที่ 2 (Figma Question* 589:6213) */}
      <Show when={step() === 2 && question()}>
        {(q) => (
          <>
            <div class="flex flex-col gap-4 px-4">
              {/* ความคืบหน้า: "คำถามข้อที่ x / y" + ขีดแต่ละข้อ (ไม่แสดง %) */}
              <div class="flex flex-col gap-2 rounded-2xl border border-stroke bg-white p-2">
                <div class="flex items-center justify-between">
                  <span class="text-12 font-semibold text-dark">{t("platform.question_step_progress", { current: current() + 1, total: total() })}</span>
                </div>
                <div class="flex items-center gap-1">
                  <For each={questions()}>
                    {(_, i) => <span class={cn("h-2 flex-1 rounded-full transition-all", i() <= current() ? "bg-primary" : "bg-surface-gray", i() === current() ? "opacity-100" : "opacity-60")} />}
                  </For>
                </div>
              </div>
              <div class="flex flex-col gap-2 rounded-2xl bg-primary-surface p-4">
                <div class="flex items-start gap-2">
                  <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-14 font-semibold text-white">{current() + 1}</span>
                  <p class="min-w-0 flex-1 text-14 font-medium text-dark">
                    {t("core.select_prefix")} <b class="font-semibold text-primary">{fieldLabel(q())}</b>{" "}
                    <Show when={q().question_type === "platform_username"} fallback={<>{t("core.of_order_number", { orderNumber: orderNumber().trim() })}</>}>
                      {t("core.used_to_order_with")}
                      <br />
                      {t("core.order_number_value", { orderNumber: orderNumber().trim() })}
                    </Show>
                  </p>
                </div>
                <Show when={!brokenImg()[guidelineImg(q().question_type)]}>
                  <img src={guidelineImg(q().question_type)} alt="" class="w-full rounded-lg object-cover" onError={() => markBroken(guidelineImg(q().question_type))} />
                  <p class="text-center text-12 text-gray">{t("platform.view_how_to", { field: fieldLabel(q()) })}</p>
                </Show>
              </div>
            </div>
            <div class="flex flex-col gap-2 p-4">
              <For each={q().answers}>
                {(a) => {
                  const selected = () => answers()[current()] === a.answer_value;
                  return (
                    <button
                      type="button"
                      onClick={() => choose(a.answer_value)}
                      class={cn(
                        "flex w-full items-center gap-2 rounded-2xl border p-4 text-left",
                        selected() ? "border-primary bg-primary-surface" : "border-stroke bg-white",
                      )}
                    >
                      <span class="min-w-0 flex-1 text-14 font-medium text-dark">{a.answer_value}</span>
                      <Show when={selected()} fallback={<img src="/images/figma/icon-radio.svg" alt="" width="24" height="24" />}>
                        <span class="flex size-6 items-center justify-center rounded-full border-2 border-primary">
                          <span class="size-3 rounded-full bg-primary" />
                        </span>
                      </Show>
                    </button>
                  );
                }}
              </For>
            </div>
          </>
        )}
      </Show>

      <BottomActionBarSpacer />
      <BottomActionBar class="pb-8">
        {/* ปุ่มคู่ตามเว็บจริง: ขั้น 1 "ยกเลิก | ตรวจสอบคำสั่งซื้อ" · ขั้น 2 "ย้อนกลับ | ถัดไป" */}
        <div class="grid grid-cols-2 gap-4">
          <Show
            when={step() === 2}
            fallback={
              <>
                <Button size="block" variant="secondary" onClick={backToList}>
                  {t("platform.cancel")}
                </Button>
                <Button size="block" disabled={!orderNumber().trim()} onClick={verify}>
                  {t("platform.verify_order_number")}
                </Button>
              </>
            }
          >
            <Button size="block" variant="secondary" onClick={back}>
              {t("platform.back")}
            </Button>
            <Button size="block" disabled={!answers()[current()]} onClick={next}>
              {t("platform.next")}
            </Button>
          </Show>
        </div>
      </BottomActionBar>

      {/* คำแนะนำก่อนตอบ (เว็บจริง): ปุ่มเดียว "เริ่มตอบคำถาม" */}
      <ResultModal
        open={suggestOpen()}
        onOpenChange={setSuggestOpen}
        icon={<IconInfo size={24} class="text-success" />}
        title={t("platform.suggestion")}
        description={
          <span
            innerHTML={t("platform.you_will_connecting_to_platform_name_by_order_number_verify", {
              platform: name(),
              orderNumber: `<b class="font-semibold text-primary">${orderNumber().trim()}</b>`,
              pleaseAnswerCorrectly: answerHint(questions().length),
            })}
          />
        }
        buttonText={t("platform.start_question")}
        onButton={() => setStep(2)}
      />
      {/* Figma Modal_AllNonSuccess 589:14097 */}
      <ResultModal
        open={!!error()}
        onOpenChange={(o) => {
          if (o) return;
          // ResultModal ปิดก่อนเรียก onButton → อ่าน leave ก่อนล้าง error (แพลตฟอร์มไม่รองรับ/ปิดอยู่ = กลับหน้ารายการ)
          const leave = error()?.leave;
          setError(undefined);
          if (leave) backToList();
        }}
        variant="error"
        title={error()?.title ?? ""}
        description={error()?.description}
      />
      {/* Figma Connected 589:13544 */}
      <ResultModal
        open={success()}
        onOpenChange={setSuccess}
        title={t("core.platform_connected_success", { platform: name() })}
        description={
          // LINE Shopping ผูกด้วยเบอร์โทร → แจ้งว่าซิงค์เบอร์ของสมาชิกแล้ว (เว็บจริง)
          platform()?.platform_id_source === "customer_phone" ? (
            <span innerHTML={t("platform.line_bind_phone_sync_notice", { platform: name(), phone: session.customer.phone })} />
          ) : undefined
        }
        onButton={() => {
          resetToStep1();
          backWith("profile/platforms");
        }}
      />
    </div>
  );
}
