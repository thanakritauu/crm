import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { IconChevronRight, IconSmartphone } from "~/components/ui/icons";
import { useI18n } from "~/lib/i18n";
import { usePartnerPath } from "~/lib/theme";
import { platformService } from "~/services/platform-service";

/**
 * ชวนเชื่อมต่อแพลตฟอร์ม ในป๊อปอัปหลังสะสมด้วยใบเสร็จ/รหัสสินค้า (2026-11-26)
 * "ไม่อยากกรอกเองทุกครั้ง? เชื่อมต่อแพลตฟอร์มเพื่อรับคะแนนอัตโนมัติ >" → หน้าเชื่อมต่อแพลตฟอร์ม
 * แสดงเฉพาะเมื่อยังเชื่อมไม่ครบทุกแพลตฟอร์ม
 */
export function ConnectPlatformHint() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const all = () => platformService.list().filter((p) => p.is_enabled);
  const notAll = () => all().some((p) => !p.status);
  return (
    <Show when={notAll()}>
      <A href={to("profile/platforms")} class="flex items-center gap-2 rounded-2xl bg-primary-surface p-4 text-left">
        <IconSmartphone size={20} class="shrink-0 text-primary" />
        <span class="min-w-0 flex-1 text-14 text-dark">
          <span class="font-semibold">{t("club.connect_hint_q")}</span> {t("club.connect_hint_desc")}
        </span>
        <IconChevronRight size={16} class="shrink-0 text-primary" />
      </A>
    </Show>
  );
}
