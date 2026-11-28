import { useNavigate } from "@solidjs/router";
import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { PillTabs } from "~/components/ui/pill-tabs";
import { PageHeader } from "~/components/layout/page-header";
import { EmptyData } from "~/components/ui/empty-data";
import { useI18n } from "~/lib/i18n";
import { session, sessionActions } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { formatDate } from "~/lib/utils";
import type { AppNotification } from "~/mocks/notifications";
import { notificationService } from "~/services/notification-service";
import { IconBell, IconGift, IconMegaphone, IconStar, IconCoins } from "~/components/ui/icons";
import { ActivityEmpty, ActivityRow } from "~/components/history/activity-row";

/**
 * /:partner/notification — การแจ้งเตือน (Figma "Noti" 400:7351)
 * - แท็บแคปซูล ทั้งหมด / ภารกิจ / การแลกสินค้า (ข้อความทั่วไป เช่น ต้อนรับ เชื่อมต่อแพลตฟอร์ม ระดับสมาชิก อยู่ใน "ทั้งหมด" เท่านั้น)
 * - แถว: วงกลม 24px bg-primary-surface + ไอคอน 12px (gift / star / bell / megaphone) · ข้อความ 14/600 สูงสุด 2 บรรทัด · วันที่ 12 สีเทา เยื้อง 32px
 * - ยังไม่อ่าน: จุดแดงบนไอคอน · เปิดหน้านี้ = อ่านทั้งหมด แต่จุดยังแสดงกับรายการใหม่จนกว่าจะออกจากหน้า (แจ้งเตือนที่เข้ามาระหว่างเปิดหน้าก็เช่นกัน)
 * - แตะ → หน้าของรายการนั้น (เช่น รายละเอียดการแลก ?redeem=<id>, คูปองใบนั้น)
 * ข้อมูล: session.notifications (สร้างจากการแลก + สถานะจัดส่ง ดู notification-service)
 */
type Filter = "all" | "earn" | "mission" | "redeem";

/** ไอคอนในวงกลม 24px (Figma: gift / star / bell / megaphone) → Solar Linear */
const NOTI_ICON = { gift: IconGift, star: IconStar, bell: IconBell, megaphone: IconMegaphone, coins: IconCoins } as const;

export default function NotificationPage() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const navigate = useNavigate();
  const [filter, setFilter] = createSignal<Filter>("all");
  const [unread, setUnread] = createSignal<Set<string>>(new Set());
  const [ready, setReady] = createSignal(false);

  // รอ restoreSession (onMount ของ Shell ทำงานหลังหน้าลูก) แล้วค่อยเริ่มจำ/อ่าน
  onMount(() => setTimeout(() => setReady(true), 0));
  createEffect(() => {
    if (!ready()) return;
    const fresh = session.notifications.filter((n) => !n.read).map((n) => n.id);
    if (!fresh.length) return;
    setUnread((prev) => new Set([...prev, ...fresh]));
    sessionActions.markNotificationsRead();
  });

  const list = () => notificationService.list(filter());

  const open = (n: AppNotification) => {
    if (n.link) navigate(to(n.link));
  };

  return (
    <div class="img-background min-h-screen bg-white bg-cover bg-center">
      <PageHeader tone="primary" backTo="home" title={t("notification.title")}>
        <PillTabs
          value={filter()}
          onChange={setFilter}
          items={[
            { value: "all", label: t("common.all") },
            // สะสมคะแนน = คะแนนที่เข้าตอนผู้ใช้ไม่ได้อยู่ในแอป (แพลตฟอร์ม / ใบเสร็จผ่านการตรวจ) · ได้ทันทีในแอป (กรอกรหัส/สแกน) ไม่แจ้ง (2026-11-27)
            { value: "earn", label: t("notification.earn_title") },
            { value: "mission", label: t("mission.mission") },
            // "การแลก" = ทุกการใช้คะแนนแลก: แลกสินค้า/สิทธิพิเศษ + แลกคูปอง + แลกคะแนนเป็นคูปอง (type "redeem" ทั้งหมด · 2026-11-27)
            { value: "redeem", label: t("notification.redeem_title") },
          ]}
        />
      </PageHeader>

      <Show when={list().length > 0} fallback={<ActivityEmpty icon={IconBell} title={t("notification.no_notifications")} description={t("notification.no_notifications_desc")} />}>
        <For each={list()}>
          {(n) => (
            <ActivityRow
              icon={NOTI_ICON[n.icon]}
              clamp
              unread={unread().has(n.id)}
              title={t(`noti.${n.key}`, { name: session.customer.name || session.customer.line_display_name, ...n.params })}
              date={`${formatDate(n.date, true)}${t("common.time_suffix")}`}
              onClick={n.link ? () => open(n) : undefined}
            />
          )}
        </For>
      </Show>

      <div class="h-8" aria-hidden="true" />
    </div>
  );
}
