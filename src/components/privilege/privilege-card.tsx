import { ImageRowCard, PointsBadge } from "~/components/ui/image-row-card";
import type { Privilege } from "~/mocks/privileges";
import { useI18n } from "~/lib/i18n";
import { usePartnerPath } from "~/lib/theme";
import { formatDate, formatNumber } from "~/lib/utils";

export type PrivilegeState = "active" | "expired_redeem" | "not_started" | "out_of_stock";

export function privilegeState(p: Privilege, now = new Date()): PrivilegeState {
  if (now > new Date(`${p.redeem_end}T23:59:59+07:00`)) return "expired_redeem";
  if (now < new Date(`${p.redeem_start}T00:00:00+07:00`)) return "not_started";
  if (p.remaining <= 0) return "out_of_stock";
  return "active";
}

/**
 * การ์ดสิทธิพิเศษ (ต้นฉบับ product-privilage-*.js)
 * grid-cols-12 rounded-2xl bg-white shadow-card: รูป col-span-4 border-r + เนื้อหา col-span-8 p-4
 * Badge teriary "ใช้ X คะแนน" + ชื่อ 14/Semi line-clamp-2
 * เพิ่ม: สิทธิ์คงเหลือ + ช่วงเวลาแลก (ต้นฉบับแสดงในหน้า detail เท่านั้น)
 */
export function PrivilegeCard(props: { privilege: Privilege }) {
  const { t } = useI18n();
  const to = usePartnerPath();
  const p = () => props.privilege;
  const state = () => privilegeState(p());
  const overlay = () =>
    state() === "expired_redeem"
      ? t("common.expired_redeem")
      : state() === "out_of_stock"
        ? t("common.stock_out_overlay")
        : state() === "not_started"
          ? t("priv.starts_on", { date: formatDate(p().redeem_start) })
          : "";

  return (
    <ImageRowCard
      href={to(`rewards/${p().id}`)}
      class="z-card"
      image={{ colors: p().cover, src: p().image }}
      overlay={overlay()}
      badge={<PointsBadge points={p().points} />}
      title={p().title}
    >
      <p>
        {t("privilage.remaining_privilege")}: <span class="font-semibold text-primary">{formatNumber(p().remaining)}</span>/{formatNumber(p().total)}
      </p>
      <p>
        {formatDate(p().redeem_start)} - {formatDate(p().redeem_end)}
      </p>
    </ImageRowCard>
  );
}
