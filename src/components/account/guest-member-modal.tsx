import { For, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Sheet } from "~/components/ui/sheet";
import { useI18n } from "~/lib/i18n";
import { IconBolt, IconCheck, IconClose, IconGift, IconHeart, IconRocket, IconSale, IconSettings, IconStar, IconTicket } from "~/components/ui/icons";

/**
 * ตารางเปรียบเทียบ Guest กับ Member (Figma "Info" 1279:9643)
 * bottom sheet (2026-11-28): หัวข้อ "ความแตกต่าง Guest Mode vs Member" + X · ตาราง 3 คอลัมน์ ม่วงอ่อน คอลัมน์ Member ม่วง
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
    // bottom sheet (เดิม popup กลางจอหัวชมพู · 2026-11-28) — หัวข้อ + ปุ่มปิด X ของ Sheet
    <Sheet open={props.open} onOpenChange={props.onOpenChange} title={`${t("landing.member_info.difference")} ${t("landing.member_info.guest_vs_member")}`}>
      <div class="overflow-hidden rounded-2xl">
        <div class="grid grid-cols-[1fr_56px_56px] text-12 font-semibold">
          <span class="border-b-2 border-white bg-secondary-surface px-2 py-2 text-secondary">{t("landing.member_info.privilage")}</span>
          <span class="border-b-2 border-white bg-secondary-surface py-2 text-center text-secondary">{t("landing.member_info.guest")}</span>
          <span class="border-b-2 border-white bg-secondary py-2 text-center text-white">{t("landing.member_info.member")}</span>
        </div>
        <For each={PERKS}>
          {(p) => (
            <div class="grid h-10 grid-cols-[1fr_56px_56px]">
              <span class="flex min-w-0 items-center gap-2 bg-secondary-surface px-2 text-12 font-medium text-dark">
                <Dynamic component={p.icon} size={16} class="shrink-0 text-dark" />
                <span class="truncate">{t(p.key)}</span>
              </span>
              <span class="flex items-center justify-center bg-secondary-surface">
                <Show when={p.guest} fallback={<IconClose size={16} class="text-gray" aria-label={t("auth.not_available")} />}>
                  <IconCheck size={16} strokeWidth={2} class="text-secondary" aria-label={t("auth.available")} />
                </Show>
              </span>
              <span class="flex items-center justify-center bg-secondary">
                <IconCheck size={16} strokeWidth={2} class="text-white" aria-label={t("auth.available")} />
              </span>
            </div>
          )}
        </For>
      </div>
    </Sheet>
  );
}
