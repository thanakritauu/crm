import { PageHeader } from "~/components/layout/page-header";
import { PlatformConnectList } from "~/components/platform/platform-connect-list";
import { InfoBox } from "~/components/ui/modal";
import { useI18n } from "~/lib/i18n";
import { platformService } from "~/services/platform-service";
import { PlatformRefreshButton } from "~/components/platform/platform-refresh-button";

/**
 * /:partner/profile/platforms — เชื่อมต่อแพลตฟอร์มออนไลน์
 * ต้นฉบับ: index-2a673c41.js (ConnectPlatformSelect) — กล่องคำแนะนำ + การ์ดแต่ละแพลตฟอร์ม
 * หน้าตาตาม Figma Connect Platform (589:6121) · รายการการ์ดใช้ร่วมกับหน้าสะสมคะแนน (PlatformConnectList)
 * ลำดับ: LINE Shopping บนสุด แล้ว Shopee / Lazada / TikTok · ไอคอนรีเฟรชมุมขวาบน = อัปเดตคะแนนจากแพลตฟอร์มออนไลน์
 * Mock: สถานะการเชื่อมต่อเก็บใน src/mocks/platforms.ts (localStorage)
 */
export default function OnlinePlatformConnection() {
  const { t } = useI18n();
  // อ่าน platformState.bindings → อัปเดตทันทีเมื่อเชื่อมต่อ/ยกเลิก
  const enabled = () => platformService.list().filter((p) => p.is_enabled);
  const connected = () => enabled().filter((p) => p.status);
  return (
    <div class="min-h-screen bg-white">
      {/* Figma Connect_SelectPlatform (589:6122): ย้อนกลับ + หัวข้อ 18/700, กล่องแนะนำ, การ์ดแพลตฟอร์ม */}
      {/* ปุ่มรีเฟรชมุมขวา (ผลแบบหน้าเชื่อมต่อแพลตฟอร์มเดิม) — มีที่หน้าสะสมคะแนนด้วย (2026-11-25) */}
      <PageHeader title={t("platform.connect_platform")} backTo="profile" right={<PlatformRefreshButton />} />
      <div class="px-4">
        {/* กรอบม่วง: จำนวนที่เชื่อมต่อแล้ว (เช่น 1/4) + คำแนะนำ */}
        <InfoBox>
          <p class="font-semibold text-secondary">{t("platform.connected_channels_progress", { connected: connected().length, total: enabled().length })}</p>
          <p>{t("platform.choose_platform_to_connect_for_order_point")}</p>
        </InfoBox>
      </div>
      <PlatformConnectList class="p-4" />
    </div>
  );
}
