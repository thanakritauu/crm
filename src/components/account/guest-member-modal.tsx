import { Dialog as DialogPrimitive } from "@kobalte/core/dialog";
import { For, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/lib/i18n";
import { modalPanel, overlayBackdrop, overlayCenter } from "~/components/ui/overlay";
import { cn } from "~/lib/utils";
import { IconBolt, IconCheck, IconClose, IconGift, IconHeart, IconRocket, IconSale, IconSettings, IconStar, IconTicket } from "~/components/ui/icons";

/**
 * ตารางเปรียบเทียบ Guest กับ Member (Figma "Info" 1279:9643)
 * หัวชมพู มุมบน 24 "ความแตกต่าง / Guest Mode vs Member" · ตาราง 3 คอลัมน์ พื้นชมพูอ่อน คอลัมน์ Member พื้นชมพูเข้ม
 * Guest ใช้ได้: สะสมคะแนน, ทำภารกิจ · ที่เหลือเฉพาะ Member · ปุ่ม "ปิด"
 */
const PERKS: { key: string; icon: typeof IconStar; guest: boolean }[] = [
  { key: "landing.member_info.collect_points", icon: IconStar, guest: true },
  { key: "landing.member_info.mission", icon: IconRocket, guest: true },
  { key: "landing.member_info.redeem", icon: IconGift, guest: false },
  { key: "landing.member_info.coupon", icon: IconTicket, guest: false },
  { key: "landing.member_info.connect", icon: IconSettings, guest: false },
  { key: "landing.member_info.information", icon: IconSale, guest: false },
  { key: "landing.member_info.gift", icon: IconHeart, guest: false },
  { key: "landing.member_info.tier", icon: IconBolt, guest: false },
];

export function GuestMemberModal(props: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useI18n();
  return (
    <DialogPrimitive open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay class={overlayBackdrop} />
        <div class={overlayCenter}>
          <DialogPrimitive.Content class={cn(modalPanel, "overflow-hidden")}>
            <DialogPrimitive.Title class="flex flex-col bg-primary p-4 text-center text-18 font-semibold text-white">
              <span>{t("landing.member_info.difference")}</span>
              <span>{t("landing.member_info.guest_vs_member")}</span>
            </DialogPrimitive.Title>
            <div class="flex flex-col gap-2 p-2">
              <div class="overflow-hidden rounded-2xl">
                <div class="grid grid-cols-[1fr_56px_56px] text-12 font-semibold">
                  <span class="border-b-2 border-white bg-primary-surface px-2 py-2 text-primary">{t("landing.member_info.privilage")}</span>
                  <span class="border-b-2 border-white bg-primary-surface py-2 text-center text-primary">{t("landing.member_info.guest")}</span>
                  <span class="border-b-2 border-white bg-primary py-2 text-center text-white">{t("landing.member_info.member")}</span>
                </div>
                <For each={PERKS}>
                  {(p) => (
                    <div class="grid h-10 grid-cols-[1fr_56px_56px]">
                      <span class="flex min-w-0 items-center gap-2 bg-primary-surface px-2 text-12 font-medium text-dark">
                        <Dynamic component={p.icon} size={16} class="shrink-0 text-dark" />
                        <span class="truncate">{t(p.key)}</span>
                      </span>
                      <span class="flex items-center justify-center bg-primary-surface">
                        <Show when={p.guest} fallback={<IconClose size={16} class="text-gray" aria-label={t("auth.not_available")} />}>
                          <IconCheck size={16} strokeWidth={2} class="text-primary" aria-label={t("auth.available")} />
                        </Show>
                      </span>
                      <span class="flex items-center justify-center bg-primary">
                        <IconCheck size={16} strokeWidth={2} class="text-white" aria-label={t("auth.available")} />
                      </span>
                    </div>
                  )}
                </For>
              </div>
              <Button size="block" onClick={() => props.onOpenChange(false)}>
                {t("common.close")}
              </Button>
            </div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive>
  );
}
