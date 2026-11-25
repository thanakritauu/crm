import { createEffect, createSignal, Match, onCleanup, Switch, type JSX } from "solid-js";
import { Button } from "~/components/ui/button";
import { Dialog, DialogTitle } from "~/components/ui/dialog";
import { PillTabs } from "~/components/ui/pill-tabs";
import { useI18n } from "~/lib/i18n";
import { FakeBarcode, FakeQr } from "./fake-qr";
import { IconCopy } from "~/components/ui/icons";

type CodeView = "qr" | "barcode" | "code";

/**
 * CodeDialog — modal แสดงรหัสใช้สิทธิ์ ตัวเดียวของแอป (คูปองของฉัน, รับสิทธิพิเศษที่ร้าน)
 * Figma Modal_QRCode 583:4377 / Modal_Barcode 583:4484 / Modal_Code 583:4431 · ต้นฉบับ RedeemCodeDialog
 *
 * - กรอบ ui/Dialog (343 มุม 24 p-6 gap-6) · หัวข้อ 18/Semi + คำอธิบาย 14/Reg เทา + เวลา 14/Medium ชมพู
 * - PillTabs คิวอาร์โค้ด / บาร์โค้ด / โค้ด · ปุ่มกลับ Button block
 * - นับถอยหลังถึง `expiresAt` (เวลาจริง — ปิดแล้วเปิดใหม่เวลาเดินต่อ) · หมดเวลา = "รหัสหมดอายุแล้ว" และเรียก onExpire ครั้งเดียว
 * - QR / บาร์โค้ดเป็นภาพจำลองที่สร้างจากรหัส (สแกนไม่ได้)
 * - กดนอกกรอบ / Esc = ปิดเฉยๆ · ปุ่มกลับ = ปิด + onBack
 */
export function CodeDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: JSX.Element;
  /** ค่าเริ่มต้น: "แสดงหน้าจอนี้กับพนักงาน…" */
  description?: JSX.Element;
  code: string;
  /** เวลาที่รหัสหมดอายุ */
  expiresAt: Date | string | number;
  backText: string;
  onBack?: () => void;
  onExpire?: () => void;
}) {
  const { t } = useI18n();
  const [view, setView] = createSignal<CodeView>("qr");
  const [left, setLeft] = createSignal(0);
  const [copied, setCopied] = createSignal(false);

  const remaining = () => Math.max(0, Math.round((new Date(props.expiresAt).getTime() - Date.now()) / 1000));

  createEffect(() => {
    if (!props.open) return;
    setView("qr");
    setLeft(remaining());
    let fired = false;
    const tick = () => {
      setLeft(remaining());
      if (left() === 0 && !fired) {
        fired = true;
        props.onExpire?.();
      }
    };
    const timer = setInterval(tick, 1000);
    onCleanup(() => clearInterval(timer));
  });
  const expired = () => left() <= 0;
  const mmss = () => `${String(Math.floor(left() / 60)).padStart(2, "0")}:${String(left() % 60).padStart(2, "0")} ${t("common.minutes")}`;

  const copy = () => {
    // ไม่รอ promise: บางเบราว์เซอร์ (LINE in-app / ไม่มีสิทธิ์ clipboard) ค้างไม่ตอบ — แสดงข้อความสำเร็จทันทีเพื่อการสาธิต
    navigator.clipboard?.writeText(props.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const tabs: { value: CodeView; label: string }[] = [
    { value: "qr", get label() { return t("core.qr_code"); } },
    { value: "barcode", get label() { return t("core.barcode"); } },
    { value: "code", get label() { return t("core.code"); } },
  ];

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} hideClose class="min-h-[450px] items-center justify-between">
      <div class="flex w-full flex-col items-center gap-2 text-center">
        <DialogTitle class="text-18 font-semibold text-dark">{props.title}</DialogTitle>
        <p class="text-14 text-gray">{props.description ?? t("core.show_screen_to_staff")}</p>
        <p class="text-14 font-medium text-primary">{expired() ? t("core.code_expired") : mmss()}</p>
      </div>

      <PillTabs value={view()} onChange={setView} items={tabs} />

      <div class="flex w-full flex-col items-center">
        <Switch>
          <Match when={view() === "qr"}>
            <div class="flex flex-col items-center gap-2">
              <FakeQr value={props.code} class="w-[157px]" />
              <p class="text-12 text-gray">{props.code}</p>
            </div>
          </Match>
          <Match when={view() === "barcode"}>
            <FakeBarcode value={props.code} class="flex w-full flex-col items-center gap-2" />
          </Match>
          <Match when={view() === "code"}>
            <div class="flex flex-col items-center gap-4">
              <p class="text-24 font-semibold text-primary">{props.code}</p>
              <button type="button" class="hit-area" onClick={copy} aria-label={t("profile.exchange_copy_code")} title={t("profile.exchange_copy_code")}>
                <IconCopy size={24} class="text-gray" />
              </button>
              <p class="h-[18px] text-12 text-gray">{copied() ? t("mission.coupon_copied") : ""}</p>
            </div>
          </Match>
        </Switch>
      </div>

      <Button
        size="block"
        onClick={() => {
          props.onOpenChange(false);
          props.onBack?.();
        }}
      >
        {props.backText}
      </Button>
    </Dialog>
  );
}
