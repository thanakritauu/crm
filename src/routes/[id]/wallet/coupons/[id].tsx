import { useNavigate, useParams } from "@solidjs/router";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { CodeDialog } from "~/components/coupon/code-dialog";
import { ConfirmModal } from "~/components/ui/modal";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/lib/i18n";
import { requireMember } from "~/lib/member-gate";
import { session, sessionActions } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { formatDate } from "~/lib/utils";
import { PageHeader } from "~/components/layout/page-header";
import { EmptyData } from "~/components/ui/empty-data";
import { IconTicket } from "~/components/ui/icons";
import { InfoTabs } from "~/components/ui/info-tabs";
import { CouponDefaultCover } from "~/components/coupon/coupon-default-cover";
import { DetailActionBar, DetailLayout, DetailMeta, DetailTitle } from "~/components/detail/detail-layout";
import { useBackWith } from "~/lib/navigation";

/**
 * /:partner/coupon/my-coupons/detail/:id — รายละเอียดคูปอง (Figma "Coupon_Detail" 583:1865)
 * ใช้ template หน้ารายละเอียด (components/detail/detail-layout): header "คูปองของฉัน" · รูป 16:9 · ชื่อ + รายละเอียด
 *   · ระยะเวลาใช้คูปอง · แท็บ "วิธีใช้ / เงื่อนไข" (เดิมพับ/ขยาย) · ปุ่ม "ใช้คูปอง"
 * Flow: ใช้คูปอง → Confirm (583:4329) → คูปองเป็น "ใช้งานแล้ว" ทันที → Modal รหัส QR/บาร์โค้ด/โค้ด
 *   ภายใน 10 นาทีหลังยืนยัน กลับมาหน้านี้กด "แสดงรหัส" ดูรหัสเดิมได้ (เวลาเดินต่อ) · หลังจากนั้นปุ่มเทา
 * รูป (Figma 1615:5197 / 1615:5255 / 1062:4800): ใช้แล้ว/หมดอายุ = ทับดำโปร่ง + ข้อความ 18/Semi สีขาว
 *   รูปโหลดไม่ได้ = พื้น Text/Placeholder + ไอคอน APIError 100px
 */

export default function CouponDetail() {
  const { t } = useI18n();
  const params = useParams();
  const navigate = useNavigate();
  const backWith = useBackWith();
  const to = usePartnerPath();
  const coupon = () => session.myCoupons.find((c) => c.id === params.id);
  const [confirm, setConfirm] = createSignal(false);
  const [codeOpen, setCodeOpen] = createSignal(false);
  // นาฬิกาสำหรับเช็กว่ายังดูรหัสซ้ำได้หรือไม่
  const [now, setNow] = createSignal(Date.now());
  onMount(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    onCleanup(() => clearInterval(timer));
  });
  const usable = () => coupon()?.status === "available";
  const canReopenCode = () => {
    const c = coupon();
    return c?.status === "used" && !!c.code_expires_at && new Date(c.code_expires_at).getTime() > now();
  };

  return (
    <Show
      when={coupon()}
      fallback={
        <div class="min-h-screen bg-white">
          <PageHeader title={t("home.my_coupon")} backTo="wallet/coupons" />
          <EmptyData class="pt-16" title={t("core.coupon_not_found")} />
        </div>
      }
    >
      {(c) => (
        <DetailLayout
          title={t("home.my_coupon")}
          backTo="wallet/coupons"
          cover={{
            colors: c().cover,
            src: c().image,
            fallback: <CouponDefaultCover discount={c().discount} size="lg" class="size-full" />,
            overlay:
              c().status === "used"
                ? { text: t("common.expired_use_overlay"), tone: "gray" }
                : c().status === "expired"
                  ? { text: t("core.coupon_expired"), tone: "dark" }
                  : undefined,
          }}
        >
          <DetailTitle title={c().title} description={c().description} />
          <DetailMeta
            items={[
              {
                icon: IconTicket,
                text: `${t("common.coupon_use.period_label")}: ${formatDate(c().valid_from ?? c().expires_at)} - ${formatDate(c().expires_at)}`,
              },
            ]}
          />
          <InfoTabs
            hideEmpty
            items={[
              { value: "howto", label: t("core.coupon_howto"), content: [t("core.coupon_howto_1"), t("core.coupon_howto_2"), t("core.coupon_howto_3")] },
              { value: "condition", label: t("common.condition"), content: c().conditions },
            ]}
          />

          <DetailActionBar>
            <Show
              when={canReopenCode()}
              fallback={
                <Button size="block" disabled={!usable()} onClick={() => requireMember(() => setConfirm(true))}>
                  {c().status === "used"
                    ? t("common.expired_use_overlay")
                    : c().status === "expired"
                      ? t("core.coupon_expired")
                      : t("common.coupon_use.use_button")}
                </Button>
              }
            >
              <Button size="block" onClick={() => setCodeOpen(true)}>
                {t("core.show_code")}
              </Button>
            </Show>
          </DetailActionBar>

          <ConfirmModal
            open={confirm()}
            onOpenChange={setConfirm}
            icon={<IconTicket size={20} class="text-primary" />}
            title={t("common.coupon_use.confirm_title")}
            // ข้อความต้นฉบับใช้ {minutes} (วงเล็บเดี่ยว) → แทนค่าเองด้วย
            description={t("common.coupon_use.confirm_desc", { minutes: 10 }).replace("{minutes}", "10")}
            onConfirm={() => {
              sessionActions.useCoupon(c().id);
              setCodeOpen(true);
            }}
          />
          <CodeDialog
            open={codeOpen()}
            onOpenChange={setCodeOpen}
            title={c().title}
            code={c().code}
            expiresAt={c().code_expires_at ?? Date.now() + 600_000}
            backText={t("core.back_to_my_coupons")}
            onBack={() => backWith("wallet/coupons")}
          />
        </DetailLayout>
      )}
    </Show>
  );
}
