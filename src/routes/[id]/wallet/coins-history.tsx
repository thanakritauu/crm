import { useSearchParams } from "@solidjs/router";
import { PageHeader } from "~/components/layout/page-header";
import { BalanceBar } from "~/components/ui/balance-bar";
import { useI18n } from "~/lib/i18n";
import { CoinHistory, type CoinFilter } from "~/views/history-lists";

/**
 * /:partner/wallet/coins-history — หน้าประวัติคอยน์แยก (2026-11-26)
 * เข้าจาก ">" การ์ดคอยน์ (หน้าแรก/โปรไฟล์) และแถบยอดในหน้าภารกิจ · เมนูโปรไฟล์ยังไปหน้ารวม /wallet/history
 * หัวหน้าชมพู ชื่อกึ่งกลาง + ยอดคงเหลือ · แท็บ "คอยน์ที่ได้รับ | คอยน์ที่ใช้แลก" · ?filter=
 */
export default function CoinHistoryPage() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams<{ filter?: string }>();
  return (
    <div class="img-background min-h-screen bg-white bg-cover bg-center">
      <PageHeader tone="primary" align="center" title={t("club.coins_history")}>
        <BalanceBar unit="coins" inline history={false} />
      </PageHeader>
      <CoinHistory tabs filter={params.filter} onFilter={(f: CoinFilter) => setParams({ filter: f === "in" ? undefined : f }, { replace: true })} />
      <div class="h-8" aria-hidden="true" />
    </div>
  );
}
