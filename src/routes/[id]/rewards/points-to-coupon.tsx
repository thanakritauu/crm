import { useNavigate } from "@solidjs/router";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { BottomActionBar, BottomActionBarSpacer } from "~/components/layout/bottom-action-bar";
import { PageHeader } from "~/components/layout/page-header";
import { BalanceBar } from "~/components/ui/balance-bar";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { FieldError, Input, Label } from "~/components/ui/input";
import { InfoBox, ResultModal } from "~/components/ui/modal";
import { PageLoading } from "~/components/ui/page-loading";
import { requireMember } from "~/lib/member-gate";
import { useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { cn, delay, formatNumber } from "~/lib/utils";
import { exchangeSettings as cfg, historyService, restoreExchangeState, type ExchangeRecord } from "~/services/history-service";
import { useMemberOnly } from "~/lib/member-gate";

/**
 * /:partner/rewards/points-to-coupon — แลกคะแนนเป็นคูปองส่วนลด (เข้าจากแท็บแลกคูปอง)
 * UI ใช้ component ของ Design System ทั้งหมด: PageHeader + BalanceBar inline · InfoBox · Label/Input/FieldError · Button (outline icon, chip, link, block) · Card · Checkbox · Badge · ActivityRow
 * ต้นฉบับ: index-f6f0a2ed.js — การ์ดคะแนนสะสม + อัตราแลกเปลี่ยน, ช่องกรอกคะแนน (−/+ ทีละ step, ปุ่มลัด, MAX),
 *   สรุป (คะแนนที่ใช้ / ส่วนลดที่ได้ / คะแนนคงเหลือ), checkbox ยินยอม, ปุ่ม "ยืนยันแลกคูปองส่วนลด ฿x"
 *   → popup สำเร็จ (ไม่โชว์รหัส) → ปุ่ม/ปิด = ไปหน้าคูปองของฉัน (ส่วน "ประวัติการแลกคูปองล่าสุด" ตัดออก 2026-11-27)
 * Mock: burn_settings ใช้ค่า default ในโค้ดต้นฉบับ (ขั้นต่ำ 10, step 10, 10 คะแนน = ฿1, อายุคูปอง 30 วัน)
 *   ตัดคะแนนด้วย sessionActions.updateCustomer; คูปองที่ได้เก็บใน history-service (ยังไม่เข้า session.myCoupons)
 */
/** ปุ่ม − / + : พื้นชมพูอ่อน ตัวชมพู ไม่มีขอบเทา */
const STEP_BTN = "border-primary-surface bg-primary-surface text-primary";

export default function ExchangePointPage() {
  useMemberOnly();
  const { t } = useI18n();
  const to = usePartnerPath();
  const navigate = useNavigate();
  const [value, setValue] = createSignal("");
  const [consent, setConsent] = createSignal(false);
  const [submitting, setSubmitting] = createSignal(false);
  const [result, setResult] = createSignal<ExchangeRecord>();

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
  };

  const goCoupons = () => navigate(to("wallet/coupons"));

  return (
    <div class="img-background min-h-screen bg-white bg-cover bg-center">
      {/* หัวหน้าแบบเดียวกับแลกรางวัล: ชื่อกึ่งกลาง + คะแนนของคุณ (BalanceBar บรรทัดเดียว) */}
      <PageHeader tone="primary" align="center" title={t("profile.exchange_points_menu")} backTo="rewards?type=coupons">
        <BalanceBar unit="points" inline />
      </PageHeader>

      <form class="flex flex-col gap-6 p-4" onSubmit={submit}>
        {/* อัตราแลก (InfoBox) · คะแนนไม่ถึงขั้นต่ำ = กล่องแดง */}
        <div class="flex flex-col gap-2">
          {/* "10 คะแนน = ส่วนลด 1 บาท" (เอาคำว่า "อัตราแลกเปลี่ยน" และ ฿ ออก — 2026-11-26) */}
          <InfoBox>
            {/* สีม่วง (secondary) ให้เข้ากับกล่อง InfoBox — 2026-11-26 */}
            <b class="font-semibold text-secondary">{t("profile.exchange_points_rate_value", { points: n0(cfg.points_per_unit), discount: n0(cfg.discount_per_unit) })}</b>
          </InfoBox>
          <Show when={balance() < cfg.min_points_per_redemption}>
            <p role="alert" class="rounded-2xl bg-error-surface p-4 text-14 text-error">
              {t("profile.exchange_below_min_balance_notice", { min: n0(cfg.min_points_per_redemption) })}
            </p>
          </Show>
        </div>

        {/* จำนวนคะแนน: Label + ปุ่ม − / Input / + (Button outline icon) + คำแนะนำ + FieldError */}
        <div class="flex flex-col gap-2">
          {/* เอาลิงก์ "ใช้คะแนนสูงสุด (X)" ข้างหัวข้อออก — ใช้ชิป "ใช้คะแนนสูงสุด" ด้านล่างแทน (2026-11-26) */}
          {/* หัวข้อ + บรรทัดเงื่อนไข "ขั้นต่ำ 10 คะแนน เพิ่มได้ครั้งละ 10 คะแนน" อยู่ใต้หัวข้อ (2026-11-26) */}
          <div class="flex flex-col gap-1">
            <Label for="exchange-points-input" required class="mb-0">
              {t("profile.exchange_input_label")}
            </Label>
            <p class="text-12 text-gray">{t("profile.exchange_points_rule_hint", { min: n0(cfg.min_points_per_redemption), step: n0(cfg.point_step) })}</p>
          </div>
          <div class="flex items-center gap-2">
            {/* ปุ่ม − / + พื้นชมพูอ่อน ตัวชมพู · ตัวเลขกึ่งกลางช่อง (2026-11-26) */}
            <Button variant="outline" size="icon" type="button" aria-label="-" class={STEP_BTN} onClick={() => step(-cfg.point_step)} disabled={amount() <= cfg.min_points_per_redemption || submitting()}>
              <span class="text-18">−</span>
            </Button>
            <Input
              id="exchange-points-input"
              class="flex-1"
              align="center"
              inputmode="numeric"
              value={value()}
              invalid={!!error()}
              placeholder={t("profile.exchange_input_placeholder")}
              onInput={(e) => setValue(e.currentTarget.value.replace(/\D/g, ""))}
            />
            <Button variant="outline" size="icon" type="button" aria-label="+" class={STEP_BTN} onClick={() => step(cfg.point_step)} disabled={submitting()}>
              <span class="text-18">+</span>
            </Button>
          </div>
          <FieldError>{error()}</FieldError>
          {/* ตัวเลือกจำนวนด่วน = ชิป (Button size chip) แบบเดียวกับชิปตัวกรองทั้งแอป */}
          <div class="flex flex-wrap gap-2">
            <For each={presets()}>
              {(p) => (
                <Button size="chip" type="button" variant={amount() === p ? "primary" : "outline"} class={cn(amount() !== p && "border-stroke text-gray")} onClick={() => setValue(String(p))} disabled={submitting()}>
                  {n0(p)}
                </Button>
              )}
            </For>
            <Button
              size="chip"
              type="button"
              variant={maxUsable() > 0 && amount() === maxUsable() ? "primary" : "outline"}
              class={cn(!(maxUsable() > 0 && amount() === maxUsable()) && "border-stroke text-gray")}
              onClick={useMax}
              disabled={submitting()}
            >
              {t("profile.exchange_max_btn")}
            </Button>
          </div>
        </div>

        {/* สรุป (Card) */}
        <Card class="flex flex-col gap-2 p-4">
          <div class="flex items-center justify-between gap-2 text-14">
            <span class="text-gray">{t("profile.exchange_points_to_use_label")}</span>
            <span class="font-semibold text-dark">{amount() > 0 ? `${n0(amount())} ${t("common.points")}` : "-"}</span>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-14 text-gray">{t("profile.exchange_discount_preview_label")}</span>
            <span class="text-18 font-semibold text-primary">฿{formatNumber(discount(), 2)}</span>
          </div>
          <div class="flex items-center justify-between gap-2 text-14">
            <span class="text-gray">{t("profile.exchange_remaining_points_label")}</span>
            <span class="font-semibold text-dark">{amount() > 0 && amount() <= balance() ? `${formatNumber(balance() - amount(), 2)} ${t("common.points")}` : "-"}</span>
          </div>
          <p class="border-t border-stroke pt-2 text-12 text-gray">{t("profile.exchange_validity_hint", { days: cfg.coupon_validity_days })}</p>
        </Card>

        {/* ยอมรับเงื่อนไข (Checkbox ของ Design System) */}
        <Checkbox checked={consent()} onChange={(v) => !submitting() && setConsent(v)}>
          <span class="text-14 text-gray">{t("profile.exchange_consent_text")}</span>
        </Checkbox>

        {/* ประวัติการแลกล่าสุด: ตัดออก (2026-11-27) — ซ้ำกับคูปองของฉัน + ประวัติคะแนน และเคยโชว์/คัดลอกรหัสข้ามขั้นตอน "ใช้คูปอง" */}

        <BottomActionBarSpacer />
        <BottomActionBar>
          <Button type="submit" size="block" disabled={!canSubmit()}>
            {submitting() ? t("profile.exchange_submitting") : t("profile.exchange_submit_btn", { discount: formatNumber(discount(), 2) })}
          </Button>
        </BottomActionBar>
      </form>
      <PageLoading show={submitting()} message={t("profile.exchange_submitting")} />
      {/* แลกสำเร็จ = popup (2026-11-27) — ปุ่ม/ปิด → หน้าคูปองของฉัน (แบบเดียวกับแลกคูปองในแท็บแลกคูปอง) · ไม่โชว์รหัส (ได้ตอนกด "ใช้คูปอง") */}
      <ResultModal
        open={!!result()}
        onOpenChange={(o) => {
          if (o) return;
          setResult(undefined);
          goCoupons();
        }}
        title={t("profile.exchange_success_title")}
        description={
          <>
            {t("loyalty.discount_coupon_amount", { amount: formatNumber(result()?.discount ?? 0, 2) })}
            {"\n"}
            {t("profile.exchange_saved_note")}
          </>
        }
        buttonText={t("profile.view_my_coupons")}
      />
    </div>
  );
}
