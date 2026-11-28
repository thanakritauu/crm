import { Navigate, useSearchParams } from "@solidjs/router";
import { createSignal, For, Match, Show, Switch } from "solid-js";
import { BottomNav, BottomNavSpacer } from "~/components/layout/bottom-nav";
import { PageHeader } from "~/components/layout/page-header";
import { privilegeState } from "~/components/privilege/privilege-card";
import { Button } from "~/components/ui/button";
import { EmptyData } from "~/components/ui/empty-data";
import { IconSort, IconGift } from "~/components/ui/icons";
import { BalanceBar } from "~/components/ui/balance-bar";
import { PillTabs } from "~/components/ui/pill-tabs";
import { RewardGridCard } from "~/components/ui/reward-grid-card";
import { SortSheet } from "~/components/ui/sort-sheet";
import { useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { formatDate, formatNumber } from "~/lib/utils";
import type { Privilege } from "~/mocks/privileges";
import { privilegeService, type PrivilegeSort } from "~/services/privilege-service";
import { rewardService } from "~/services/reward-service";
import { CouponCatalog } from "~/views/coupon-catalog";

/**
 * /:partner/rewards — แลกรางวัล (แท็บในแถบล่าง) — ทุกอย่างที่แลกด้วยคะแนน
 * ?type=products (ค่าเริ่มต้น) | coupons · ?type=mine (URL เดิม) → /wallet/coupons
 * - แลกสินค้า: สิทธิพิเศษที่เป็นสินค้า + ของรางวัล รวมใน grid เดียว + เรียงลำดับ → /rewards/:id
 * - แลกคูปอง: แลกคะแนนเป็นคูปองส่วนลด + สิทธิพิเศษที่เป็นคูปอง + แคตตาล็อกคูปอง
 * - คูปองของฉัน: แยกเป็นหน้าเดี่ยว /wallet/coupons (2026-11-27) — ไม่มีทางเข้าจากหน้านี้แล้ว (เข้าจากทางลัดหน้าแรก / โปรไฟล์ / popup แลกสำเร็จ / แจ้งเตือน)
 * ?type=privileges (URL เดิม) → แลกสินค้า
 */
type Type = "products" | "coupons";

export default function RewardsPage() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const [params, setParams] = useSearchParams<{ type?: string; status?: string }>();
  const type = (): Type => (params.type === "coupons" ? "coupons" : "products");

  return (
    <div class="img-background min-h-screen bg-white bg-cover bg-center">
      {/* URL เดิม ?type=mine → หน้าคูปองของฉัน (คง status) */}
      <Show when={params.type === "mine"}>
        <Navigate href={to(`wallet/coupons${params.status ? `?status=${params.status}` : ""}`)} />
      </Show>
      <PageHeader tone="primary" align="center" hideBack title={t("rw.title")}>
        {/* คะแนนของคุณ (ในหัวหน้า) — แตะแถบไม่ไปไหน (อยู่หน้าแลกรางวัลแล้ว) มีลิงก์ประวัติ */}
        <BalanceBar unit="points" inline />
      </PageHeader>

      {/* แท็บอยู่นอกพื้นหัวหน้า */}
      <div class="px-4 pt-4">
        <PillTabs
          value={type()}
          onChange={(v) => setParams({ type: v === "products" ? undefined : v, status: undefined }, { replace: true })}
          items={[
            { value: "products", label: t("rw.tab_products") },
            { value: "coupons", label: t("rw.tab_coupons") },
          ]}
        />
      </div>

      <Switch>
        <Match when={type() === "products"}>
          <ProductCatalog />
        </Match>
        <Match when={type() === "coupons"}>
          <CouponCatalog extra={<CouponPrivileges />} />
        </Match>
      </Switch>

      <BottomNavSpacer />
      <BottomNav />
    </div>
  );
}

type Item = { id: string; title: string; points: number; cover: [string, string]; image?: string; start: string; popular: number; overlay?: string; soldOut?: boolean };

/** ป้ายทับรูปของสิทธิพิเศษ (หมดเขต / หมด / ยังไม่เริ่ม) */
function usePrivilegeOverlay() {
  const { t } = useI18n();
  return (p: Privilege) => {
    const st = privilegeState(p);
    return st === "expired_redeem"
      ? t("common.expired_redeem")
      : st === "out_of_stock"
        ? t("common.stock_out_overlay")
        : st === "not_started"
          ? t("priv.starts_on", { date: formatDate(p.redeem_start) })
          : undefined;
  };
}

