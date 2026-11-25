import { useNavigate, useParams } from "@solidjs/router";
import { Match, Show, Switch } from "solid-js";
import { PageHeader } from "~/components/layout/page-header";
import { DetailActionBar, DetailLayout, DetailMeta, DetailTitle, StatSplitBox } from "~/components/detail/detail-layout";
import { InfoTabs } from "~/components/ui/info-tabs";
import { IconBox, IconCalendar } from "~/components/ui/icons";
import { Button } from "~/components/ui/button";
import { EmptyData } from "~/components/ui/empty-data";
import { requireMember } from "~/lib/member-gate";
import { useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { usePartnerPath, useTheme } from "~/lib/theme";
import { formatDate, formatNumber } from "~/lib/utils";
import { rewardService } from "~/services/reward-service";

/**
 * /:partner/reward/detail/:id — รายละเอียดของรางวัล
 * ต้นฉบับ: _id_-afff4574 (รูป h-[375px], ชื่อ + ราคา 14/600, "รายละเอียดสินค้า :", คำอธิบาย, ปุ่ม "เลือก" สีเทา → reward/summarize)
 * ต้นฉบับยังเป็นหน้าขายสินค้า (ราคาบาท, ข้อมูล hard-code) — prototype ปรับเป็นแลกด้วยคะแนน:
 * เพิ่มคงเหลือ, ระยะเวลาแลก, เงื่อนไข และสถานะปุ่ม (คะแนนไม่พอ / ของหมด)
 */
export default function RewardDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const to = usePartnerPath();
  const { t } = useI18n();
  const { theme } = useTheme();
  const reward = () => rewardService.get(params.id ?? "");
  const enough = () => session.customer.points >= (reward()?.points ?? Infinity);

  return (
    <Show
      when={reward()}
      fallback={
        <div class="min-h-screen bg-white">
          <PageHeader title={t("landing.member_info.redeem")} backTo="rewards?type=products" />
          <EmptyData class="pt-16" title={t("loyalty.reward_not_found")} />
        </div>
      }
    >
      {(r) => (
        <DetailLayout
          title={t("landing.member_info.redeem")}
          backTo="rewards?type=products"
          cover={{ colors: r().cover, src: r().image, overlay: r().stock <= 0 ? { text: t("common.stock_out_overlay"), tone: "dark" } : undefined }}
        >
          <DetailTitle title={r().name} description={r().description} />
          <DetailMeta items={[{ icon: IconCalendar, text: `${t("mission.redemption_period")}: ${formatDate(r().redeem_start)} - ${formatDate(r().redeem_end)}` }]} />
          <StatSplitBox
            items={[
              {
                icon: <img src={theme().image_point} alt="" class="size-4 rounded-full" />,
                value: `${formatNumber(r().points)} ${t("common.points")}`,
                label: t("privilage.points_required"),
              },
              {
                icon: <IconBox size={16} />,
                value: r().stock > 0 ? t("loyalty.remaining_pieces", { count: formatNumber(r().stock) }) : t("common.stock_out_overlay"),
                label: t("loyalty.remaining_label"),
              },
            ]}
          />
          <InfoTabs items={[{ value: "condition", label: t("common.condition"), content: r().conditions }]} />

          <DetailActionBar
            redeem={{ unit: "points", cost: r().points }}
          >
            <Switch>
              <Match when={r().stock <= 0}>
                <Button size="block" disabled>
                  {t("common.stock_out_overlay")}
                </Button>
              </Match>
              <Match when={!enough()}>
                <Button size="block" disabled>
                  {t("privilage.insufficient_points")}
                </Button>
              </Match>
              <Match when={true}>
                <Button size="block" onClick={() => requireMember(() => navigate(to(`rewards/${r().id}/checkout`)))}>
                  {t("common.redeem_item")}
                </Button>
              </Match>
            </Switch>
          </DetailActionBar>
        </DetailLayout>
      )}
    </Show>
  );
}
