import { useNavigate, useParams } from "@solidjs/router";
import { createMemo, createSignal, onMount, Show } from "solid-js";
import { DetailActionBar, DetailLayout, DetailMeta, DetailTitle, StatSplitBox } from "~/components/detail/detail-layout";
import { CoinIcon } from "~/components/mission/coin-icon";
import { InfoTabs } from "~/components/ui/info-tabs";
import { AlertDialog, ResultModal } from "~/components/ui/modal";
import { Button } from "~/components/ui/button";
import { EmptyData } from "~/components/ui/empty-data";
import { PageLoading } from "~/components/ui/page-loading";
import { useI18n } from "~/lib/i18n";
import { session, sessionActions } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { delay, formatDate, formatNumber } from "~/lib/utils";
import { missionService } from "~/services/mission-service";
import { rewardService } from "~/services/reward-service";
import { IconCalendar } from "~/components/ui/icons";

/**
 * /:partner/mission/redeem-detail/:id — แลกของรางวัลของภารกิจ (id = id ภารกิจ, ?reward=<reward id> ไม่บังคับ)
 * ต้นฉบับ: _id_-fbca5bfc.js (path จริง: redeem-detail/<eventId>&rewardid=<id>)
 * - ภาพสินค้า + ชื่อ + ระยะเวลาการแลก
 * - กล่อง bg-secondary-surface 2 ช่อง: คอยน์ที่ใช้แลก | คอยน์คงเหลือ (เส้นแบ่ง bg-secondary)
 * - แท็บ ขั้นตอน / เงื่อนไข, BottomActionBar ปุ่ม "ใช้สิทธิ์แลกรับของรางวัล"
 * - หลังยืนยัน: แสดงโค้ดส่วนลด (mission.coupon_code_title) + ปุ่มคัดลอก (ข้อความ/กล่องโค้ดยืมจากหน้า detail ของต้นฉบับ)
 * Mock: โค้ดจาก mocks/missions.ts (missionCouponCodes), ถ้าต้องใช้คอยน์จะหักผ่าน sessionActions.addCoins(-n)
 */
export default function MissionRedeemDetail() {
  const { t } = useI18n();
  const params = useParams();
  const navigate = useNavigate();
  const to = usePartnerPath();
  const [confirmOpen, setConfirmOpen] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [copied, setCopied] = createSignal(false);
  const [success, setSuccess] = createSignal(false);
  onMount(() => missionService.restore());

  const mission = createMemo(() => missionService.get(params.id ?? ""));
  const reward = createMemo(() => {
    const id = params.rewardId ?? mission()?.reward_ids[0];
    return id ? rewardService.get(id) : undefined;
  });
  const cost = () => mission()?.redeem_coins ?? 0;
  const canRedeem = () => mission()?.status === "completed" && session.customer.coins >= cost();

  const redeem = async () => {
    const m = mission();
    if (!m) return;
    setLoading(true);
    await delay(800);
    if (cost() > 0) sessionActions.addCoins(-cost(), { key: "loyalty.history_redeem", params: { name: reward()?.name ?? m.title } });
    missionService.redeem(m.id);
    setLoading(false);
    setSuccess(true);
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard ใช้ไม่ได้ (เช่น http) — ยังแสดงว่าคัดลอกแล้วเพื่อการสาธิต */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
    <PageLoading show={loading()} message={t("common.in_progress_wait_a_moment")} />
    <Show
      when={mission() && reward() ? { m: mission()!, r: reward()! } : undefined}
      fallback={
        <div class="flex min-h-screen flex-col items-center justify-center bg-white px-4">
          <EmptyData title={t("mission.not_found_title")} description={t("mission.not_found_desc")} />
          <Button size="block" class="mt-4 max-w-xs" onClick={() => navigate(to("missions"))}>
            {t("mission.mission")}
          </Button>
        </div>
      }
    >
      {(data) => (
        <DetailLayout
          title={t("mission.redeem_reward")}
          backTo={`mission/detail/${data().m.id}`}
          cover={{ colors: data().r.cover, src: data().r.image, overlay: data().m.redeemed_code ? { text: t("mis.redeemed"), tone: "gray" } : undefined }}
        >
          <DetailTitle title={data().r.name} description={data().r.description} />
          <DetailMeta
            items={[
              {
                icon: IconCalendar,
                text: `${t("mission.redeem_duration")}: ${formatDate(data().m.redeem_start ?? data().r.redeem_start)} - ${formatDate(data().m.redeem_end ?? data().r.redeem_end)}`,
              },
            ]}
          />
          {/* คอยน์ที่ใช้ / คงเหลือ → แถวสรุปบนปุ่มล่าง (RedeemSummary) แบบเดียวกับหน้าแลกรางวัล */}
          {/* โค้ดหลังแลกสำเร็จ */}
          <Show when={data().m.redeemed_code}>
            {(code) => (
              <div class="flex w-full flex-col items-center rounded-2xl bg-primary-surface p-4">
                <span class="text-12 font-semibold text-gray">{t("mission.coupon_code_title")}</span>
                <div class="my-1 select-all font-mono text-18 font-semibold tracking-wider text-primary">{code()}</div>
                <Button size="sm" class="mt-1" onClick={() => copy(code())}>
                  {copied() ? t("mission.coupon_copied") : t("mission.coupon_copy")}
                </Button>
                <p class="mt-2 text-center text-12 text-gray">{t("mission.coupon_sent_notice")}</p>
              </div>
            )}
          </Show>
          <InfoTabs
            hideEmpty
            items={[
              { value: "howto", label: t("common.step"), content: data().m.how_to ?? [] },
              { value: "condition", label: t("common.condition"), content: data().r.conditions },
            ]}
          />

          <DetailActionBar
            redeem={data().m.redeemed_code ? undefined : { unit: "coins", cost: cost() }}
          >
            <Show
              when={!data().m.redeemed_code}
              fallback={
                <Button size="block" onClick={() => navigate(to(`missions/${data().m.id}`))}>
                  {t("common.view_mission_detail")}
                </Button>
              }
            >
              <Button size="block" disabled={!canRedeem()} onClick={() => setConfirmOpen(true)}>
                {data().m.status !== "completed"
                  ? t("mission.cannot_redeem_title")
                  : session.customer.coins < cost()
                    ? t("mission.insufficient_coins")
                    : t("mission.use_your_rights_to_redeem")}
              </Button>
            </Show>
          </DetailActionBar>

            <AlertDialog
              open={confirmOpen()}
              onOpenChange={setConfirmOpen}
              title={t("common.confirm_redeem_question")}
              description={
                cost() > 0
                  ? `${t("common.confirm_usage_prefix")}${formatNumber(cost())} ${t("common.coins")}${t("common.confirm_suffix")}`
                  : t("mission.confirm_redeem_coupon_des")
              }
              icon={<CoinIcon size={28} />}
              cancelText={t("common.cancel")}
              confirmText={t("common.confirm")}
              onConfirm={redeem}
            />
            {/* แลกสำเร็จ → modal เหมือนหน้าแลกอื่น แล้วเห็นรหัสในหน้านี้ */}
            <ResultModal
              open={success()}
              onOpenChange={setSuccess}
              title={t("mis.coin_redeem_success")}
              description={t("mis.redeem_code_ready_desc")}
            />
        </DetailLayout>
      )}
    </Show>
    </>
  );
}
