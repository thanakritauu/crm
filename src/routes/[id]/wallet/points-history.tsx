import { useSearchParams } from "@solidjs/router";
import { PageHeader } from "~/components/layout/page-header";
import { BalanceBar } from "~/components/ui/balance-bar";
import { useI18n } from "~/lib/i18n";
import { PointHistory, type PointFilter } from "~/views/history-lists";

/**
 * /:partner/wallet/points-history — หน้าประวัติคะแนนแยก (2026-11-26)
 * เข้าจาก ">" การ์ดคะแนน (หน้าแรก/โปรไฟล์) และแถบยอดในหน้าแลกรางวัล · เมนูโปรไฟล์ยังไปหน้ารวม /wallet/history
 * หัวหน้าชมพู ชื่อกึ่งกลาง + ยอดคงเหลือ · แท็บ "คะแนนที่ได้รับ | คะแนนที่ใช้แลก" (+ หมดอายุ เมื่อเปิดตัวเลือก) · ?filter=
 */
export default function PointHistoryPage() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams<{ filter?: string }>();
  return (
    <div class="img-background min-h-screen bg-white bg-cover bg-center">
      <PageHeader tone="primary" align="center" title={t("club.points_history")}>
        <BalanceBar unit="points" inline history={false} />
      </PageHeader>
      <PointHistory tabs filter={params.filter} onFilter={(f: PointFilter) => setParams({ filter: f === "received" ? undefined : f }, { replace: true })} />
      <div class="h-8" aria-hidden="true" />
    </div>
  );
}
