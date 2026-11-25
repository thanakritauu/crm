import QRCode from "qrcode";
import { createEffect, createSignal, Match, Show, Switch } from "solid-js";
import { FakeBarcode } from "~/components/coupon/fake-qr";
import { Dialog, DialogTitle } from "~/components/ui/dialog";
import { PillTabs } from "~/components/ui/pill-tabs";
import { useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { formatNumber } from "~/lib/utils";
import { tierStatus } from "~/services/tier-service";

/**
 * QR สมาชิก (แบบ Okya "My QR" + Choco: QR / บาร์โค้ด / รหัส) — ปุ่ม QR มุมขวาบนของหน้าแรก
 * แสดงให้พนักงานสแกนเพื่อ **สะสมคะแนน** ที่หน้าร้าน (คอยน์ได้จากภารกิจเท่านั้น จึงไม่แสดงคอยน์ที่นี่)
 * QR สร้างจริงจากรหัสสมาชิก (ไลบรารี qrcode) · บาร์โค้ดเป็นภาพจำลอง
 */
type Mode = "qr" | "barcode" | "code";

export function MemberQrModal(props: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useI18n();
  const [mode, setMode] = createSignal<Mode>("qr");
  const [qr, setQr] = createSignal<string>();
  const code = () => session.customer.member_code;
  createEffect(() => {
    if (props.open && !qr()) QRCode.toDataURL(code(), { width: 480, margin: 1 }).then(setQr);
  });

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <div class="flex flex-col items-center gap-1 text-center">
        <DialogTitle class="px-6 text-18 font-semibold text-dark">{session.customer.name || session.customer.line_display_name}</DialogTitle>
        <p class="text-14 text-gray">
          {t(`tier.name_${tierStatus().current.id}`)} · {t("core.points_amount", { points: formatNumber(session.customer.points) })}
        </p>
      </div>

      <PillTabs
        value={mode()}
        onChange={setMode}
        items={[
          { value: "qr", label: t("club.qr_tab_qr") },
          { value: "barcode", label: t("club.qr_tab_barcode") },
          { value: "code", label: t("club.qr_tab_code") },
        ]}
      />

      <div class="flex min-h-[200px] items-center justify-center">
        <Switch>
          <Match when={mode() === "qr"}>
            <Show when={qr()} fallback={<div class="size-[200px] animate-pulse rounded-lg bg-surface-gray" />}>
              {(src) => <img src={src()} alt={t("club.qr_alt")} width="200" height="200" class="size-[200px]" />}
            </Show>
          </Match>
          <Match when={mode() === "barcode"}>
            <FakeBarcode value={code()} class="w-full" />
          </Match>
          <Match when={mode() === "code"}>
            <p class="break-all text-center text-24 font-semibold tracking-wider text-dark">{code()}</p>
          </Match>
        </Switch>
      </div>

      <p class="text-center text-14 text-gray">{t("club.qr_hint")}</p>
    </Dialog>
  );
}
