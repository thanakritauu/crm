import { useNavigate } from "@solidjs/router";
import { createSignal, For, onMount, Show } from "solid-js";
import { PlatformLogo } from "~/components/figma/platform-logo";
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
      <div class={cn("flex flex-col gap-4", props.class)}>
        <For each={enabled()}>
          {(p) => (
            // LINE Shopping: ขอบชมพู + ริบบิ้นโปรบนสุด ให้เด่นกว่าการ์ดอื่น
            <Card class={cn("relative flex flex-col gap-4 overflow-hidden p-4", p.platform === "line" && "border border-primary")}>
              {/* LINE Shopping: ริบบิ้นโปรเต็มความกว้างบนสุดของการ์ด (แทนป้ายมุม + แถบโปรด้านล่าง) */}
              <Show when={p.platform === "line"}>
                <p class="-mx-4 -mt-4 bg-primary px-4 py-2 text-14 font-medium text-white">{t("core.line_promo")}</p>
              </Show>
              {/* โลโก้ซ้าย · ปุ่ม sm (32px ตาม Design System) ชิดขวาบรรทัดเดียวกัน */}
              <div class="flex items-center justify-between gap-2">
                <PlatformLogo platform={p} />
                <Show
                  when={p.status}
                  fallback={
                    <Button variant="primary" size="sm" onClick={() => connect(p.platform)}>
                      {t("platform.connect")}
                    </Button>
                  }
                >
                  {/* ยกเลิกเชื่อมต่อ = ปุ่มแดงจาง (variant "error-soft": พื้น Error/Surface ตัวแดง) */}
                  <Button variant="error-soft" size="sm" onClick={() => askUnbind(p)}>
                    {t("platform.unbind")}
                  </Button>
                </Show>
              </div>
              {/* หัวข้อเต็มความกว้างการ์ด (บรรทัดเดียว) · รายละเอียด */}
              <div class="flex flex-col gap-1">
                <Show
                  when={p.status}
                  fallback={
                    <p class="line-clamp-2 break-words text-14 font-semibold text-dark">
                      {t("core.not_connected_with", { platform: p.platform === "tiktok" ? "Tiktok" : p.display_name })}
                    </p>
                  }
                >
                  <p class="line-clamp-2 text-14 font-semibold text-success">{t("platform.connected")}</p>
                </Show>
                {/* รายละเอียดสูงสุด 2 บรรทัด เกินตัด … */}
                <Show
                  when={p.status}
                  fallback={
                    <p class="line-clamp-2 break-words text-14 text-gray">
                      {t("core.connect_account_line1", { platform: p.display_name })} {t("core.connect_account_line2")}
                    </p>
                  }
                >
                  <p class="line-clamp-2 break-all text-14 text-gray">{p.platform_id || p.order_id}</p>
                </Show>
              </div>
            </Card>
          )}
        </For>
      </div>

      <ConfirmModal
        open={!!unbindTarget()}
        onOpenChange={(o) => !o && setUnbindTarget(undefined)}
        icon={<IconInfo size={24} class="text-warning" />}
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
