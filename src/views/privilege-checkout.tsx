import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { createMemo, createSignal, onMount, Show } from "solid-js";
import { DetailActionBar } from "~/components/detail/detail-layout";
import { PageHeader } from "~/components/layout/page-header";
import { AddressCard } from "~/components/account/address-card";
import { Button } from "~/components/ui/button";
import { CoverImage } from "~/components/ui/cover-image";
import { EmptyData } from "~/components/ui/empty-data";
import { AlertDialog, ResultModal } from "~/components/ui/modal";
import { PageLoading } from "~/components/ui/page-loading";
import { useI18n } from "~/lib/i18n";
import { session, sessionActions } from "~/lib/session";
import { usePartnerPath, useTheme } from "~/lib/theme";
import { delay, formatNumber } from "~/lib/utils";
import { addressService } from "~/services/address-service";
import { privilegeService } from "~/services/privilege-service";
import { IconGift, IconInfo } from "~/components/ui/icons";

/**
 * /:partner/privilage/summary/:id — สรุปคำสั่งแลกสิทธิพิเศษแบบจัดส่งถึงบ้าน
 * Figma: Summary_Address (393:3132) · Summary_NonAddress (393:3472) · Confirm_ShopOrHome สำเร็จ (393:2554)
 * - มีที่อยู่: การ์ดที่อยู่ (ป้ายค่าเริ่มต้น, ประเภท, ชื่อ เบอร์, ที่อยู่) + "เลือก" มุมขวาบน → สมุดที่อยู่โหมดเลือก
 * - ไม่มีที่อยู่: กล่องแจ้ง "คุณยังไม่ได้กรอกที่อยู่…" + ปุ่ม "เพิ่มที่อยู่" · ปุ่มยืนยันกดไม่ได้
 * - สินค้า x 1 "ฟรี" · คะแนนที่ใช้แลก · ปุ่ม "ยืนยันการแลก" → ยืนยัน → "แลกสินค้าสำเร็จ! รอรับสินค้าได้เลย" → กลับหน้าประวัติการแลก
 * ?address=<id> = ที่อยู่ที่เลือกจากสมุดที่อยู่ (ไม่มี = ที่อยู่ค่าเริ่มต้น)
 */
export default function PrivilegeSummary() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const params = useParams();
  const [search] = useSearchParams<{ address?: string }>();
  const navigate = useNavigate();
  const to = usePartnerPath();
  onMount(() => addressService.restore());

  const p = () => privilegeService.get(params.id ?? "");
  const address = createMemo(() => (search.address ? addressService.get(search.address) : undefined) ?? addressService.defaultAddress());
  const enough = () => session.customer.points >= (p()?.points ?? Infinity);
  const [confirmOpen, setConfirmOpen] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [result, setResult] = createSignal<"success" | "failed" | null>(null);

  const selfPath = () => `rewards/${params.id}/checkout`;
  const chooseAddress = () =>
    navigate(to(`profile/addresses?select=1&return=${encodeURIComponent(selfPath())}${address() ? `&selected=${address()!.id}` : ""}`));
  const addAddress = () => navigate(to(`profile/addresses/new?select=1&return=${encodeURIComponent(selfPath())}`));
  const goHistory = () => navigate(to("wallet/redemptions"), { replace: true });

  const redeem = async () => {
    const a = address();
    if (!a) return;
    setLoading(true);
    await delay(700);
    const ok = sessionActions.redeemPrivilege(p()!.id, {
      method: "delivery",
      address: { name: a.name, surname: a.surname, phone: a.phone, text: addressService.format(a), type: a.type },
    });
    setLoading(false);
    setResult(ok ? "success" : "failed");
  };

  return (
    <div class="min-h-screen bg-white">
      <Show
        when={p()}
        fallback={
          <>
            <PageHeader title={t("priv.delivery_address_title")} backTo="rewards" />
            <EmptyData class="pt-16" title={t("privilage.no_privilage_found")} />
          </>
        }
      >
        {(item) => (
          <>
            <PageHeader
              title={address() ? t("priv.shipping_address_title") : t("priv.delivery_address_title")}
              backTo={`rewards/${item().id}`}
              right={
                <Show when={address()}>
                  <button type="button" class="hit-area text-14 font-medium text-primary underline" onClick={chooseAddress}>
                    {t("priv.choose")}
                  </button>
                </Show>
              }
            />

            <div class="flex flex-col gap-4 px-4">
              <Show
                when={address()}
                fallback={
                  <div class="flex items-center gap-2 rounded-2xl bg-secondary-surface p-4">
                    <IconInfo size={16} class="shrink-0 text-secondary" />
                    <p class="min-w-0 flex-1 text-14 text-dark">{t("priv.no_address")}</p>
                    <Button size="sm" onClick={addAddress}>
                      {t("priv.add_address")}
                    </Button>
                  </div>
                }
              >
                {(a) => <AddressCard address={a()} showDefault />}
              </Show>

              {/* สินค้า x 1 · ฟรี */}
              <div class="flex gap-4 border-b border-stroke pb-4">
                <CoverImage colors={item().cover} src={item().image} class="size-16 shrink-0 overflow-hidden rounded-lg border border-stroke" />
                <div class="flex min-w-0 flex-1 justify-between gap-2">
                  <p class="line-clamp-2 text-14 font-semibold text-dark">
                    {item().title}
                    <br />x 1
                  </p>
                  <span class="shrink-0 text-14 font-semibold text-dark">{t("priv.free")}</span>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-14 text-gray">{t("priv.points_used")}</span>
                <span class="flex items-center gap-1 text-14 font-semibold text-primary">
                  {formatNumber(item().points)} {t("common.points")}
                  <img src={theme().image_point} alt="" class="size-4 rounded-full" />
                </span>
              </div>
            </div>

            <DetailActionBar redeem={{ unit: "points", cost: item().points }}>
              <Button size="block" disabled={!address() || !enough()} onClick={() => setConfirmOpen(true)}>
                {enough() ? t("priv.confirm_redeem") : t("privilage.insufficient_points")}
              </Button>
            </DetailActionBar>

            <AlertDialog
              open={confirmOpen()}
              onOpenChange={setConfirmOpen}
              icon={<img src="/images/figma/badge-p.svg" alt="" width="24" height="24" />}
              title={t("common.confirm_redeem_question")}
              description={t("common.confirm_redeem_description")}
              cancelText={t("common.cancel")}
              confirmText={t("common.confirm")}
              onConfirm={redeem}
            />
            {/* Figma 393:2554: ไอคอนของขวัญ + "แลกสินค้าสำเร็จ!" + "รอรับสินค้าได้เลย" + "กลับหน้าประวัติการแลก" */}
            <ResultModal
              open={result() === "success"}
              onOpenChange={(o) => !o && goHistory()}
              icon={<IconGift size={24} class="text-dark" />}
              title={t("priv.success_title")}
              description={t("priv.success_desc")}
              buttonText={t("priv.back_to_history")}
            />
            <ResultModal
              open={result() === "failed"}
              onOpenChange={(o) => !o && setResult(null)}
              variant="error"
              title={t("mission.redeem_failed_title")}
              description={t("mission.redeem_failed_description")}
            />
          </>
        )}
      </Show>
      <PageLoading show={loading()} />
    </div>
  );
}
