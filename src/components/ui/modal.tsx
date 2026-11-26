import { AlertDialog as AlertDialogPrimitive } from "@kobalte/core/alert-dialog";
import { Show, type JSX, type ParentComponent } from "solid-js";
import { translate } from "~/lib/i18n";
import { cn } from "~/lib/utils";
import { Button } from "./button";
import { modalPanel, overlayBackdrop, overlayCenter } from "./overlay";
import { IconCheckCircle, IconCloseCircle, IconInfo } from "~/components/ui/icons";

/**
 * Modal กลางจอตาม Figma ("Modal_Confirm" / "Modal_NonSuccess" / coupon "Confirm")
 * กล่องขาวกว้าง 343 · มุม 24 · padding 24 · ช่องห่างระหว่างส่วน 24
 * ไอคอนวงกลม 48 · หัวข้อ 18/Semi · คำอธิบาย 14/Reg สีเทา · ปุ่มสูง 48 ทรงแคปซูล
 *
 * ใช้ได้ 3 แบบ: ResultModal (สำเร็จ/ไม่สำเร็จ ปุ่มเดียว), ConfirmModal (ยกเลิก + ยืนยัน), AlertDialog (ไอคอน JSX อิสระ)
 */
type Tone = "primary" | "success" | "error" | "warning";
const TONE_BG: Record<Tone, string> = { primary: "bg-primary-surface", success: "bg-success-surface", error: "bg-error-surface", warning: "bg-warning-surface" };

const ModalShell: ParentComponent<{ open: boolean; onOpenChange: (o: boolean) => void }> = (props) => (
  <AlertDialogPrimitive open={props.open} onOpenChange={props.onOpenChange}>
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay class={overlayBackdrop} />
      <div class={overlayCenter}>
        <AlertDialogPrimitive.Content class={cn(modalPanel, "items-center gap-6 p-6")}>
          {props.children}
        </AlertDialogPrimitive.Content>
      </div>
    </AlertDialogPrimitive.Portal>
  </AlertDialogPrimitive>
);

function ModalBody(props: { icon?: JSX.Element; tone?: Tone; title: JSX.Element; description?: JSX.Element }) {
  return (
    <div class="flex w-full flex-col items-center gap-4">
      <Show when={props.icon}>
        <span class={cn("flex size-12 items-center justify-center rounded-full text-primary", TONE_BG[props.tone ?? "primary"])}>{props.icon}</span>
      </Show>
      <div class="flex w-full flex-col items-center text-center">
        <AlertDialogPrimitive.Title class="whitespace-pre-line text-18 font-semibold text-dark">{props.title}</AlertDialogPrimitive.Title>
        <Show when={props.description}>
          <AlertDialogPrimitive.Description class="w-full whitespace-pre-line text-14 text-gray">{props.description}</AlertDialogPrimitive.Description>
        </Show>
      </div>
    </div>
  );
}

/** ผลลัพธ์ สำเร็จ / ไม่สำเร็จ + ปุ่มเดียว */
export function ResultModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "success" | "error";
  title: JSX.Element;
  description?: JSX.Element;
  buttonText?: string;
  onButton?: () => void;
  /** ไอคอนแทนเครื่องหมายถูก/กากบาท (เช่น ของขวัญตาม Figma) */
  icon?: JSX.Element;
  /** เนื้อหาเพิ่มใต้คำอธิบาย เหนือปุ่ม (เช่น ชวนเชื่อมต่อแพลตฟอร์ม) */
  extra?: JSX.Element;
}) {
  const ok = () => props.variant !== "error";
  return (
    <ModalShell open={props.open} onOpenChange={props.onOpenChange}>
      <ModalBody
        tone={ok() ? "success" : "error"}
        icon={props.icon ?? (ok() ? <IconCheckCircle size={24} class="text-success" /> : <IconCloseCircle size={24} class="text-error" />)}
        title={props.title}
        description={props.description}
      />
      {props.extra}
      <Button
        size="block"
        onClick={() => {
          props.onOpenChange(false);
          props.onButton?.();
        }}
      >
        {props.buttonText ?? translate("common.ok")}
      </Button>
    </ModalShell>
  );
}

/** ยืนยันการทำรายการ: ปุ่มยกเลิก (secondary) + ยืนยัน (primary) */
export function ConfirmModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** ไอคอน 20px — JSX (เช่น <IconTicket/>) หรือ path รูป */
  icon: string | JSX.Element;
  title: JSX.Element;
  description?: JSX.Element;
  cancelText?: string;
  confirmText?: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <AlertDialog
      destructive={props.destructive}
      open={props.open}
      onOpenChange={props.onOpenChange}
      icon={typeof props.icon === "string" ? <img src={props.icon} alt="" width="20" height="20" /> : props.icon}
      title={props.title}
      description={props.description}
      cancelText={props.cancelText ?? translate("common.cancel")}
      confirmText={props.confirmText ?? translate("common.confirm")}
      onConfirm={props.onConfirm}
    />
  );
}

/** Modal ทั่วไป: ไอคอน JSX (ไม่บังคับ) + ปุ่ม 1–2 ปุ่ม */
export function AlertDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: JSX.Element;
  description?: JSX.Element;
  icon?: JSX.Element;
  tone?: Tone;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  /** การกระทำที่ย้อนกลับไม่ได้ (ลบ / ยกเลิกเชื่อมต่อ) → ปุ่มยืนยันสีแดง */
  destructive?: boolean;
}) {
  return (
    <ModalShell open={props.open} onOpenChange={props.onOpenChange}>
      <ModalBody icon={props.icon} tone={props.tone} title={props.title} description={props.description} />
      <div class="flex w-full gap-2">
        <Show when={props.cancelText}>
          <Button
            variant="secondary"
            size="dialog"
            onClick={() => {
              props.onCancel?.();
              props.onOpenChange(false);
            }}
          >
            {props.cancelText}
          </Button>
        </Show>
        <Button
          size="dialog"
          variant={props.destructive ? "error" : "primary"}
          onClick={() => {
            props.onOpenChange(false);
            props.onConfirm?.();
          }}
        >
          {props.confirmText ?? translate("common.ok")}
        </Button>
      </div>
    </ModalShell>
  );
}

/** กล่องแจ้งข้อมูล (Figma): พื้นม่วงอ่อน มุม 16 padding 16 + ไอคอน info 16 · ข้อความ 14/Reg */
export function InfoBox(props: { children: JSX.Element; class?: string }) {
  return (
    <div class={cn("flex items-start gap-2 rounded-2xl bg-secondary-surface p-4", props.class)}>
      <IconInfo size={16} class="mt-1 shrink-0 text-secondary" />
      <div class="min-w-0 flex-1 text-14 text-dark">{props.children}</div>
    </div>
  );
}
