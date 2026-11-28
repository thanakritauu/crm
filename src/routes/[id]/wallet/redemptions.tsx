import { useNavigate } from "@solidjs/router";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { ActivityEmpty } from "~/components/history/activity-row";
import { PageHeader } from "~/components/layout/page-header";
import { Badge } from "~/components/ui/badge";
import { ImageRowCard } from "~/components/ui/image-row-card";
import { IconGift } from "~/components/ui/icons";
import { useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { formatDate, formatNumber } from "~/lib/utils";
import type { RedeemRecord } from "~/mocks/history";
import { privilegeService, REDEEM_STATUS } from "~/services/privilege-service";

/**
 * /:partner/wallet/redemptions — การแลกรางวัลของฉัน (แยกจากประวัติคะแนน/คอยน์ — ตัดสินใจ 2026-11-25 แบบ A)
 * เดิมเป็นแท็บ "การแลกรางวัล" ใน /wallet/history (ลิงก์เดิม ?type=redemptions พามาหน้านี้)
 * การ์ดรูป + สถานะ (จัดส่งเดินเองตามเวลา) → รายละเอียดการแลก /rewards/:id?redeem=
 * เข้าจาก: โปรไฟล์ › คูปองและประวัติ · หลังแลกสิทธิพิเศษสำเร็จ
 */
export default function MyRedemptionsPage() {
  const { t } = useI18n();
  return (
    <div class="img-background min-h-screen bg-white bg-cover bg-center">
      <PageHeader tone="primary" align="center" backTo="profile" title={t("rw.my_redemptions")} />
      <RedemptionList />
      <div class="h-8" aria-hidden="true" />
    </div>
  );
}

/** ประวัติการแลก (Figma Reward History 142:1951): รูป (ไม่ทับ "แลกแล้ว" — ทุกรายการในหน้านี้แลกแล้ว · 2026-11-28) + ป้ายสถานะ (จัดส่งเดินเองตามเวลา) */
function RedemptionList() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const navigate = useNavigate();
  const [now, setNow] = createSignal(Date.now());
  onMount(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    onCleanup(() => clearInterval(timer));
  });
  const coverOf = (h: RedeemRecord) => (h.privilege_id ? privilegeService.get(h.privilege_id) : undefined);
  return (
    <div class="p-4">
      <Show when={session.redeemHistory.length} fallback={<ActivityEmpty icon={IconGift} title={t("priv.no_history")} description={t("priv.no_history_desc")} action={{ label: t("priv.go_redeem"), href: to("rewards") }} />}>
        <ul class="flex flex-col gap-4">
          <For each={session.redeemHistory}>
            {(h) => {
              const st = () => REDEEM_STATUS[privilegeService.redeemStatus(h, now())];
              const p = () => coverOf(h);
              return (
                <li>
                  <ImageRowCard
                    onClick={() => h.privilege_id && navigate(to(`rewards/${h.privilege_id}?redeem=${h.id}`))}
                    disabled={!h.privilege_id}
                    image={p() ? { colors: p()!.cover, src: p()!.image } : undefined}
                    badge={<Badge tone={st().tone}>{t(st().key)}</Badge>}
                    title={h.name}
                  >
                    <p>
                      {formatDate(h.date, true)} · -{formatNumber(h.points)} {t("common.points")}
                    </p>
                  </ImageRowCard>
                </li>
              );
            }}
          </For>
        </ul>
      </Show>
    </div>
  );
}
