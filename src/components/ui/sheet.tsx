import { Dialog as DialogPrimitive } from "@kobalte/core/dialog";
import { Show, type ParentComponent } from "solid-js";
import { translate } from "~/lib/i18n";
import { cn } from "~/lib/utils";
import { overlayBackdrop, sheetPanel } from "./overlay";
import { IconClose } from "~/components/ui/icons";

/**
 * Sheet — Bottom sheet เดียวทั้งแอป (Figma: พื้นขาว มุมบน 24, padding 24, เว้นล่าง 48 สำหรับแถบ home)
 * ถ้าส่ง title จะมีแถวหัวข้อ 16/Semi + ปุ่มปิด (X) ห่างจากเนื้อหา 16
 */
export const Sheet: ParentComponent<{ open: boolean; onOpenChange: (o: boolean) => void; title?: string; label?: string; class?: string }> = (props) => (
  <DialogPrimitive open={props.open} onOpenChange={props.onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay class={overlayBackdrop} />
      <DialogPrimitive.Content
        aria-label={props.label ?? props.title}
        class={cn(
          sheetPanel,
          "px-6 pb-12 pt-6",
          props.class,
        )}
      >
        <Show when={props.title}>
          <div class="mb-4 flex items-center justify-between gap-2">
            <DialogPrimitive.Title as="h2" class="text-16 font-semibold text-dark">
              {props.title}
            </DialogPrimitive.Title>
            <DialogPrimitive.CloseButton class="hit-area text-gray" aria-label={translate("common.close")}>
              <IconClose size={24} />
            </DialogPrimitive.CloseButton>
          </div>
        </Show>
        {props.children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive>
);
