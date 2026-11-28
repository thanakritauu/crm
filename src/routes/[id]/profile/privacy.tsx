import { useNavigate } from "@solidjs/router";
import { BottomActionBar, BottomActionBarSpacer } from "~/components/layout/bottom-action-bar";
import { createSignal } from "solid-js";
import { PolicyHtml } from "~/components/account/policy-html";
import { PageHeader } from "~/components/layout/page-header";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { useI18n } from "~/lib/i18n";
import { usePartnerPath } from "~/lib/theme";
import { customerService } from "~/services/customer-service";

/**
 * /:partner/policy — นโยบายคุ้มครองข้อมูลส่วนบุคคล
 * ต้นฉบับ: index-1c9dbae2 — container pt-[24px], หัวข้อ 16/700 กลาง, เนื้อหา text-xs (HTML ฝังในหน้า),
 *   ช่องติ๊ก "ฉันได้อ่านและรับทราบนโยบายความเป็นส่วนตัว" + "ฉันต้องการรับข่าวสารจากทางร้าน" (กล่อง w-6 h-6 เขียวเมื่อติ๊ก)
 *   ปุ่ม "ยอมรับ" (กดได้เมื่อติ๊กครบทั้งสอง) → /home
 * Prototype: เนื้อหาใช้ consentHtml (mocks/policy.ts) ขนาด 14px อ่านง่ายขึ้น, PageHeader ย้อนกลับ, ช่องติ๊กใช้ ui/checkbox,
 *   บังคับติ๊กเฉพาะช่องแรก (ช่องรับข่าวสารเป็นทางเลือก) · ไม่บันทึกค่า
 */
export default function Policy() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const navigate = useNavigate();
  const [read, setRead] = createSignal(false);
  const [news, setNews] = createSignal(false);

  return (
    <div class="min-h-screen bg-white">
      <PageHeader title={t("common.privacy_policy")} backTo="profile" />
      <div class="flex flex-col gap-4 px-4 pb-8">
        <PolicyHtml html={customerService.consentHtml()} />
        <div class="flex flex-col gap-2">
          <Checkbox checked={read()} onChange={setRead}>
            {t("account.policy_acknowledge")}
          </Checkbox>
          <Checkbox checked={news()} onChange={setNews}>
            {t("account.policy_receive_news")}
          </Checkbox>
        </div>
      </div>
      {/* ปุ่มลอยล่างแบบเดียวทั้งเว็บ (BottomActionBar · 2026-11-28) */}
      <BottomActionBarSpacer />
      <BottomActionBar>
        <Button size="block" disabled={!read()} onClick={() => navigate(to("home"))}>
          {t("common.accept")}
        </Button>
      </BottomActionBar>
    </div>
  );
}
