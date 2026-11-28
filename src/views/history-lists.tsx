import { For, Show } from "solid-js";
import { ActivityEmpty, ActivityRow } from "~/components/history/activity-row";
import { TransactionList } from "~/components/history/transaction-list";
import { Button } from "~/components/ui/button";
import { IconClock, IconCoins, IconGift } from "~/components/ui/icons";
import { PillTabs } from "~/components/ui/pill-tabs";
import { translate, useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { cn, formatDate, formatNumber, txText } from "~/lib/utils";
import type { PointTransaction } from "~/mocks/history";
import { pointsExpire } from "~/prototype/settings";
import { expiringPoints, historyService } from "~/services/history-service";

/**
 * รายการประวัติคะแนน / คอยน์ — ใช้ร่วมกัน 2 แบบ (2026-11-26)
 * - tabs (หน้าแยก /wallet/points-history · /wallet/coins-history): ตัวกรองเป็นแท็บหลัก "คะแนนที่ได้รับ | คะแนนที่ใช้แลก" / "คอยน์ที่ได้รับ | คอยน์ที่ใช้แลก"
 * - chips (หน้ารวม /wallet/history จากเมนูโปรไฟล์): แท็บ คะแนน/คอยน์ ด้านบน + ตัวกรองเป็นชิปแบบเดิม
 */
export type PointFilter = "received" | "redeemed" | "expired";
export type CoinFilter = "in" | "out";

const POINT_ICON = { received: IconCoins, redeemed: IconGift, expired: IconClock } as const;
const dateText = (iso: string) => `${formatDate(iso, true)}${translate("common.time_suffix")}`;

function Filters<T extends string>(props: { tabs?: boolean; value: T; items: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <Show
      when={props.tabs}
      fallback={
        <div class="flex gap-2 px-4 pt-4">
          {/* ชิปตัวกรอง = ตัวกรองข้อมูล (ม่วง ไม่ใช่ปุ่มชมพูทึบ) ให้แยกจากแท็บด้านบนแต่เป็นระบบเดียวกัน (DSL บทบาทสี 2026-11-28) */}
          <For each={props.items}>
            {(it) => (
              <Button size="chip" variant="outline" class={cn(props.value === it.value ? "border-secondary-surface bg-secondary-surface text-secondary" : "border-stroke text-gray")} onClick={() => props.onChange(it.value)}>
                {it.label}
              </Button>
            )}
          </For>
        </div>
      }
    >
      <div class="px-4 pt-4">
        <PillTabs value={props.value} onChange={props.onChange} items={props.items} />
      </div>
    </Show>
  );
}

export function PointHistory(props: { filter?: string; onFilter: (f: PointFilter) => void; tabs?: boolean }) {
  const { t } = useI18n();
  const filters = (): { value: PointFilter; label: string }[] => [
    { value: "received", label: t("core.tab_received") },
    { value: "redeemed", label: t("core.tab_redeemed") },
    ...(pointsExpire() ? [{ value: "expired" as PointFilter, label: t("history.history_type.expired_coin") }] : []),
  ];
  const filter = (): PointFilter => (filters().some((f) => f.value === props.filter) ? (props.filter as PointFilter) : "received");
  const items = (): PointTransaction[] => {
    if (filter() === "expired") return expiringPoints();
    const list = session.pointHistory.filter((p) => (filter() === "received" ? p.amount > 0 : p.amount < 0));
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  };
  return (
    <>
      <Filters tabs={props.tabs} value={filter()} items={filters()} onChange={props.onFilter} />
      <Show when={items().length} fallback={<ActivityEmpty title={t("core.no_points_history_yet")} />}>
        <For each={items()}>
          {(it) => (
            <ActivityRow
              icon={POINT_ICON[filter()]}
              title={txText(it).title}
              date={dateText(it.date)}
              amount={{
                text: filter() === "expired" ? formatNumber(it.amount) : `${it.amount > 0 ? "+" : ""}${formatNumber(it.amount)}`,
                tone: filter() === "expired" ? "dark" : it.amount >= 0 ? "success" : "error",
              }}
              details={it.items?.map((d) => ({ name: d.name, amount: `+${formatNumber(d.amount)}` }))}
            />
          )}
        </For>
      </Show>
    </>
  );
}

export function CoinHistory(props: { filter?: string; onFilter: (f: CoinFilter) => void; tabs?: boolean }) {
  const { t } = useI18n();
  const filter = (): CoinFilter => (props.filter === "out" ? "out" : "in");
  const label = (d: CoinFilter) => (d === "in" ? t("history.coins_received") : t("history.coins_used"));
  return (
    <>
      <Filters
        tabs={props.tabs}
        value={filter()}
        items={[
          { value: "in", label: label("in") },
          { value: "out", label: label("out") },
        ]}
        onChange={props.onFilter}
      />
      <TransactionList
        items={filter() === "in" ? historyService.coinsReceived() : historyService.coinsUsed()}
        unit={t("common.coins")}
        emptyText={t("history.no_history_found", { type: label(filter()) })}
      />
    </>
  );
}
