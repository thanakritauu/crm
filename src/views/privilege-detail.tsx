import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { createSignal, onCleanup, onMount, Show, type JSX } from "solid-js";
import { CodeDialog } from "~/components/coupon/code-dialog";
import { InfoTabs } from "~/components/ui/info-tabs";
import { Button } from "~/components/ui/button";
import { PageHeader } from "~/components/layout/page-header";
import { DetailActionBar, DetailLayout, DetailMeta, DetailTitle, StatSplitBox } from "~/components/detail/detail-layout";
import { Sheet } from "~/components/ui/sheet";
import { privilegeState } from "~/components/privilege/privilege-card";
import { GiftIcon } from "~/components/reward/icons";
import { AlertDialog, ResultModal } from "~/components/ui/modal";
import { EmptyData } from "~/components/ui/empty-data";
import { PageLoading } from "~/components/ui/page-loading";
import { requireMember } from "~/lib/member-gate";
import { useI18n } from "~/lib/i18n";
import { session, sessionActions } from "~/lib/session";
import { usePartnerPath, useTheme } from "~/lib/theme";
import { delay, formatDate, formatNumber } from "~/lib/utils";
import { privilegeService, REDEEM_STATUS } from "~/services/privilege-service";
import { Badge } from "~/components/ui/badge";
import { IconCalendar, IconDelivery, IconGift, IconShop } from "~/components/ui/icons";

type Method = "pickup" | "delivery";

/**
 * /:partner/privilage/detail/:id — รายละเอียดสิทธิพิเศษ
 * ต้นฉบับ: _id_-093b5b52 (route จริง privilage/detail/catalog=…?product=…)
 *   banner aspect-cover, ชื่อ 16/700, คำอธิบาย, "ระยะเวลาการแลก: …",
 *   กล่อง bg-secondary-surface 2 ช่อง (คะแนนที่ใช้แลก | สิทธิ์ที่คงเหลือ), แท็บ ขั้นตอน / เพิ่มเติม / เงื่อนไข,
 *   BottomActionBar: "คะแนนคงเหลือ" หรือ "ขออภัย คะแนนคงเหลือไม่พอ" + ปุ่ม แลกสินค้า/แลกคูปอง
 *   กดแลก → sheet "วิธีรับสินค้า" (รับที่หน้าร้าน / จัดส่งถึงบ้าน) → ยืนยัน → รหัส (หน้าร้าน) หรือ สำเร็จ
 * Figma Reward: จัดส่งถึงบ้าน → หน้าสรุปคำสั่ง privilage/summary/:id (เลือกที่อยู่) · รับที่หน้าร้าน → ยืนยัน → รหัส 10 นาที
 * ?redeem=<id ประวัติการแลก> → สถานะ "แลกแล้ว" (Reward_Detail_usedAt Shop / Reward_Detail_Delivery): รูปทับเทา + สถานะ + ที่อยู่
 * prototype: ใช้ sessionActions.redeemPrivilege ทุกเส้นทาง,
 *   รหัสหน้าร้านสุ่มขึ้น (ไม่บันทึก), สิทธิ์คงเหลือใน mock ไม่ลดลง, ไม่มีขั้นตอนตรวจ guest/LINE login
 */
