import { Navigate, useSearchParams } from "@solidjs/router";
import { Match, Show, Switch } from "solid-js";
import { PageHeader } from "~/components/layout/page-header";
import { BalanceBar } from "~/components/ui/balance-bar";
import { PillTabs } from "~/components/ui/pill-tabs";
import { useI18n } from "~/lib/i18n";
import { usePartnerPath } from "~/lib/theme";
import { CoinHistory, PointHistory, type CoinFilter, type PointFilter } from "~/views/history-lists";

/**
 * /:partner/wallet/history — ประวัติคะแนนและคอยน์ "หน้ารวม" (เข้าจากเมนูโปรไฟล์ — คงไว้ตามเดิม 2026-11-26)
 * หน้าแยก: /wallet/points-history · /wallet/coins-history (จาก ">" การ์ดคะแนน/คอยน์ และแถบยอดในหน้าแลกรางวัล/ภารกิจ)
 * (การแลกรางวัลแยกไป /wallet/redemptions — 2026-11-25)
 * เดิมกระจาย 3 ที่: /history (คะแนน) · /coin-history (คอยน์ — เข้าได้จากหน้าภารกิจเท่านั้น) · แท็บ "ประวัติการแลก" ในหน้าสิทธิพิเศษ
 * ?type=points (ค่าเริ่มต้น) | coins · redemptions (ลิงก์เดิม) → /wallet/redemptions · &filter=received|redeemed|expired (คะแนน) / in|out (คอยน์)
 * - คะแนน: ได้รับ / ใช้แลก (/ หมดอายุ เมื่อเปิด "คะแนนมีวันหมดอายุ") · แถวแบบหน้าการแจ้งเตือน (ActivityRow)
 * - คอยน์: ได้รับ / ใช้ · จัดกลุ่มตามเดือน
 * หัวหน้า: ชื่อกึ่งกลาง + ยอดคงเหลือของแท็บ (BalanceBar inline) · แท็บ คะแนน / คอยน์ อยู่นอกพื้นหัวหน้า
 */
type Type = "points" | "coins";

export default function WalletHistoryPage() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const [params, setParams] = useSearchParams<{ type?: string; filter?: string }>();
  const type = (): Type => (params.type === "coins" ? "coins" : "points");

  // ลิงก์เดิม ?type=redemptions → หน้าการแลกรางวัลของฉัน (แยกออกไปแล้ว)
  return (
    <Show when={params.type !== "redemptions"} fallback={<Navigate href={to("wallet/redemptions")} />}>
    <div class="img-background min-h-screen bg-white bg-cover bg-center">
      {/* หัวหน้าแบบเดียวกับแลกรางวัล/ภารกิจ: ชื่อกึ่งกลาง + ยอดคงเหลือ (บรรทัดเดียว) ในหัวหน้า · แท็บอยู่นอกพื้นหัวหน้า */}
      <PageHeader tone="primary" align="center" title={t("rw.history_title")}>
        <BalanceBar unit={type()} inline history={false} />
      </PageHeader>
      <div class="px-4 pt-4">
        <PillTabs
          value={type()}
          onChange={(v) => setParams({ type: v === "points" ? undefined : v, filter: undefined }, { replace: true })}
          items={[
            { value: "points", label: t("rw.points") },
            { value: "coins", label: t("rw.coins") },
          ]}
        />
      </div>

      <Switch>
        <Match when={type() === "points"}>
          <PointHistory filter={params.filter} onFilter={(f: PointFilter) => setParams({ filter: f === "received" ? undefined : f }, { replace: true })} />
        </Match>
        <Match when={type() === "coins"}>
          <CoinHistory filter={params.filter} onFilter={(f: CoinFilter) => setParams({ filter: f === "in" ? undefined : f }, { replace: true })} />
        </Match>
      </Switch>
      <div class="h-8" aria-hidden="true" />
    </div>
    </Show>
  );
}
