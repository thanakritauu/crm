import { useSearchParams } from "@solidjs/router";
import { onMount } from "solid-js";
import { PageHeader } from "~/components/layout/page-header";
import { useI18n } from "~/lib/i18n";
import { MyCoupons } from "~/views/my-coupons";

/**
 * /:partner/wallet/coupons — คูปองของฉัน (หน้าเดี่ยว · 2026-11-27)
 * แยกออกจากหน้าแลกรางวัล: แลกรางวัล = ใช้คะแนน · คูปองของฉัน = ของที่มีอยู่แล้ว (คูปองจากคะแนน ภารกิจ/คอยน์ และสิทธิ์ระดับสมาชิก รวมที่เดียว)
 * ทางเข้า: ทางลัดหน้าแรก · เมนูโปรไฟล์ · ลิงก์ "คูปองของฉัน" ใต้แท็บหน้าแลกรางวัล · ปุ่มใน popup แลกคูปองสำเร็จ · การแจ้งเตือน
 * หัวหน้าชมพู ชื่อกึ่งกลาง (ไม่มีแถบยอดคะแนน — ไม่เกี่ยวกับการใช้คูปอง) · ตัวเรียง ?status=ready|expiring|history (ค่าเริ่มต้น ทั้งหมด)
 * URL เดิม ?tab=history → ถือเป็น status=history
 */
export default function MyCouponsPage() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams<{ tab?: string; status?: string }>();
  onMount(() => {
    if (params.tab === "history" && !params.status) setParams({ tab: undefined, status: "history" }, { replace: true });
  });
  return (
    <div class="img-background min-h-screen bg-white bg-cover bg-center">
      <PageHeader tone="primary" align="center" title={t("home.my_coupon")} backTo="home" />
      <MyCoupons />
      <div class="h-8" aria-hidden="true" />
    </div>
  );
}
