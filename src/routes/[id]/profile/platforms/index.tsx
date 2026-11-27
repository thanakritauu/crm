import { For } from "solid-js";
import { PageHeader } from "~/components/layout/page-header";
import { PlatformConnectList } from "~/components/platform/platform-connect-list";
import { InfoBox } from "~/components/ui/modal";
import { useI18n } from "~/lib/i18n";
import { platformService } from "~/services/platform-service";
import { PlatformRefreshButton } from "~/components/platform/platform-refresh-button";

/**
 * /:partner/profile/platforms — เชื่อมต่อแพลตฟอร์มออนไลน์
 * ต้นฉบับ: index-2a673c41.js (ConnectPlatformSelect) — กล่องคำแนะนำ + การ์ดแต่ละแพลตฟอร์ม
 * คำในหน้า (2026-11-27): แต่ละเรื่องพูดครั้งเดียว — บน = สถานะ · การ์ด = โลโก้/ปุ่ม/สถานะ · ล่าง = วิธีรับคะแนน + เงื่อนไข · ใช้คำว่า "แพลตฟอร์ม" (ไม่ใช้ "ช่องทาง")
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
        {/* สถานะอย่างเดียว + ประโยคเดียว (2026-11-27 ลดคำซ้ำ) — ยังไม่เชื่อมเลย = "ยังไม่ได้เชื่อมต่อแพลตฟอร์ม" · เชื่อมแล้ว = "เชื่อมต่อแล้ว 1 จาก 4 แพลตฟอร์ม" */}
        <InfoBox>
          <p class="font-semibold text-secondary">
            {connected().length ? t("platform.connected_channels_progress", { connected: connected().length, total: enabled().length }) : t("platform.none_connected")}
          </p>
          <p>{t("platform.intro_short")}</p>
        </InfoBox>
      </div>
      <PlatformConnectList class="p-4" />
      {/* วิธีรับคะแนน 3 ขั้นตอน + เงื่อนไข (บรรทัดเล็ก) — คะแนนเข้าเมื่อได้รับสินค้า · พูดเรื่อง Official/เงื่อนไขที่นี่ที่เดียว (2026-11-27) */}
      <section class="flex flex-col gap-2 px-4 pb-6">
        <h2 class="text-14 font-semibold text-dark">{t("platform.how_title")}</h2>
        <ol class="flex flex-col gap-2">
          <For each={["platform.how_step_1", "platform.how_step_2", "platform.how_step_3"]}>
            {(key, i) => (
              <li class="flex items-center gap-2 text-14 text-dark">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary-surface text-12 font-semibold text-secondary">{i() + 1}</span>
                {t(key)}
              </li>
            )}
          </For>
        </ol>
        {/* ดึงเฉพาะออเดอร์ร้าน Charmiss Official · ไม่รวมออเดอร์ก่อนเชื่อมต่อ — ไว้ล่างสุดของหน้า (ข้อเท็จจริงยืนยันโดยเจ้าของ 2026-11-27) */}
        <p class="text-12 text-gray">{t("platform.official_only_note")}</p>
      </section>
    </div>
  );
}
