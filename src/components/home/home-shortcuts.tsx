import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { cardClass } from "~/components/ui/card";
import { CountBadge } from "~/components/ui/count-badge";
import { IconCoins, IconHistory, IconSmartphone, IconTicket } from "~/components/ui/icons";
import { useI18n } from "~/lib/i18n";
import { usePartnerPath } from "~/lib/theme";
import { cn } from "~/lib/utils";
import { platformService } from "~/services/platform-service";

/**
 * ทางลัดหน้าแรก (2026-11-26) — ทำให้ "คูปองของฉัน" และ "เชื่อมต่อแพลตฟอร์มออนไลน์" เด่นขึ้น
 * 1. HomeQuickActions: แถว 4 ทางลัดใต้การ์ดคะแนน (แบบ Okya) — คูปองของฉัน · เชื่อมต่อแพลตฟอร์ม (ป้าย "0/4" แดง+เด้ง → "1/4" เขียว … ป้ายเดียวในแถว) · แลกคะแนนเป็นคูปอง · ประวัติคะแนน
 */
const platforms = () => platformService.list().filter((p) => p.is_enabled);
const connectedCount = () => platforms().filter((p) => p.status).length;

export function HomeQuickActions() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const items = () => [
    { key: "coupons", label: t("club.qa_coupons"), icon: IconTicket, href: "wallet/coupons" },
    {
      key: "connect",
      label: t("club.qa_connect"),
      icon: IconSmartphone,
      href: "profile/platforms",
      // ป้ายมุมขวาบน "เชื่อมแล้ว/ทั้งหมด" — ยังไม่ครบ (0/4–3/4) = แดง + เด้งเบาๆ ชวนกด · ครบ 4/4 = เขียว ไม่เด้ง (2026-11-28)
      connected: `${connectedCount()}/${platforms().length}`,
    },
    { key: "exchange", label: t("club.qa_exchange"), icon: IconCoins, href: "rewards/points-to-coupon" },
    { key: "history", label: t("club.qa_history"), icon: IconHistory, href: "wallet/points-history" },
  ];
  return (
    <nav class={cn(cardClass, "grid grid-cols-4 gap-2 p-4")} aria-label={t("club.qa_title")}>
      <For each={items()}>
        {(it) => (
          <A href={to(it.href)} class="flex min-w-0 flex-col items-center gap-2 text-center">
            {/* วงไอคอนสีม่วง: พื้นม่วงอ่อน + ไอคอนม่วงเข้ม (DSL พื้นอ่อน + ไอคอนสีเดียวกันเข้ม · 2026-11-27) */}
            <span class="relative flex size-12 items-center justify-center rounded-full bg-secondary-surface text-secondary">
              <Dynamic component={it.icon} size={24} />
              {/* ตัวเลขคูปองที่ใช้ได้ (วงกลมแดง 20px แบบป้ายแจ้งเตือน) */}
              <Show when={it.connected}>
                {(txt) => (
                  <CountBadge
                    text={txt()}
                    tone={connectedCount() === platforms().length ? "success" : "error"}
                    class={cn("absolute -right-2 -top-1", connectedCount() < platforms().length && "motion-safe:animate-badge-nudge")}
                  />
                )}
              </Show>
            </span>
            {/* ตัดบรรทัดตามที่กำหนดใน i18n (\n) เช่น "คูปอง / ของฉัน" — 2026-11-26 */}
            <span class="whitespace-pre-line text-12 font-medium text-dark">{it.label}</span>
          </A>
        )}
      </For>
    </nav>
  );
}