/** แท็บแลกสินค้า: สิทธิพิเศษที่เป็นสินค้า + ของรางวัล · เรียงลำดับ · grid 2 คอลัมน์ */
function ProductCatalog() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const overlayOf = usePrivilegeOverlay();
  // เริ่มต้น "ใหม่ล่าสุด" เสมอ (เหมือนหน้าภารกิจ)
  const [sort, setSort] = createSignal<PrivilegeSort>("new");
  const [sheetOpen, setSheetOpen] = createSignal(false);
  const sortOptions: { type: PrivilegeSort; title: string }[] = [
    { type: "new", get title() { return t("common.new_arrival"); } },
    { type: "hot", get title() { return t("common.popular"); } },
    { type: "asc", get title() { return t("common.sort_high_to_low"); } },
    { type: "desc", get title() { return t("common.sort_low_to_high"); } },
  ];
  const items = (): Item[] => {
    const list: Item[] = [
      ...privilegeService
        .list()
        .filter((p) => p.reward_type !== "coupon")
        .map((p) => ({ id: p.id, title: p.title, points: p.points, cover: p.cover, image: p.image, start: p.redeem_start, popular: p.total - p.remaining, overlay: overlayOf(p), soldOut: privilegeState(p) === "out_of_stock" })),
      ...rewardService.list().map((r) => ({
        id: r.id,
        title: r.name,
        points: r.points,
        cover: r.cover,
        image: r.image,
        start: r.redeem_start,
        popular: 0,
        overlay: r.stock <= 0 ? t("common.stock_out_overlay") : undefined,
        soldOut: r.stock <= 0,
      })),
    ];
    if (sort() === "asc") list.sort((a, b) => a.points - b.points);
    if (sort() === "desc") list.sort((a, b) => b.points - a.points);
    if (sort() === "new") list.sort((a, b) => b.start.localeCompare(a.start));
    if (sort() === "hot") list.sort((a, b) => b.popular - a.popular);
    // ของรางวัลที่หมดแล้วไปอยู่ท้ายสุดเสมอ (ทุกการเรียง — 2026-11-26)
    return [...list.filter((i) => !i.soldOut), ...list.filter((i) => i.soldOut)];
  };

  return (
    <div class="flex flex-col gap-4 p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-12 font-medium">
          <span class="text-gray">{t("common.sort_by")}:</span> <span class="text-primary">{sortOptions.find((o) => o.type === sort())?.title ?? t("common.none")}</span>
        </h2>
        <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)} aria-label={t("common.sort_by")}>
          <IconSort size={16} />
        </Button>
      </div>
      <Show when={items().length} fallback={<div class="flex min-h-[40vh] items-center justify-center"><EmptyData icon={IconGift} title={t("loyalty.no_rewards")} /></div>}>
        {/* grid 2 คอลัมน์แบบ Okya · คะแนนไม่พอ = กุญแจ + "ขาดอีก X คะแนน" */}
        <div class="grid grid-cols-2 gap-4">
          <For each={items()}>
            {(it) => (
              <RewardGridCard
                href={to(`rewards/${it.id}`)}
                image={{ colors: it.cover, src: it.image }}
                title={it.title}
                cost={it.points}
                unit="points"
                balance={session.isMember ? session.customer.points : 0}
                overlay={it.overlay}
              />
            )}
          </For>
        </div>
      </Show>
      <SortSheet open={sheetOpen()} onOpenChange={setSheetOpen} value={sort()} options={sortOptions} onChange={setSort} />
    </div>
  );
}

/** สิทธิพิเศษที่เป็นคูปอง (แสดงในแท็บแลกคูปอง) → /rewards/:id */
function CouponPrivileges() {
  const to = usePartnerPath();
  const overlayOf = usePrivilegeOverlay();
  // หมดแล้วไปท้ายสุด
  const list = () => {
    const all = privilegeService.list().filter((p) => p.reward_type === "coupon");
    return [...all.filter((p) => privilegeState(p) !== "out_of_stock"), ...all.filter((p) => privilegeState(p) === "out_of_stock")];
  };
  return (
    // การ์ดอย่างเดียว (ไม่มี grid ห่อ) — CouponCatalog วางรวมใน grid เดียวกับคูปองอื่น
    <Show when={list().length}>
        <For each={list()}>
          {(p) => (
            <RewardGridCard
              href={to(`rewards/${p.id}`)}
              image={{ colors: p.cover, src: p.image }}
              title={p.title}
              cost={p.points}
              unit="points"
              balance={session.isMember ? session.customer.points : 0}
              overlay={overlayOf(p)}
            />
          )}
        </For>
    </Show>
  );
}
