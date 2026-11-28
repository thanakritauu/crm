import { useNavigate } from "@solidjs/router";
import { createSignal, For, onMount, Show } from "solid-js";
import { PlatformTile } from "~/components/platform/platform-icon";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { IconInfo } from "~/components/ui/icons";
import { ConfirmModal } from "~/components/ui/modal";
import { PageLoading } from "~/components/ui/page-loading";
import { useI18n } from "~/lib/i18n";
import { requireMember } from "~/lib/member-gate";
import { usePartnerPath } from "~/lib/theme";
import { cn, delay } from "~/lib/utils";
import { restorePlatformState, type PlatformKey } from "~/mocks/platforms";
import { platformService, type PlatformItem } from "~/services/platform-service";

/**
 * รายการการ์ดเชื่อมต่อแพลตฟอร์มออนไลน์ — ใช้ร่วมกัน: หน้าเชื่อมต่อแพลตฟอร์ม (/profile/platforms) และหน้าสะสมคะแนน (/earn)
 * เรียงตาม priority (LINE Shopping บนสุด) · "เชื่อมต่อ" → /profile/platforms/:platform
 * หน้าตา (2026-11-27): การ์ดเดียว แถวละแพลตฟอร์ม ไอคอนสี่เหลี่ยมชุดเดียวกับการ์ดชวนเชื่อมหน้าสะสมคะแนน (PlatformTile)
 * ยกเลิกเชื่อมต่อ (flow ตาม production): ปุ่มแดงจาง → modal ยืนยัน "คุณต้องยกเลิกเชื่อมต่อบัญชีแพลตฟอร์มออนไลน์หรือไม่?"
 *   ("ไม่ต้องการ" | "ยกเลิกเชื่อมต่อ") → ยกเลิก → การ์ดกลับเป็นยังไม่เชื่อมต่อ (ไม่มี modal สำเร็จ) · เชื่อมต่อใหม่ได้ด้วยหมายเลขคำสั่งซื้อใหม่
 */
export function PlatformConnectList(props: { class?: string }) {
  const { t } = useI18n();
  const to = usePartnerPath();
  const navigate = useNavigate();
  const [loading, setLoading] = createSignal(false);
  const [unbindTarget, setUnbindTarget] = createSignal<PlatformItem>();
  onMount(restorePlatformState);

  // list() อ่าน platformState.bindings จึง reactive เมื่อผูก/ยกเลิก
  const enabled = () => platformService.list().filter((p) => p.is_enabled);
  const connect = (p: PlatformKey) => requireMember(() => navigate(to(`profile/platforms/${p}`)));

  // ConfirmModal เรียก onOpenChange(false) ก่อน onConfirm → เก็บแพลตฟอร์มที่เลือกไว้แยก ไม่ให้หายก่อนยกเลิกเชื่อมต่อจริง
  let pendingUnbind: PlatformItem | undefined;
  const askUnbind = (p: PlatformItem) => {
    pendingUnbind = p;
    setUnbindTarget(p);
  };
  const confirmUnbind = async () => {
    const target = pendingUnbind;
    pendingUnbind = undefined;
    if (!target) return;
    setUnbindTarget(undefined);
    setLoading(true);
    await delay(500);
    platformService.unbind(target.platform);
    setLoading(false);
  };

  return (
    <>
      <PageLoading show={loading()} />
      {/* รายการเดียวในการ์ดเดียว (2026-11-27) — ทุกแถวโครงเดียวกัน: ไอคอน 40 (ถูกเขียว = เชื่อมแล้ว) · ชื่อ + สถานะ · ปุ่มขวาตำแหน่งเดิมเสมอ
          สี: ชมพู = ปุ่ม/ป้าย x10 เท่านั้น · เขียว = ถูกบนไอคอน · เทา = สถานะ + "ยกเลิกเชื่อมต่อ" · สีแบรนด์อยู่ในไอคอนเท่านั้น */}
      <div class={props.class}>
        <Card class="flex flex-col divide-y divide-stroke px-4">
          <For each={enabled()}>
            {(p) => (
              <div class="flex items-center gap-4 py-4">
                <PlatformTile platform={p} connected={!!p.status} size={40} />
                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <p class="flex items-center gap-2 text-14 font-semibold text-dark">
                    <span class="truncate">{p.display_name}</span>
                    <Show when={p.platform === "line"}>
                      {/* ป้ายโปรในบรรทัด = พื้นแดงอ่อน ตัวแดงเข้ม (DSL ป้ายเด่น · 2026-11-28) */}
                      <span class="shrink-0 rounded-full bg-error-surface px-2 text-12 font-medium text-error">{t("core.line_promo_badge")}</span>
                    </Show>
                  </p>
                  <p class="truncate text-12 text-gray">
                    {/* เชื่อมแล้ว = ชื่อบัญชี/เบอร์อย่างเดียว (ถูกเขียวบนไอคอนบอกสถานะ · 2026-11-27) · ไม่มีข้อมูล = "เชื่อมต่อแล้ว" */}
                    {p.status ? p.platform_id || p.order_id || t("platform.connected") : t("platform.status_not_connected")}
                  </p>
                </div>
                <Show
                  when={p.status}
                  fallback={
                    <Button variant="primary" size="sm" onClick={() => connect(p.platform)}>
                      {t("platform.connect")}
                    </Button>
                  }
                >
                  {/* ป้ายสั้น "ยกเลิก" ให้ชื่อแพลตฟอร์มไม่โดนตัด · ชื่อเต็มอยู่ใน aria-label · popup ยืนยันบอกชัดว่ายกเลิกเชื่อมต่อ */}
                  <button type="button" aria-label={t("platform.unbind")} class="shrink-0 text-12 text-gray underline underline-offset-2" onClick={() => askUnbind(p)}>
                    {t("platform.unbind_short")}
                  </button>
                </Show>
              </div>
            )}
          </For>
        </Card>
      </div>

      <ConfirmModal
        open={!!unbindTarget()}
        onOpenChange={(o) => !o && setUnbindTarget(undefined)}
        tone="warning"
        icon={<IconInfo size={24} />}
        destructive
        // ข้อความตาม production: เชื่อมต่อใหม่ได้ด้วยข้อมูลคำสั่งซื้อใหม่ (เดิมตาม Figma บอกว่าเชื่อมต่อไม่ได้อีก — ไม่ตรงกับระบบจริง)
        title={t("platform.do_you_want_to_unbind_platform_account")}
        description={<span innerHTML={t("platform.are_you_sure_to_disconnect_this_account")} />}
        cancelText={t("platform.do_not_want")}
        confirmText={t("platform.unbind")}
        onConfirm={confirmUnbind}
      />
    </>
  );
}
