import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { CountBadge } from "~/components/ui/count-badge";
import { IconBell } from "~/components/ui/icons";
import { useI18n } from "~/lib/i18n";
import { usePartnerPath } from "~/lib/theme";
import { notificationService } from "~/services/notification-service";

/** ป้ายตัวเลขแจ้งเตือนที่ยังไม่อ่าน — วงกลมแดงกว้าง=สูง 20px เสมอ (1 หลัก หรือ "9+") · ขอบขาว */
export function UnreadBadge(props: { class?: string }) {
  return (
    <Show when={notificationService.unreadCount() > 0}>
      <CountBadge count={notificationService.unreadCount()} class={props.class} />
    </Show>
  );
}

/**
 * กระดิ่งแจ้งเตือนมุมขวาบนหน้าแรก (แทนช่องแจ้งเตือนในแถบล่างเดิม — ช่องนั้นเป็น "ภารกิจ" แล้ว)
 * วงกลมขาว 40px + ป้ายตัวเลขที่ยังไม่อ่าน → /notifications
 */
export function NotificationBell() {
  const { t } = useI18n();
  const to = usePartnerPath();
  return (
    <A
      href={to("notifications")}
      class="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-dark shadow-card"
      aria-label={t("notification.title")}
    >
      <IconBell size={24} />
      <UnreadBadge class="absolute -right-1 -top-1" />
    </A>
  );
}
