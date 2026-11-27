import { A, useSearchParams } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import { FigmaCouponCard } from "~/components/figma/coupon-card";
import { Button } from "~/components/ui/button";
import { IconSort } from "~/components/ui/icons";
import { SortSheet } from "~/components/ui/sort-sheet";
import { EmptyData } from "~/components/ui/empty-data";
import { useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";

/**
 * แท็บ "คูปองของฉัน" ในหน้าแลกรางวัล (/rewards?type=mine) — เดิมหน้า /wallet/coupons แยก และส่วนหนึ่งในหน้าแรก
 * แสดงแท็บนี้เมื่อเคยแลกคูปองแล้วเท่านั้น (session.myCoupons ไม่ว่าง)
 * ตัวเรียง (แบบหน้าแลกสินค้า — 2026-11-27): "เรียงลำดับโดย: <ค่า>" + ปุ่มเปิด Sheet · ค่าเริ่มต้น "คูปองพร้อมใช้"
 *   ทั้งหมด (ค่าเริ่มต้น · พร้อมใช้ก่อน แล้วตามด้วยใช้แล้ว/หมดอายุ) · คูปองพร้อมใช้ (ใหม่ล่าสุดก่อน) · ใกล้หมดอายุ (พร้อมใช้ เรียงวันหมดอายุใกล้สุดก่อน) · ใช้งานแล้ว/หมดอายุ — &status=ready|expiring|history
 * การ์ดคูปอง 2 คอลัมน์ → /wallet/coupons/:id
 */
export function MyCoupons() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const [params, setParams] = useSearchParams<{ status?: string }>();
  type Sort = "all" | "ready" | "expiring" | "history";
  const status = (): Sort => (params.status === "history" || params.status === "expiring" || params.status === "ready" ? params.status : "all");
  const [sheetOpen, setSheetOpen] = createSignal(false);
  const sortOptions: { type: Sort; title: string }[] = [
    { type: "all", get title() { return t("common.all"); } },
    { type: "ready", get title() { return t("rw.coupons_ready"); } },
    { type: "expiring", get title() { return t("rw.coupons_expiring"); } },
    { type: "history", get title() { return t("common.used_expired"); } },
  ];
  const list = () => {
    const all = session.myCoupons;
    if (status() === "history") return all.filter((c) => c.status !== "available");
    const ready = all.filter((c) => c.status === "available");
    if (status() === "all") return [...ready, ...all.filter((c) => c.status !== "available")];
    return status() === "expiring" ? [...ready].sort((a, b) => a.expires_at.localeCompare(b.expires_at)) : ready;
  };
  return (
    <div class="flex flex-col gap-4 p-4">
      {/* เรียงลำดับโดย + ปุ่มเปิดตัวเลือก (แบบเดียวกับแท็บแลกสินค้า) */}
      <div class="flex items-center justify-between">
        <h2 class="text-12 font-medium">
          <span class="text-gray">{t("common.sort_by")}:</span> <span class="text-primary">{sortOptions.find((o) => o.type === status())?.title}</span>
        </h2>
        <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)} aria-label={t("common.sort_by")}>
          <IconSort size={16} />
        </Button>
      </div>
      <Show
        when={list().length}
        fallback={
          <div class="flex flex-col items-center gap-4 pt-12">
            <EmptyData title={t("core.no_coupons_yet")} />
            <A href={to("rewards?type=coupons")} class="text-14 font-medium text-primary underline">
              {t("core.redeem_coupon_cta")}
            </A>
          </div>
        }
      >
        <div class="grid grid-cols-2 gap-4">
          <For each={list()}>{(c) => <FigmaCouponCard coupon={c} href={to(`wallet/coupons/${c.id}`)} />}</For>
        </div>
      </Show>
      <SortSheet
        open={sheetOpen()}
        onOpenChange={setSheetOpen}
        value={status()}
        options={sortOptions}
        onChange={(v) => setParams({ status: v === "all" ? undefined : v }, { replace: true })}
      />
    </div>
  );
}
