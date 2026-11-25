import { Dialog as DialogPrimitive } from "@kobalte/core/dialog";
import { createSignal } from "solid-js";
import { Checkbox } from "~/components/ui/checkbox";
import { useI18n } from "~/lib/i18n";
import { overlayBackdrop, overlayCenter } from "~/components/ui/overlay";

/**
 * Popup ต้อนรับ (Figma "Popup welcome" 1346:5123) — หน้าแรก
 * - แสดงเองเมื่อเปิดหน้าแรก (ครั้งเดียวต่อการเปิดแอป) จนกว่าจะติ๊ก "ไม่ต้องแสดงอีก" · สมาชิกใหม่ (หลังสมัคร/รวมบัญชี) เห็นเสมอ
 * - ปิดได้ 3 ทาง: X สีชมพูในรูป (มุมขวาบน) · "ปิดหน้าต่างนี้" · แตะพื้นหลัง (ติ๊กไว้ → ไม่แสดงอีก)
 * - รูปแบนเนอร์ Charmiss CLUB (สัดส่วน 897:738) · ใต้รูป: ☐ ไม่ต้องแสดงอีก (ซ้าย) · ปิดหน้าต่างนี้ (ขวา) สีขาว
 * - เมนู prototype › "แสดง popup ต้อนรับอีกครั้ง" ล้างค่าที่จำไว้ (resetWelcome)
 */
const HIDE_KEY = "charmiss-welcome-hidden"; // localStorage — ติ๊กไม่ต้องแสดงอีก
const SEEN_KEY = "charmiss-welcome-seen"; // sessionStorage — เห็นแล้วในการเปิดแอปครั้งนี้

const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};
export const shouldShowWelcome = () => safe(() => !localStorage.getItem(HIDE_KEY) && !sessionStorage.getItem(SEEN_KEY), false);
export const resetWelcome = () =>
  safe(() => {
    localStorage.removeItem(HIDE_KEY);
    sessionStorage.removeItem(SEEN_KEY);
  }, undefined);

export function WelcomePopup(props: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const [dontShow, setDontShow] = createSignal(false);
  const close = () => {
    safe(() => {
      sessionStorage.setItem(SEEN_KEY, "1");
      if (dontShow()) localStorage.setItem(HIDE_KEY, "1");
    }, undefined);
    props.onClose();
  };
  return (
    <DialogPrimitive open={props.open} onOpenChange={(o) => !o && close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay class={overlayBackdrop} />
        <div class={overlayCenter}>
          <DialogPrimitive.Content class="flex w-full max-w-[395px] flex-col gap-4 data-[expanded]:animate-content-show">
            <DialogPrimitive.Title class="sr-only">{t("core.welcome_title")}</DialogPrimitive.Title>
            <div class="relative">
              <img src="/images/figma/welcome-popup.png" alt="" class="aspect-[897/738] w-full object-cover" />
              {/* ปุ่ม X = เครื่องหมาย X สีชมพูที่อยู่ในรูปแล้ว (มุมขวาบน) — วางพื้นที่กด 40px ทับตรงนั้น ไม่วาด X ซ้ำ */}
              <DialogPrimitive.CloseButton
                class="absolute size-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ left: "87.5%", top: "8%" }}
                aria-label={t("auth.close_popup")}
              />
            </div>
            <div class="flex items-center justify-between gap-4 px-2">
              <Checkbox checked={dontShow()} onChange={setDontShow} class="items-center" labelClass="text-white">
                {t("core.welcome_dont_show")}
              </Checkbox>
              <DialogPrimitive.CloseButton class="shrink-0 text-14 text-white underline">{t("auth.close_popup")}</DialogPrimitive.CloseButton>
            </div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive>
  );
}
