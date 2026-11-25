import { useNavigate } from "@solidjs/router";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { BottomActionBar, BottomActionBarSpacer } from "~/components/layout/bottom-action-bar";
import { PageHeader } from "~/components/layout/page-header";
import { BalanceBar } from "~/components/ui/balance-bar";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { PageLoading } from "~/components/ui/page-loading";
import { requireMember } from "~/lib/member-gate";
import { useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { cn, delay, formatNumber } from "~/lib/utils";
import { exchangeSettings as cfg, exchangeState, historyService, restoreExchangeState, type ExchangeRecord } from "~/services/history-service";
import { formatDate } from "~/lib/utils";
import { useMemberOnly } from "~/lib/member-gate";

/**
 * /:partner/exchange-point — แลกคะแนนสะสมเป็นคูปองส่วนลด (เมนูในหน้าโปรไฟล์)
 * ต้นฉบับ: index-f6f0a2ed.js — การ์ดคะแนนสะสม + อัตราแลกเปลี่ยน, ช่องกรอกคะแนน (−/+ ทีละ step, ปุ่มลัด, MAX),
 *   สรุป (คะแนนที่ใช้ / ส่วนลดที่ได้ / คะแนนคงเหลือ), checkbox ยินยอม, ปุ่ม "ยืนยันแลกคูปองส่วนลด ฿x"
 *   → กล่องสำเร็จพร้อมรหัสคูปอง + ประวัติการแลกล่าสุด
 * Mock: burn_settings ใช้ค่า default ในโค้ดต้นฉบับ (ขั้นต่ำ 10, step 10, 10 คะแนน = ฿1, อายุคูปอง 30 วัน)
 *   ตัดคะแนนด้วย sessionActions.updateCustomer; คูปองที่ได้เก็บใน history-service (ยังไม่เข้า session.myCoupons)
 */
export default function ExchangePointPage() {
  useMemberOnly();
  const { t } = useI18n();
  const to = usePartnerPath();
  const navigate = useNavigate();
  const [value, setValue] = createSignal("");
  const [consent, setConsent] = createSignal(false);
  const [submitting, setSubmitting] = createSignal(false);
  const [result, setResult] = createSignal<ExchangeRecord>();
  const [copied, setCopied] = createSignal("");

  const balance = () => session.customer.points;
  onMount(() => {
    restoreExchangeState();
    // ต้นฉบับ: เติมค่าขั้นต่ำให้อัตโนมัติถ้าคะแนนพอ (รอ restoreSession ก่อน)
    setTimeout(() => balance() >= cfg.min_points_per_redemption && !value() && setValue(String(cfg.min_points_per_redemption)), 0);
  });

  const amount = () => {
    const n = Number(value().trim());
    return value().trim() && Number.isFinite(n) ? Math.floor(n) : 0;
  };
  const maxUsable = createMemo(() => {
    const cap = cfg.max_points_per_redemption > 0 ? Math.min(balance(), cfg.max_points_per_redemption) : balance();
    return cap < cfg.min_points_per_redemption ? 0 : Math.floor(cap / cfg.point_step) * cfg.point_step;
  });
  const presets = createMemo(() => {
    const min = cfg.min_points_per_redemption;
    const s = cfg.point_step;
    return [min, min + s * 4, min + s * 9, min + s * 29]
      .filter((d, i, a) => d > 0 && (cfg.max_points_per_redemption === 0 || d <= cfg.max_points_per_redemption) && a.indexOf(d) === i)
      .slice(0, 3);
  });
  const n0 = (v: number) => formatNumber(v);

  const error = createMemo(() => {
    if (!value().trim()) return "";
    const n = Number(value());
    if (!Number.isFinite(n) || n <= 0) return t("profile.exchange_error_min", { min: n0(cfg.min_points_per_redemption) });
    if (n > balance()) return t("profile.exchange_error_insufficient", { available: formatNumber(balance(), 2) });
    if (n < cfg.min_points_per_redemption) return t("profile.exchange_error_min", { min: n0(cfg.min_points_per_redemption) });
    if (cfg.max_points_per_redemption > 0 && n > cfg.max_points_per_redemption) return t("profile.exchange_error_max", { max: n0(cfg.max_points_per_redemption) });
    if (cfg.point_step > 1 && n % cfg.point_step !== 0)
      return t("profile.exchange_error_step", {
        step: n0(cfg.point_step),
        example1: n0(cfg.min_points_per_redemption),
        example2: n0(cfg.min_points_per_redemption + cfg.point_step),
      });
    if (historyService.discountFor(n) <= 0) return t("profile.exchange_error_zero_discount", { points: n0(cfg.points_per_unit) });
    return "";
  });
  const discount = () => (amount() <= 0 || error() ? 0 : historyService.discountFor(amount()));
  const canSubmit = () => cfg.is_enable_point_to_coupon && !error() && amount() > 0 && discount() > 0 && consent() && !submitting();

  const step = (delta: number) => setValue(String(Math.max(cfg.min_points_per_redemption, (amount() || cfg.min_points_per_redemption) + delta)));
  const useMax = () => setValue(String(maxUsable() > 0 ? maxUsable() : cfg.min_points_per_redemption));

  const submit = async (e: Event) => {
    e.preventDefault();
    if (!canSubmit()) return;
    // Guest แลกคะแนนเป็นคูปองไม่ได้ (Figma ตาราง Guest vs Member) → modal ชวนสมัคร
    if (!session.isMember) return requireMember(() => {});
    setSubmitting(true);
    await delay(800);
    const rec = historyService.exchangePoints(amount());
    setSubmitting(false);
    if (!rec) return;
    setResult(rec);
    setConsent(false);
    setValue(balance() < cfg.min_points_per_redemption ? "" : amount() > balance() ? String(cfg.min_points_per_redemption) : value());
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard?.writeText(code);
    } catch {
      /* ignore */
    }
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  };
  const goCoupons = () => navigate(to("rewards?type=mine"));

  return (
    <div class="img-background min-h-screen bg-white bg-cover bg-center">
      <PageHeader tone="primary" title={t("profile.exchange_points_menu")} backTo="profile">
        {/* คะแนนของคุณ — BalanceBar (pattern เดียวกับทุกหน้า) + อัตราแลก/คำเตือนในการ์ดถัดไป */}
        <BalanceBar unit="points" />
        <Card class="p-4 text-left">
          <div class="flex items-center justify-between gap-2 rounded-xl bg-primary-surface px-4 py-2">
            <span class="whitespace-nowrap text-12 font-semibold text-gray">{t("profile.exchange_points_rate_label")}</span>
            <span class="whitespace-nowrap text-14 font-semibold text-primary">
              {t("profile.exchange_points_rate_value", { points: n0(cfg.points_per_unit), discount: n0(cfg.discount_per_unit) })}
            </span>
          </div>
          <Show when={balance() < cfg.min_points_per_redemption}>
            <div class="mt-2 rounded-xl border border-error-surface bg-error-surface px-4 py-2 text-12 font-semibold text-error">
              {t("profile.exchange_below_min_balance_notice", { min: n0(cfg.min_points_per_redemption) })}
            </div>
          </Show>
        </Card>
      </PageHeader>

      <div class="flex flex-col overflow-y-auto px-4 pt-4">
        <form class="flex flex-grow flex-col" onSubmit={submit}>
          <div class="grid grid-cols-1 gap-y-4">
            <div>
              <div class="mb-2 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                <label for="exchange-points-input" class="block text-left text-16 font-medium text-dark">
                  <span class="text-error">*</span> {t("profile.exchange_input_label")}
                </label>
                <button type="button" onClick={useMax} disabled={submitting()} class="hit-area ml-auto shrink-0 whitespace-nowrap text-14 font-semibold text-primary underline disabled:opacity-40">
                  {t("profile.exchange_max_btn")} ({n0(maxUsable())})
                </button>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => step(-cfg.point_step)}
                  disabled={amount() <= cfg.min_points_per_redemption || submitting()}
                  class="flex size-12 flex-none items-center justify-center rounded-xl border border-stroke-strong bg-white text-18 font-semibold text-dark disabled:opacity-40"
                >
                  -
                </button>
                <div class="relative flex-grow">
                  <input
                    id="exchange-points-input"
                    type="text"
                    inputmode="numeric"
                    value={value()}
                    placeholder={t("profile.exchange_input_placeholder")}
                    onInput={(e) => setValue(e.currentTarget.value.replace(/\D/g, ""))}
                    class={cn(
                      "h-12 w-full rounded-xl border px-4 text-16 font-semibold outline-none transition disabled:opacity-50",
                      error() ? "border-error bg-error-surface text-error" : "border-stroke-strong bg-white text-dark focus:border-primary",
                    )}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => step(cfg.point_step)}
                  disabled={submitting()}
                  class="flex size-12 flex-none items-center justify-center rounded-xl border border-stroke-strong bg-white text-18 font-semibold text-dark disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <div class="mt-2 flex items-center justify-between">
                <p class="text-12 text-gray">
                  {t("profile.exchange_points_rule_hint", { min: n0(cfg.min_points_per_redemption), step: n0(cfg.point_step) })}
                </p>
              </div>
              <Show when={error()}>
                <p role="alert" class="mt-2 flex items-start gap-2 text-left text-14 font-semibold text-error">
                  <span>{error()}</span>
                </p>
              </Show>
              <div class="mt-2 grid grid-cols-12 gap-x-2">
                <For each={presets()}>
                  {(p) => (
                    <div class="col-span-3">
                      <button
                        type="button"
                        onClick={() => setValue(String(p))}
                        disabled={submitting()}
                        class={cn(
                          "flex h-10 w-full cursor-pointer items-center justify-center whitespace-nowrap rounded-full px-2 text-14 font-semibold transition disabled:opacity-40",
                          amount() === p ? "border border-primary bg-primary-surface text-primary" : "border border-stroke-strong bg-white text-gray",
                        )}
                      >
                        {n0(p)}
                      </button>
                    </div>
                  )}
                </For>
                <div class="col-span-3">
                  <button
                    type="button"
                    onClick={useMax}
                    disabled={submitting()}
                    class={cn(
                      "flex h-10 w-full cursor-pointer items-center justify-center whitespace-nowrap rounded-full px-2 text-14 font-semibold transition disabled:opacity-40",
                      maxUsable() > 0 && amount() === maxUsable() ? "border border-primary bg-primary-surface text-primary" : "border border-stroke-strong bg-white text-gray",
                    )}
                  >
                    {t("loyalty.max")}
                  </button>
                </div>
              </div>
            </div>

            {/* สรุป */}
            <div class="space-y-2 rounded-2xl border border-stroke bg-surface-gray p-4 text-left">
              <div class="flex items-center justify-between gap-2">
                <span class="min-w-0 text-14 text-gray">{t("profile.exchange_points_to_use_label")}</span>
                <span class="shrink-0 whitespace-nowrap text-14 font-semibold text-dark">{amount() > 0 ? `${n0(amount())} ${t("common.points")}` : "-"}</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="min-w-0 text-14 text-gray">{t("profile.exchange_discount_preview_label")}</span>
                <span class="shrink-0 whitespace-nowrap text-18 font-semibold text-primary">฿{formatNumber(discount(), 2)}</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="min-w-0 text-14 text-gray">{t("profile.exchange_remaining_points_label")}</span>
                <span class="shrink-0 whitespace-nowrap text-14 font-semibold text-dark">
                  {amount() > 0 && amount() <= balance() ? `${formatNumber(balance() - amount(), 2)} ${t("common.points")}` : "-"}
                </span>
              </div>
              <div class="border-t border-stroke pt-2 text-12 text-gray">{t("profile.exchange_validity_hint", { days: cfg.coupon_validity_days })}</div>
            </div>

            <label class="flex cursor-pointer select-none items-start gap-2 rounded-xl border border-stroke bg-white p-4 text-left">
              <input
                type="checkbox"
                checked={consent()}
                disabled={submitting()}
                onChange={(e) => setConsent(e.currentTarget.checked)}
                class="mt-1 size-4 flex-none rounded accent-[var(--primary-base)]"
              />
              <span class="text-14 text-gray">{t("profile.exchange_consent_text")}</span>
            </label>

            {/* ผลการแลก */}
            <Show when={result()}>
              {(r) => (
                <div class="rounded-2xl border border-success-surface bg-success-surface p-4 text-left">
                  <div class="text-14 font-semibold text-success">{t("profile.exchange_success_title")}</div>
                  <div class="mt-2 space-y-2 rounded-xl border border-success-surface bg-white p-4">
                    <div class="flex items-center justify-between gap-2">
                      <div class="min-w-0">
                        <div class="whitespace-nowrap text-12 text-gray">
                          {t("profile.exchange_success_code_label")} (฿{formatNumber(r().discount, 2)})
                        </div>
                        <div class="mt-1 truncate font-mono text-16 font-semibold text-dark">{r().code}</div>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => copy(r().code)}>
                        {copied() === r().code ? t("profile.exchange_copied") : t("profile.exchange_copy_code")}
                      </Button>
                    </div>
                    <Button size="md" class="w-full bg-success" onClick={goCoupons}>
                      {t("profile.view_my_coupons")}
                    </Button>
                  </div>
                </div>
              )}
            </Show>

            {/* ประวัติการแลกล่าสุด */}
            <Show when={exchangeState.records.length > 0}>
              <div class="pt-2 text-left">
                <div class="mb-2 flex items-center justify-between">
                  <h3 class="text-16 font-semibold text-dark">{t("profile.exchange_recent_history_title")}</h3>
                  <button type="button" onClick={goCoupons} class="text-12 font-semibold text-primary underline">
                    {t("profile.view_my_coupons")}
                  </button>
                </div>
                <div>
                  <For each={exchangeState.records.slice(0, 5)}>
                    {(rec) => (
                      <div class="flex items-center justify-between gap-2 border-b border-stroke py-4">
                        <div class="min-w-0 flex-1 cursor-pointer" onClick={goCoupons}>
                          <div class="truncate text-14 font-semibold text-dark">{t("loyalty.discount_coupon_amount", { amount: formatNumber(rec.discount, 2) })}</div>
                          <div class="mt-1 flex items-center gap-2 text-12 text-gray">
                            <span class="font-mono font-semibold text-primary">{rec.code}</span>
                            <span>•</span>
                            <span>
                              {formatDate(rec.created_at, true)}
                              {t("common.time_suffix")}
                            </span>
                          </div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => copy(rec.code)}>
                          {copied() === rec.code ? t("profile.exchange_copied") : t("profile.exchange_copy_code")}
                        </Button>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </div>
          <div class="flex-grow pt-4" />
          <BottomActionBarSpacer />
          <BottomActionBar>
            <Button type="submit" size="block" disabled={!canSubmit()}>
              {submitting() ? t("profile.exchange_submitting") : t("profile.exchange_submit_btn", { discount: formatNumber(discount(), 2) })}
            </Button>
          </BottomActionBar>
        </form>
      </div>
      <PageLoading show={submitting()} message={t("profile.exchange_submitting")} />
    </div>
  );
}
