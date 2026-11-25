import { createSignal } from "solid-js";
import { IconRefresh } from "~/components/ui/icons";
import { ResultModal } from "~/components/ui/modal";
import { PageLoading } from "~/components/ui/page-loading";
import { useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { cn, delay, formatNumber } from "~/lib/utils";
import { earnService } from "~/services/earn-service";

/**
 * ปุ่มไอคอน "กดเพื่ออัปเดตคะแนนจากแพลตฟอร์มออนไลน์" — มุมขวาบนของหน้าเชื่อมต่อแพลตฟอร์มออนไลน์ บรรทัดเดียวกับชื่อหน้า
 * (เดิมการ์ดในหน้าสะสมคะแนน → การ์ดล่างสุดหน้านี้ → ไอคอนบนหัวหน้า)
 * ผล: มีคำสั่งซื้อใหม่ = ได้คะแนน · ไม่มี = คะแนนเป็นปัจจุบันแล้ว · ยังไม่เชื่อมต่อ = แจ้งให้เชื่อมต่อจากการ์ดด้านบน
 */
export function PlatformRefreshButton(props: { class?: string }) {
  const { t } = useI18n();
  const [loading, setLoading] = createSignal(false);
  const [result, setResult] = createSignal<{ variant: "success" | "error"; title: string; description?: string } | null>(null);

  const refresh = async () => {
    setLoading(true);
    await delay(900);
    setLoading(false);
    const r = earnService.syncPlatforms();
    if (r.status === "not_connected") return setResult({ variant: "error", title: t("core.platform_not_connected_title"), description: t("core.platform_not_connected_desc") });
    if (r.status === "up_to_date")
      return setResult({ variant: "success", title: t("dialog.refresh_point.points_is_now"), description: t("core.total_points_amount", { points: formatNumber(session.customer.points) }) });
    setResult({
      variant: "success",
      title: `${t("dialog.refresh_point.update_point_success")}\n${t("dialog.refresh_point.you_received")} ${t("core.points_amount", { points: r.points })}`,
      description: t("core.from_orders_total", {
        count: r.orders.length,
        platforms: r.orders.map((o) => o.platform).join(", "),
        points: formatNumber(session.customer.points),
      }),
    });
  };

  return (
    <>
      <PageLoading show={loading()} message={t("common.loading")} />
      {/* ไอคอนรีเฟรชมุมขวาบน — วงกลมขาว 40px + เงา แบบเดียวกับกระดิ่งแจ้งเตือนหน้าแรก (NotificationBell) */}
      <button type="button" onClick={refresh} class={cn("flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-dark shadow-card", props.class)} aria-label={t("core.refresh_platform_points")}>
        <IconRefresh size={24} />
      </button>
      <ResultModal
        open={!!result()}
        onOpenChange={(o) => !o && setResult(null)}
        variant={result()?.variant}
        title={result()?.title ?? ""}
        description={result()?.description}
      />
    </>
  );
}
