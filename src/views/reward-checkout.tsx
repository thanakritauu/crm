import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { createMemo, createSignal, onMount, Show } from "solid-js";
import { AddressCard } from "~/components/account/address-card";
import { addressService } from "~/services/address-service";
import { GiftIcon } from "~/components/reward/icons";
import { DetailActionBar } from "~/components/detail/detail-layout";
import { PageHeader } from "~/components/layout/page-header";
import { AlertDialog, ResultModal } from "~/components/ui/modal";
import { Button } from "~/components/ui/button";
import { CoverImage } from "~/components/ui/cover-image";
import { EmptyData } from "~/components/ui/empty-data";
import { PageLoading } from "~/components/ui/page-loading";
import { useI18n } from "~/lib/i18n";
import { session, sessionActions } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { delay, formatNumber } from "~/lib/utils";
import { rewardService } from "~/services/reward-service";
import { IconInfo, IconGift } from "~/components/ui/icons";

/**
 * /:partner/reward/summarize?id=… — สรุปการแลกของรางวัล
 * ต้นฉบับ: index-50505985 (ที่อยู่จัดส่ง + ปุ่มแก้ไข, รายการสินค้า col-3/6/3 + hr, ราคารวม/ค่าจัดส่ง/รวมทั้งหมด,
 * แผงล่าง → BottomActionBar + ปุ่ม "ดำเนินการต่อ")
 * ต้นฉบับยังเป็นตะกร้าราคาบาท (hard-code 2 ชิ้น, ปุ่มแค่ console.log) — prototype เปลี่ยนเป็นคะแนน 1 ชิ้น:
 * ยืนยัน → AlertDialog → sessionActions.redeemReward → สำเร็จ → /history
 * ที่อยู่จัดส่ง: ใช้สมุดที่อยู่เหมือนหน้าสรุปสิทธิพิเศษ (privilage/summary) — การ์ดที่อยู่ + "เลือก" → สมุดที่อยู่โหมดเลือก
 *   ?address=<id> = ที่อยู่ที่เลือก (ไม่มี = ค่าเริ่มต้น) · ยังไม่มีที่อยู่ = กล่องแจ้ง + "เพิ่มที่อยู่" และกดดำเนินการต่อไม่ได้
 */
