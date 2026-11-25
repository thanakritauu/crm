import { useNavigate, useSearchParams } from "@solidjs/router";
import { createSignal, For, Match, onCleanup, onMount, Show, Switch } from "solid-js";
import { ActivityEmpty, ActivityRow } from "~/components/history/activity-row";
import { TransactionList } from "~/components/history/transaction-list";
import { PageHeader } from "~/components/layout/page-header";
import { BalanceBar } from "~/components/ui/balance-bar";
import { CoinIcon } from "~/components/mission/coin-icon";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { IconClock, IconCoins, IconGift } from "~/components/ui/icons";
import { ImageRowCard } from "~/components/ui/image-row-card";
import { PillTabs } from "~/components/ui/pill-tabs";
import { translate, useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { cn, formatDate, formatNumber, txText } from "~/lib/utils";
import type { PointTransaction, RedeemRecord } from "~/mocks/history";
import { pointsExpire } from "~/prototype/settings";
import { expiringPoints, historyService } from "~/services/history-service";
import { privilegeService, REDEEM_STATUS } from "~/services/privilege-service";

/**
 * /:partner/wallet/history — ประวัติทั้งหมดในที่เดียว
 * เดิมกระจาย 3 ที่: /history (คะแนน) · /coin-history (คอยน์ — เข้าได้จากหน้าภารกิจเท่านั้น) · แท็บ "ประวัติการแลก" ในหน้าสิทธิพิเศษ
 * ?type=points (ค่าเริ่มต้น) | coins | redemptions · &filter=received|redeemed|expired (คะแนน) / in|out (คอยน์)
 * - คะแนน: ได้รับ / ใช้แลก (/ หมดอายุ เมื่อเปิด "คะแนนมีวันหมดอายุ") · แถวแบบหน้าการแจ้งเตือน (ActivityRow)
 * - คอยน์: ได้รับ / ใช้ · จัดกลุ่มตามเดือน
 * - การแลก: การ์ดรูป + สถานะ (Figma Reward History) → รายละเอียดการแลก /rewards/:id?redeem=
 * หัวหน้า: ชื่อกึ่งกลาง + ยอดคงเหลือของแท็บ (BalanceBar inline) · แท็บ คะแนน / คอยน์ / การแลกรางวัล อยู่นอกพื้นหัวหน้า
 */
type Type = "points" | "coins" | "redemptions";
type PointFilter = "received" | "redeemed" | "expired";
type CoinFilter = "in" | "out";

const POINT_ICON = { received: IconCoins, redeemed: IconGift, expired: IconClock } as const;
const dateText = (iso: string) => `${formatDate(iso, true)}${translate("common.time_suffix")}`;

export default function WalletHistoryPage() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams<{ type?: string; filter?: string }>();
  const type = (): Type => (params.type === "coins" || params.type === "redemptions" ? params.type : "points");

  return (
    <div class="img-background min-h-screen bg-white bg-cover bg-center">
      {/* หัวหน้าแบบเดียวกับแลกรางวัล/ภารกิจ: ชื่อกึ่งกลาง + ยอดคงเหลือ (บรรทัดเดียว) ในหัวหน้า · แท็บอยู่นอกพื้นหัวหน้า */}
      <PageHeader tone="primary" align="center" title={t("rw.history_title")}>
        <Show when={type() !== "redemptions"}>
          <BalanceBar unit={type() === "coins" ? "coins" : "points"} inline history={false} />
        </Show>
      </PageHeader>
      <div class="px-4 pt-4">
        <PillTabs
          value={type()}
          onChange={(v) => setParams({ type: v === "points" ? undefined : v, filter: undefined }, { replace: true })}
          items={[
            { value: "points", label: t("rw.points") },
            { value: "coins", label: t("rw.coins") },
            { value: "redemptions", label: t("rw.tab_redemptions") },
          ]}
        />
      </div>

      <Switch>
        <Match when={type() === "points"}>
          <PointHistory filter={params.filter} onFilter={(f) => setParams({ filter: f === "received" ? undefined : f }, { replace: true })} />
        </Match>
        <Match when={type() === "coins"}>
          <CoinHistory filter={params.filter} onFilter={(f) => setParams({ filter: f === "in" ? undefined : f }, { replace: true })} />
        </Match>
        <Match when={type() === "redemptions"}>
          <RedemptionHistory />
        </Match>
      </Switch>
      <div class="h-8" aria-hidden="true" />
    </div>
  );
}

/** ชิปตัวกรองย่อยของแท็บ (แบบเดียวกับชิปในหน้าแลกรางวัล) */
function FilterChips<T extends string>(props: { value: T; items: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div class="flex gap-2 px-4 pt-4">
      <For each={props.items}>
        {(it) => (
          <Button size="chip" variant={props.value === it.value ? "primary" : "outline"} class={cn(props.value !== it.value && "border-stroke text-gray")} onClick={() => props.onChange(it.value)}>
            {it.label}
          </Button>
        )}
      </For>
    </div>
  );
}

function PointHistory(props: { filter?: string; onFilter: (f: PointFilter) => void }) {
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
      <FilterChips value={filter()} items={filters()} onChange={props.onFilter} />
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

function CoinHistory(props: { filter?: string; onFilter: (f: CoinFilter) => void }) {
  const { t } = useI18n();
  const filter = (): CoinFilter => (props.filter === "out" ? "out" : "in");
  const label = (d: CoinFilter) => (d === "in" ? t("history.coins_received") : t("history.coins_used"));
  return (
    <>
      <FilterChips
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

/** ประวัติการแลก (Figma Reward History 142:1951): รูปทับเทา "แลกแล้ว" + ป้ายสถานะ (จัดส่งเดินเองตามเวลา) */
function RedemptionHistory() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const navigate = useNavigate();
  const [now, setNow] = createSignal(Date.now());
  onMount(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    onCleanup(() => clearInterval(timer));
  });
  const coverOf = (h: RedeemRecord) => (h.privilege_id ? privilegeService.get(h.privilege_id) : undefined);
  return (
    <div class="p-4">
      <Show when={session.redeemHistory.length} fallback={<ActivityEmpty title={t("priv.no_history")} />}>
        <ul class="flex flex-col gap-4">
          <For each={session.redeemHistory}>
            {(h) => {
              const st = () => REDEEM_STATUS[privilegeService.redeemStatus(h, now())];
              const p = () => coverOf(h);
              return (
                <li>
                  <ImageRowCard
                    onClick={() => h.privilege_id && navigate(to(`rewards/${h.privilege_id}?redeem=${h.id}`))}
                    disabled={!h.privilege_id}
                    image={p() ? { colors: p()!.cover, src: p()!.image } : undefined}
                    overlay={t("priv.redeemed_overlay")}
                    overlayTone="gray"
                    badge={<Badge tone={st().tone}>{t(st().key)}</Badge>}
                    title={h.name}
                  >
                    <p>
                      {formatDate(h.date, true)} · -{formatNumber(h.points)} {t("common.points")}
                    </p>
                  </ImageRowCard>
                </li>
              );
            }}
          </For>
        </ul>
      </Show>
    </div>
  );
}
