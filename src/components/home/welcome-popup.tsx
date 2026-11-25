import { Dialog as DialogPrimitive } from "@kobalte/core/dialog";
import { useI18n } from "~/lib/i18n";
import { overlayBackdrop, overlayCenter } from "~/components/ui/overlay";

/**
 * Popup ต้อนรับสมาชิกใหม่ (Figma "Popup welcome" 1346:5123)
 * แสดงหลังสมัคร/รวมบัญชีสำเร็จ: รูปแบนเนอร์ Charmiss CLUB (สัดส่วน 897:738) + ลิงก์ "ปิดหน้าต่างนี้" สีขาวขีดเส้นใต้ ห่าง 8
 */
export function WelcomePopup(props: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <DialogPrimitive open={props.open} onOpenChange={(o) => !o && props.onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay class={overlayBackdrop} />
        <div class={overlayCenter}>
          <DialogPrimitive.Content class="flex w-full max-w-[395px] flex-col items-center gap-2 data-[expanded]:animate-content-show">
            <DialogPrimitive.Title class="sr-only">{t("core.welcome_title")}</DialogPrimitive.Title>
            <button type="button" class="aspect-[897/738] w-full" onClick={props.onClose} aria-label={t("auth.close_popup")}>
              <img src="/images/figma/welcome-popup.png" alt="" class="size-full object-cover" />
            </button>
            <DialogPrimitive.CloseButton class="text-14 text-white underline">{t("auth.close_popup")}</DialogPrimitive.CloseButton>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive>
  );
}