export default function PrivilegeDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const to = usePartnerPath();
  const { t } = useI18n();
  const { theme } = useTheme();
  const p = () => privilegeService.get(params.id ?? "");
  const [search] = useSearchParams<{ redeem?: string }>();
  /** รายการที่แลกแล้ว (เปิดจากประวัติการแลก) */
  const redeemed = () => (search.redeem ? session.redeemHistory.find((r) => r.id === search.redeem) : undefined);
  const [now, setNow] = createSignal(Date.now());
  onMount(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    onCleanup(() => clearInterval(timer));
  });
  const redeemedStatus = () => (redeemed() ? REDEEM_STATUS[privilegeService.redeemStatus(redeemed()!, now())] : undefined);

  const [methodOpen, setMethodOpen] = createSignal(false);
  const [method, setMethod] = createSignal<Method>("pickup");
  const [confirmOpen, setConfirmOpen] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [code, setCode] = createSignal("");
  const [codeExpiresAt, setCodeExpiresAt] = createSignal(0);
  const [result, setResult] = createSignal<"success" | "failed" | null>(null);

  const enough = () => session.customer.points >= (p()?.points ?? Infinity);
  const state = () => (p() ? privilegeState(p()!) : "active");
  const disabled = () => !enough() || state() !== "active";
  // Figma Confirm: "รหัสสำหรับรับรางวัล ซึ่งจะหมดอายุภายใน 10 นาที"
  const minutes = () => 10;
  const isCoupon = () => p()?.reward_type === "coupon";

  const startRedeem = () => {
    if (isCoupon()) {
      // ต้นฉบับ: คูปองข้าม sheet ไปยืนยันเลย
      setMethod("delivery");
      setConfirmOpen(true);
    } else setMethodOpen(true);
  };

  const chooseMethod = (m: Method) => {
    setMethod(m);
    setMethodOpen(false);
    // จัดส่งถึงบ้าน → หน้าสรุปคำสั่ง (เลือกที่อยู่ แล้วยืนยันที่หน้านั้น)
    if (m === "delivery") return navigate(to(`rewards/${p()!.id}/checkout`));
    setConfirmOpen(true);
  };

  const redeem = async () => {
    setLoading(true);
    await delay(700);
    const newCode = `PV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const ok = sessionActions.redeemPrivilege(p()!.id, method() === "pickup" ? { method: "pickup", code: newCode } : {});
    setLoading(false);
    if (!ok) return setResult("failed");
    if (method() === "pickup") {
      setCodeExpiresAt(Date.now() + minutes() * 60_000);
      setCode(newCode);
    }
    else setResult("success");
  };

  const goHistory = () => navigate(to("wallet/redemptions"));

  const confirmTitle = (): JSX.Element => (
    <>
      {t("common.confirm_redeem_prefix")}
      <span class="text-primary">
        {formatNumber(p()?.points ?? 0)} {t("common.points")}{" "}
      </span>
      {t("common.confirm_suffix")}
    </>
  );

  return (
    <>
      <Show
        when={p()}
        fallback={
          <div class="min-h-screen bg-white">
            <PageHeader title={t("privilage.privilage")} backTo="rewards" />
            <EmptyData class="pt-16" title={t("privilage.no_privilage_found")} />
          </div>
        }
      >
        {(item) => (
          <DetailLayout
            title={t("privilage.privilage")}
            backTo="rewards"
            cover={{
              colors: item().cover,
              src: item().image,
              overlay: redeemed()
                ? { text: t("priv.redeemed_overlay"), tone: "gray" }
                : state() === "expired_redeem"
                  ? { text: t("common.expired_redeem"), tone: "dark" }
                  : state() === "out_of_stock"
                    ? { text: t("common.stock_out_overlay"), tone: "dark" }
                    : undefined,
            }}
          >
            {/* แลกแล้ว (เปิดจากประวัติการแลก): สถานะ + ที่อยู่จัดส่ง */}
            <Show when={redeemed()}>
              {(r) => (
                <div class="flex flex-col gap-2">
                  <p class="flex items-center gap-2 text-14 font-semibold text-dark">
                    {r().method === "delivery" ? t("priv.delivery_status_label") : t("priv.redeem_status_label")}
                    <Badge tone={redeemedStatus()!.tone}>{t(redeemedStatus()!.key)}</Badge>
                  </p>
                  <Show when={r().method === "delivery" && r().address}>
                    {(a) => (
                      <>
                        <p class="text-14 font-semibold text-dark">{t("priv.delivery_address_label")}</p>
                        <div class="flex flex-col gap-1 rounded-2xl bg-secondary-surface p-4">
                          <p class="flex flex-wrap items-center gap-2 text-14">
                            <span class="font-semibold text-primary">{t(`priv.type_${a().type}`)}</span>
                            <span class="font-semibold text-dark">
                              {a().name} {a().surname}
                            </span>
                            <span class="text-dark">{a().phone}</span>
                          </p>
                          <p class="text-12 text-gray">{a().text}</p>
                        </div>
                      </>
                    )}
                  </Show>
                </div>
              )}
            </Show>

            <DetailTitle title={item().title} description={item().description} />
            <DetailMeta
              items={[
                {
                  icon: IconCalendar,
                  text: `${t("privilage.redemption_period")}: ${formatDate(item().redeem_start)} - ${formatDate(item().redeem_end)}`,
                  note:
                    state() === "expired_redeem"
                      ? { text: t("privilage.redemption_period_has_ended"), tone: "error" }
                      : state() === "not_started"
                        ? { text: t("priv.starts_on", { date: formatDate(item().redeem_start) }), tone: "secondary" }
                        : undefined,
                },
              ]}
            />
            <Show when={!redeemed()}>
              <StatSplitBox
                items={[
                  {
                    icon: <img src={theme().image_point} alt="" class="size-4 rounded-full" />,
                    value: `${formatNumber(item().points)} ${t("common.points")}`,
                    label: t("privilage.points_required"),
                  },
                  {
                    icon: <IconGift size={16} />,
                    value: `${formatNumber(item().remaining)} ${t("privilage.privilege_use")}`,
                    label: t("privilage.remaining_privilege"),
                  },
                ]}
              />
            </Show>
            <InfoTabs
              defaultValue="howto"
              items={[
                { value: "howto", label: t("common.step"), content: item().how_to },
                { value: "more", label: t("common.more"), content: item().more },
                { value: "condition", label: t("common.condition"), content: item().conditions },
              ]}
            />

            <Show when={!redeemed()}>
              <DetailActionBar
                redeem={{ unit: "points", cost: item().points }}
              >
                <Button size="block" onClick={() => requireMember(startRedeem)} disabled={disabled()}>
                  {state() === "expired_redeem"
                    ? t("privilage.redemption_period_has_ended")
                    : state() === "not_started"
                      ? t("priv.starts_on", { date: formatDate(item().redeem_start) })
                      : state() === "out_of_stock"
                        ? t("common.stock_out_overlay")
                        : isCoupon()
                          ? t("common.redeem_coupon")
                          : t("common.redeem_item")}
                </Button>
              </DetailActionBar>
            </Show>
            {/* วิธีรับสินค้า (ต้นฉบับ dialog-redeem-*.js) */}
            <Sheet open={methodOpen()} onOpenChange={setMethodOpen} title={t("loyalty.receive_method_title")}>
              <div class="flex flex-col gap-4">
                <Button size="block" onClick={() => chooseMethod("pickup")}>
                  <IconShop size={20} />
                  {t("loyalty.receive_pickup")}
                </Button>
                <Button size="block" onClick={() => chooseMethod("delivery")}>
                  <IconDelivery size={20} />
                  {t("loyalty.receive_delivery")}
                </Button>
              </div>
            </Sheet>

            <AlertDialog
              open={confirmOpen()}
              onOpenChange={setConfirmOpen}
              icon={<GiftIcon />}
              title={method() === "pickup" || isCoupon() ? confirmTitle() : t("common.confirm_redeem_question")}
              description={
                // คูปอง: ไม่มีรหัสหมดอายุ — เก็บเข้าคูปองของฉัน · รับที่ร้าน: รหัสหมดอายุใน 10 นาที
                isCoupon()
                  ? t("common.coupon_redeem_success_note")
                  : method() === "pickup"
                    ? `${t("common.confirmation_generate_code_expire")} ${minutes()} ${t("common.minutes")}`
                    : t("common.confirm_redeem_description")
              }
              cancelText={t("common.cancel")}
              confirmText={t("common.confirm")}
              onConfirm={redeem}
            />
            <ResultModal
              open={result() === "success"}
              onOpenChange={(o) => !o && goHistory()}
              title={
                isCoupon()
                  ? t("common.coupon_redeem_success_title")
                  : t("common.notifications.redeem.success", { product_name: item().title, point: formatNumber(item().points) })
              }
              description={isCoupon() ? t("common.coupon_redeem_success_note") : t("common.points_history_hint")}
              buttonText={t("common.close")}
            />
            <ResultModal
              open={result() === "failed"}
              onOpenChange={(o) => !o && setResult(null)}
              variant="error"
              title={t("mission.redeem_failed_title")}
              description={t("mission.redeem_failed_description")}
              buttonText={t("common.close")}
            />
            <CodeDialog
              open={!!code()}
              onOpenChange={(o) => !o && setCode("")}
              title={item().title}
              code={code()}
              expiresAt={codeExpiresAt()}
              backText={t("privilage.exchange_history")}
              onBack={goHistory}
              onExpire={() => setCode("")}
            />
          </DetailLayout>
        )}
      </Show>
      <PageLoading show={loading()} />
    </>
  );
}


