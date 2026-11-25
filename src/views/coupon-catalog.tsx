import { A, useNavigate } from "@solidjs/router";
import { createSignal, For, Show, type JSX } from "solid-js";
import { CouponTicket } from "~/components/coupon/coupon-ticket";
import { IconChevronRight, IconTicket } from "~/components/ui/icons";
import { TicketIcon } from "~/components/reward/icons";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { AlertDialog, ResultModal } from "~/components/ui/modal";
import { PageLoading } from "~/components/ui/page-loading";
import { COUPON_CODE_EXPIRE_MINUTES, type Coupon } from "~/mocks/coupons";
import { requireMember } from "~/lib/member-gate";
import { useI18n } from "~/lib/i18n";
import { session, sessionActions } from "~/lib/session";
import { usePartnerPath, useTheme } from "~/lib/theme";
import { delay, formatNumber } from "~/lib/utils";
import { couponService } from "~/services/coupon-service";

/**
 * /:partner/coupon — แคตตาล็อกคูปองที่แลกด้วยคะแนน
 * ต้นฉบับ: index-c333a54c (NavigationTopbar navTo=home + รายการคูปองทรงตั๋ว h-[110px]; ข้อมูล hard-code 2 ใบ ไม่มีปุ่มแลก)
 * ขั้นตอนแลก/ข้อความ dialog ยืมจาก privilage/detail ของต้นฉบับ (is_coupon):
 *   ยืนยัน "ยืนยันการใช้ X คะแนน หรือไม่?" + confirmation_generate_code_expire → coupon_redeem_success_title/_note → coupon/my-coupons
 * mock: couponService.catalog() + sessionActions.redeemCoupon
 */
/** แท็บ "คูปอง" ในหน้าแลกรางวัล (/rewards?type=coupons) — เดิมหน้า /coupon */
export function CouponCatalog(props: { extra?: JSX.Element }) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const to = usePartnerPath();
  const navigate = useNavigate();
  const [selected, setSelected] = createSignal<Coupon | null>(null);
  const [confirmOpen, setConfirmOpen] = createSignal(false);
  const [insufficient, setInsufficient] = createSignal(false);
  const [success, setSuccess] = createSignal(false);
  const [loading, setLoading] = createSignal(false);

  const pick = (c: Coupon) => {
    setSelected(c);
    if (session.customer.points < c.points) setInsufficient(true);
    else setConfirmOpen(true);
  };

  const redeem = async () => {
    const c = selected();
    if (!c) return;
    setLoading(true);
    await delay(600);
    const coupon = sessionActions.redeemCoupon(c.id);
    setLoading(false);
    if (coupon) setSuccess(true);
    else setInsufficient(true);
  };

  return (
    <div>
      {/* แลกคะแนนเป็นคูปองส่วนลด (เดิมอยู่ในเมนูโปรไฟล์) */}
      <div class="px-4 pt-4">
        <A href={to("rewards/points-to-coupon")} class="flex items-center justify-between gap-2 rounded-2xl bg-primary-surface p-4">
          <span class="flex items-center gap-2 text-14 font-semibold text-dark">
            <IconTicket size={20} class="text-primary" />
            {t("profile.exchange_points_menu")}
          </span>
          <IconChevronRight size={16} class="text-gray" />
        </A>
      </div>
      {/* สิทธิพิเศษที่เป็นคูปอง (ส่งมาจากหน้าแลกรางวัล) */}
      {props.extra}
      <div class="p-4">
        <div class="grid grid-cols-1 gap-y-2">
          <For each={couponService.catalog()}>
            {(c) => (
              <CouponTicket
                coupon={c}
                onClick={() => requireMember(() => pick(c))}
                footer={
                  <div class="mt-2 flex items-center justify-between gap-2">
                    <Badge tone="teriary" size="md" class="py-1">
                      {t("common.use")} {formatNumber(c.points)} {t("common.points")}
                    </Badge>
                    {/* ทั้งการ์ดกดได้อยู่แล้ว → ใช้หน้าตา Button แต่เป็น span */}
                    <span class={buttonVariants({ variant: "primary", size: "sm" })}>{t("common.redeem_coupon")}</span>
                  </div>
                }
              />
            )}
          </For>
        </div>
      </div>

      <AlertDialog
        open={confirmOpen()}
        onOpenChange={setConfirmOpen}
        icon={<TicketIcon />}
        title={
          <>
            {t("common.confirm_redeem_prefix")}
            <span class="text-primary">
              {formatNumber(selected()?.points ?? 0)} {t("common.points")}
            </span>
            {t("common.confirm_suffix")}
          </>
        }
        description={t("common.coupon_redeem_success_note")}
        cancelText={t("common.cancel")}
        confirmText={t("common.confirm")}
        onConfirm={redeem}
      />
      <ResultModal
        open={success()}
        onOpenChange={(o) => !o && navigate(to("rewards?type=mine"))}
        title={t("common.coupon_redeem_success_title")}
        description={t("common.coupon_redeem_success_note")}
        buttonText={t("home.my_coupon")}
      />
      <ResultModal
        open={insufficient()}
        onOpenChange={setInsufficient}
        variant="error"
        title={t("privilage.insufficient_points")}
        buttonText={t("common.close")}
      />
      <PageLoading show={loading()} />
    </div>
  );
}
