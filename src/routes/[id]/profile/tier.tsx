import { createSignal, For, Show } from "solid-js";
import { PageHeader } from "~/components/layout/page-header";
import { EmptyData } from "~/components/ui/empty-data";
import { tierSystem } from "~/prototype/settings";
import { Badge } from "~/components/ui/badge";
import { cardClass } from "~/components/ui/card";
import { Sheet } from "~/components/ui/sheet";
import { IconCheck, IconInfo, IconCrown } from "~/components/ui/icons";
import { useI18n } from "~/lib/i18n";
import { cn, formatNumber } from "~/lib/utils";
import { TIERS, tierStatus } from "~/services/tier-service";

/**
 * /:partner/profile/tier — ระดับสมาชิก (แบบ Okya "Tiers") · ชื่อ เกณฑ์ สิทธิประโยชน์ และเหรียญ ตรงกับเว็บ ecom (tier-service)
 * คิดจากคะแนนที่ได้รับจากการซื้อในปีนี้เท่านั้น — คอยน์จากภารกิจไม่นำมาคิด
 * เข้าได้จากแถวระดับสมาชิกในหน้าแรก · ไอคอน i สีขาวมุมขวาบน = คิดระดับอย่างไร (action sheet) · รายการสิทธิประโยชน์: ระดับปัจจุบันบนสุด
 */
