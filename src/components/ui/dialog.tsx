import { Dialog as DialogPrimitive } from "@kobalte/core/dialog";
import { Show, type JSX, type ParentComponent } from "solid-js";
import { translate } from "~/lib/i18n";
import { cn } from "~/lib/utils";
import { modalPanel, overlayBackdrop, overlayCenter } from "./overlay";
import { IconClose } from "~/components/ui/icons";

/**
 * Dialog (Kobalte) — modal กลางจอเนื้อหาอิสระ กรอบเดียวกับ ui/modal:
 * กว้าง 343 · มุม 24 · padding 24 · ช่องห่าง 24 · หัวข้อ 18/Semi · คำอธิบาย 14/Reg สีเทา
 * ใช้: <Dialog open={open()} onOpenChange={setOpen} title="...">...</Dialog>
 */
export const Dialog: ParentComponent<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: JSX.Element;
  description?: JSX.Element;
  class?: string;
  /** ซ่อนปุ่ม X มุมขวาบน */
  hideClose?: boolean;
}> = (props) => (
  <DialogPrimitive open={props.open} onOpenChange={props.onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay class={overlayBackdrop} />
      <div class={overlayCenter}>
        <DialogPrimitive.Content
          class={cn(
            modalPanel,
            "relative gap-6 p-6",
            props.class,
          )}
        >
          <Show when={props.title || props.description}>
            <div class="flex flex-col text-center">
              <Show when={props.title}>
                <DialogPrimitive.Title class="whitespace-pre-line px-6 text-18 font-semibold text-dark">{props.title}</DialogPrimitive.Title>
              </Show>
              <Show when={props.description}>
                <DialogPrimitive.Description class="whitespace-pre-line text-14 text-gray">{props.description}</DialogPrimitive.Description>
              </Show>
            </div>
          </Show>
          {props.children}
          <Show when={!props.hideClose}>
            <DialogPrimitive.CloseButton class="hit-area absolute right-4 top-4 rounded-lg text-gray opacity-70 transition-opacity hover:opacity-100" aria-label={translate("common.close")}>
              <IconClose size={24} />
            </DialogPrimitive.CloseButton>
          </Show>
        </DialogPrimitive.Content>
      </div>
    </DialogPrimitive.Portal>
  </DialogPrimitive>
);

/** หัวข้อของ Dialog ที่วาง layout เอง (ใช้แทน prop `title` เมื่อหัวข้อต้องอยู่ในกลุ่มเดียวกับเนื้อหาอื่น) — ยังผูก aria-labelledby ให้ */
export const DialogTitle = DialogPrimitive.Title;
