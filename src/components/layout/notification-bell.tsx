import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { IconBell } from "~/components/ui/icons";
import { useI18n } from "~/lib/i18n";
import { usePartnerPath } from "~/lib/theme";
import { cn } from "~/lib/utils";
import { notificationService } from "~/services/notification-service";

/** ป้ายตัวเลขแจ้งเตือนที่ยังไม่อ่าน (แดง · 9+ เมื่อเกิน 9) */
export function UnreadBadge(props: { class?: string }) {
  return (
    <Show when={notificationService.unreadCount() > 0}>
      <span class={cn("flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-error px-1 text-12 font-medium text-white", props.class)}>
        {notificationService.unreadCount() > 9 ? "9+" : notificationService.unreadCount()}
      </span>
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