export default function RewardSummarize() {
  const [search] = useSearchParams<{ address?: string }>();
  const navigate = useNavigate();
  const to = usePartnerPath();
  const { t } = useI18n();
  const params = useParams();
  const reward = () => rewardService.get(params.id ?? "");
  const [confirmOpen, setConfirmOpen] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [result, setResult] = createSignal<"success" | "failed" | null>(null);

  onMount(() => addressService.restore());
  const address = createMemo(() => (search.address ? addressService.get(search.address) : undefined) ?? addressService.defaultAddress());
  const selfPath = () => `reward/summarize?id=${reward()?.id ?? ""}`;
  const chooseAddress = () =>
    navigate(to(`profile/addresses?select=1&return=${encodeURIComponent(selfPath())}${address() ? `&selected=${address()!.id}` : ""}`));
  const addAddress = () => navigate(to(`profile/addresses/new?select=1&return=${encodeURIComponent(selfPath())}`));
  const remainingAfter = () => session.customer.points - (reward()?.points ?? 0);

  const redeem = async () => {
    setLoading(true);
    await delay(700);
    const a = address();
    if (!a) return setLoading(false);
    const ok = sessionActions.redeemReward(reward()!.id, {
      name: a.name,
      surname: a.surname,
      phone: a.phone,
      text: addressService.format(a),
      type: a.type,
    });
    setLoading(false);
    setResult(ok ? "success" : "failed");
  };

  return (
    <div class="mx-auto flex h-full min-h-screen flex-1 flex-col bg-white">
      <PageHeader title={t("common.redeem_item")} backTo={reward() ? `rewards/${reward()!.id}` : "rewards?type=products"} />
      <Show when={reward()} fallback={<div class="pt-8"><EmptyData icon={IconGift} title={t("loyalty.reward_not_found")} /></div>}>
        {(r) => (
          <>
            <div class="px-4">
              <div class="grid grid-cols-12">
                {/* ที่อยู่จัดส่ง (สมุดที่อยู่) */}
                <div class="col-span-12 flex flex-col gap-2 pb-6">
                  <div class="flex items-center justify-between">
                    <h2 class="text-16 font-semibold text-dark">{t("common.shipping_address")}</h2>
                    <Show when={address()}>
                      <button type="button" class="min-h-10 px-2 text-14 font-medium text-primary underline" onClick={chooseAddress}>
                        {t("priv.choose")}
                      </button>
                    </Show>
                  </div>
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
                </div>

                {/* รายการ */}
                <div class="col-span-12 grid grid-cols-12 gap-x-4">
                  <div class="col-span-3">
                    <CoverImage colors={r().cover} src={r().image} class="aspect-square w-full rounded-lg" />
                  </div>
                  <div class="col-span-6 flex items-center">
                    <h2 class="text-14 font-semibold text-gray">{r().name}</h2>
                  </div>
                  <div class="col-span-3 flex items-center justify-end">
                    <h2 class="text-right text-14 font-semibold text-dark">
                      {formatNumber(r().points)} {t("common.points")}
                    </h2>
                  </div>
                </div>
                <div class="col-span-12 my-4">
                  <hr class="border-stroke" />
                </div>

                {/* สรุปคะแนน */}
                <div class="col-span-12">
                  <span class="flex justify-between py-2">
                    <span class="text-14 font-normal text-gray">{t("component.card_member.total_points")}</span>
                    <span class="text-14 font-normal text-dark">{formatNumber(session.customer.points)}</span>
                  </span>
                  <span class="flex justify-between pb-2">
                    <span class="text-14 font-normal text-gray">{t("privilage.points_required")}</span>
                    <span class="text-14 font-normal text-dark">-{formatNumber(r().points)}</span>
                  </span>
                  <span class="flex justify-between pb-2">
                    <span class="text-14 font-normal text-gray">{t("platform.select.fields.final_shipping_fee")}</span>
                    <span class="text-14 font-normal text-dark">{t("priv.free")}</span>
                  </span>
                  <span class="flex justify-between pb-2">
                    <span class="text-14 font-semibold text-gray">{t("privilage.remaining_points")}</span>
                    <span class="text-14 font-semibold text-dark">{formatNumber(remainingAfter())}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* ไม่มีแถว "ใช้ X · คงเหลือ Y" ด้านล่าง — สรุปคะแนนอยู่ในหน้าแล้ว (เดิม "คงเหลือ" ล่าง = ยอดก่อนแลก ขัดกับ "คะแนนคงเหลือ" ในสรุป · 2026-11-28) */}
            <DetailActionBar>
              <Button size="block" disabled={!address() || remainingAfter() < 0 || r().stock <= 0} onClick={() => setConfirmOpen(true)}>
                {remainingAfter() < 0 ? t("privilage.insufficient_points") : t("loyalty.continue")}
              </Button>
            </DetailActionBar>

            <AlertDialog
              open={confirmOpen()}
              onOpenChange={setConfirmOpen}
              title={
                <>
                  {t("common.confirm_redeem_prefix")}
                  <span class="text-primary">
                    {formatNumber(r().points)} {t("common.points")}
                  </span>
                  {t("common.confirm_suffix")}
                </>
              }
              description={t("common.confirm_redeem_description")}
              icon={<GiftIcon />}
              cancelText={t("common.cancel")}
              confirmText={t("common.confirm")}
              onConfirm={redeem}
            />
            <ResultModal
              open={result() === "success"}
              onOpenChange={(o) => !o && navigate(to("wallet/points-history?filter=redeemed"))}
              title={t("common.notifications.redeem.success", { product_name: r().name, point: formatNumber(r().points) })}
              description={t("common.points_history_hint")}
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
          </>
        )}
      </Show>
      <PageLoading show={loading()} />
    </div>
  );
}

