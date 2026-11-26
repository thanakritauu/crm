import { A } from "@solidjs/router";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { BottomNav, BottomNavSpacer } from "~/components/layout/bottom-nav";
import { PageHeader } from "~/components/layout/page-header";
import { BalanceBar } from "~/components/ui/balance-bar";
import { CoinIcon } from "~/components/mission/coin-icon";
import { MissionGridCard } from "~/components/mission/mission-grid-card";
import { Button } from "~/components/ui/button";
import { EmptyData } from "~/components/ui/empty-data";
import { PillTabs } from "~/components/ui/pill-tabs";
import { Sheet } from "~/components/ui/sheet";
import { useI18n } from "~/lib/i18n";
import { usePartnerPath } from "~/lib/theme";
import { cn, formatNumber } from "~/lib/utils";
import { session } from "~/lib/session";
import { missionService } from "~/services/mission-service";
import { cardClass } from "~/components/ui/card";
import { SortSheet } from "~/components/ui/sort-sheet";
import { IconChevronRight, IconSort } from "~/components/ui/icons";

/**
 * /:partner/missions — รายการภารกิจ (แท็บในแถบล่าง — ไม่มีปุ่มย้อนกลับ)
 * ต้นฉบับ: index-9f791726.js (+ tab-slide-64307185.js สำหรับ "ภารกิจสำคัญ")
 * - PageHeader ชมพู + การ์ดยอดคอยน์ของฉัน + ลิงก์ประวัติคอยน์ (→ wallet/coins-history)
 * - (เอาภารกิจสำคัญออก 2026-11-23) PillTabs ทั้งหมด / กำลังทำ / สำเร็จ อยู่นอกพื้นหัวหน้า, "เรียงลำดับโดย" (Sheet: ใหม่ล่าสุด / ภารกิจสำเร็จ)
 * - grid การ์ด col-span-6
 * Mock: missionService (ข้อมูลจาก src/mocks/missions.ts + ความคืบหน้าใน store)
 */
type TabType = 1 | 2 | 3;
type SortType = "" | "new" | "mission_success";

const STATUS_ORDER: Record<string, number> = { not_started: 0, in_progress: 1, completed: 2, expired: 3 };

export default function MissionList() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const [tab, setTab] = createSignal<TabType>(1);
  const [sort, setSort] = createSignal<SortType>("new");
  const [sortOpen, setSortOpen] = createSignal(false);
  onMount(() => missionService.restore());

  const sortOptions: { type: SortType; title: string }[] = [
    { type: "new", get title() { return t("common.new_arrival"); } },
    { type: "mission_success", get title() { return t("mis.sort_completed_first"); } },
  ];

  const items = createMemo(() => {
    let list = missionService.list();
    // ต้นฉบับ: type 2 = เข้าร่วมแล้วแต่ยังไม่สำเร็จ, type 3 = สำเร็จ
    if (tab() === 2) list = list.filter((m) => m.status === "in_progress");
    if (tab() === 3) list = list.filter((m) => m.status === "completed");
    // ค่าเริ่มต้น: เรียงตามสถานะก่อน — ยังไม่ได้เริ่ม · กำลังทำ · สำเร็จ · หมดเวลา (ตัดสินใจ 2026-11-25) แล้วใหม่ล่าสุดในกลุ่มเดียวกัน
    if (sort() === "new") list = [...list].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.start_date.localeCompare(a.start_date));
    if (sort() === "mission_success") list = [...list].sort((a, b) => Number(b.status === "completed") - Number(a.status === "completed"));
    return list;
  });

  return (
    <div class="img-background min-h-screen bg-white bg-cover bg-center">
      <PageHeader
        tone="primary"
        align="center"
        hideBack
        title={t("mission.mission")}
      >
        {/* คอยน์ของคุณ — BalanceBar (อยู่หน้าภารกิจแล้ว → แตะแถบไม่ไปไหน มีแค่ลิงก์ประวัติ) */}
        <BalanceBar unit="coins" inline />
      </PageHeader>

      <div class="flex flex-col gap-4 p-4">
        {/* แท็บสถานะ — อยู่นอกพื้นหัวหน้า */}
        <PillTabs
          value={tab()}
          onChange={setTab}
          items={[
            { value: 1, label: t("common.all") },
            { value: 2, label: t("common.in_progress") },
            { value: 3, label: t("common.success") },
          ]}
        />


        {/* เรียงลำดับ */}
        <div class="flex items-center justify-between">
          <h2 class="text-12 font-medium">
            <span class="text-gray">{t("common.sort_by")}:</span>{" "}
            <span class="text-primary">{sortOptions.find((o) => o.type === sort())?.title ?? t("common.none")}</span>
          </h2>
          <Button variant="outline" size="sm" aria-label={t("common.sort_by")} onClick={() => setSortOpen(true)}>
            <IconSort size={16} />
          </Button>
        </div>

        {/* รายการภารกิจ */}
        <div class="grid grid-cols-12 gap-4">
          <Show when={items().length < 1}>
            <div class="col-span-12 flex h-full min-h-[300px] items-center justify-center">
              <EmptyData title={missionService.list().length ? t("mis.no_match") : t("mis.no_missions")} />
            </div>
          </Show>
          <For each={items()}>{(m) => <MissionGridCard mission={m} />}</For>
        </div>
      </div>

      {/* bottom sheet เรียงลำดับ (ใช้ SortSheet ร่วมกับหน้าสิทธิพิเศษ) */}
      <BottomNavSpacer />
      <BottomNav />
      <SortSheet open={sortOpen()} onOpenChange={setSortOpen} value={sort()} options={sortOptions} onChange={setSort} />
    </div>
  );
}