export default function TierPage() {
  const { t } = useI18n();
  const s = () => tierStatus();
  const currentIdx = () => TIERS.findIndex((x) => x.id === s().current.id);
  const orderedTiers = () => [s().current, ...TIERS.filter((x) => x.id !== s().current.id)];
  const [howOpen, setHowOpen] = createSignal(false);

  return (
    <Show
      when={tierSystem()}
      fallback={
        // prototype: ยังไม่มีระบบระดับสมาชิก (ปิดจากเมนู prototype)
        <div class="min-h-screen bg-white">
          <PageHeader tone="primary" backTo="profile" title={t("tier.title")} />
          <div class="flex min-h-[50vh] items-center justify-center px-4">
            <EmptyData icon={IconCrown} title={t("tier.no_tier_system")} description={t("tier.no_tier_system_desc")} />
          </div>
        </div>
      }
    >
    <div class="min-h-screen bg-white">
      <PageHeader
        tone="primary"
        backTo="profile"
        title={t("tier.title")}
        right={
          // ไอคอน i บรรทัดเดียวกับชื่อหน้า → กดแล้วแสดง "คิดระดับอย่างไร"
          // ไอคอน info สีขาว ไม่มีพื้นหลัง (เหมือนปุ่มย้อนกลับบนหัวหน้าชมพู) · พื้นที่กด 40px (hit-area)
          <button
            type="button"
            class="hit-area flex shrink-0 items-center justify-center text-white"
            aria-label={t("tier.how_title")}
            onClick={() => setHowOpen(true)}
          >
            <IconInfo size={24} />
          </button>
        }
      >
        {/* ระดับปัจจุบัน + ความคืบหน้า */}
        <div class={cn(cardClass, "flex flex-col gap-4 p-4 text-dark")}>
          <div class="flex items-center gap-2">
            <img src={s().current.mark} alt="" width="48" height="48" class="size-12 shrink-0 object-contain" />
            {/* ชื่อระดับ (ชมพูเข้ม) + "650/1,000" บรรทัดเดียวกัน · "ระดับสมาชิกของคุณ" บรรทัดล่าง · ป้ายนี้ + "/1,000" = 14/Medium เท่าป้าย "ระดับสมาชิก" หน้าแรก · "/1,000", ป้าย, "อีก x คะแนน…" ตัวดำ (2026-11-27) */}
            <span class="flex min-w-0 flex-1 flex-col">
              <span class="flex items-baseline justify-between gap-2">
                <span class="truncate text-18 font-semibold text-primary">{t(`tier.name_${s().current.id}`)}</span>
                <span class="shrink-0">
                  <span class="text-18 font-semibold text-primary">{formatNumber(s().earned)}</span>
                  <Show when={s().next}>{(n) => <span class="text-14 font-medium text-dark">/{formatNumber(n().min)}</span>}</Show>
                </span>
              </span>
              <span class="text-14 font-medium text-dark">{t("tier.earned_12m")}</span>
            </span>
          </div>

          {/* ราง 4 ขั้น */}
          <div class="flex flex-col gap-2">
            <div class="relative flex items-center justify-between">
              <span class="absolute left-2 right-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-surface-gray" />
              <span
                class="absolute left-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
                style={{ width: `calc((100% - 16px) * ${(currentIdx() + s().progress * (s().next ? 1 : 0)) / (TIERS.length - 1)})` }}
              />
              <For each={TIERS}>
                {(tier, i) => (
                  <span class={cn("relative size-4 rounded-full border-2 border-white", i() <= currentIdx() ? "bg-primary" : "bg-surface-gray")} />
                )}
              </For>
            </div>
            <div class="flex justify-between">
              <For each={TIERS}>
                {(tier, i) => <span class={cn("text-12", i() === currentIdx() ? "font-medium text-primary" : "text-gray")}>{t(`tier.name_${tier.id}`)}</span>}
              </For>
            </div>
          </div>

          <p class="text-14 text-dark">
            <Show when={s().next} fallback={t("tier.top")}>
              {(n) => t("tier.to_next", { points: formatNumber(s().needed), tier: t(`tier.name_${n().id}`) })}
            </Show>
          </p>
        </div>
      </PageHeader>

      <div class="flex flex-col gap-4 p-4">
        {/* สิทธิประโยชน์แต่ละระดับ */}
        {/* หัวข้อชิดรายการ (ไม่มีการ์ดแล้ว — รายการแรกไม่มีระยะบน · 2026-11-28) */}
        <h2 class="text-18 font-semibold text-dark">{t("tier.benefits")}</h2>
        {/* ระดับปัจจุบันอยู่บนสุดเสมอ แล้วตามด้วยระดับอื่นตามลำดับ */}
        {/* รายการเรียบคั่นเส้น (ข้อมูล ไม่ใช่การ์ด · 2026-11-28) — ระดับปัจจุบันบนสุด + ป้าย "ระดับของคุณ" */}
        <ul class="flex flex-col">
          <For each={orderedTiers()}>
            {(tier) => {
              const current = () => tier.id === s().current.id;
              return (
                <li class="flex flex-col gap-2 border-b border-stroke py-4 first:pt-0 last:border-b-0 last:pb-0">
                  <div class="flex items-center gap-2">
                    <img src={tier.mark} alt="" width="40" height="40" class="size-10 shrink-0 object-contain" />
                    <span class="flex min-w-0 flex-1 flex-col">
                      <span class="text-16 font-semibold text-dark">{t(`tier.name_${tier.id}`)}</span>
                      <span class="text-12 text-gray">{t("tier.min_points", { points: formatNumber(tier.min), spend: formatNumber(tier.minSpend) })}</span>
                    </span>
                    <Show when={current()}>
                      <Badge>{t("tier.current_badge")}</Badge>
                    </Show>
                  </div>
                  <ul class="flex flex-col gap-1">
                    <For each={tier.perks}>
                      {(key) => (
                        <li class="flex items-center gap-2 text-14 text-dark">
                          <IconCheck size={16} class="shrink-0 text-success" />
                          {t(key)}
                        </li>
                      )}
                    </For>
                  </ul>
                </li>
              );
            }}
          </For>
        </ul>
      </div>
      {/* คิดระดับอย่างไร — action sheet เลื่อนขึ้นจากล่าง */}
      <Sheet open={howOpen()} onOpenChange={setHowOpen} title={t("tier.how_title")} class="pb-8">
        <p class="whitespace-pre-line text-14 text-gray">{t("tier.how_desc")}</p>
      </Sheet>
    </div>
    </Show>
  );
}
