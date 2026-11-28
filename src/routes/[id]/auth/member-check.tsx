import { useNavigate } from "@solidjs/router";
import { BottomActionBar } from "~/components/layout/bottom-action-bar";
import { BrandHeader } from "~/components/layout/brand-header";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { useGoBack } from "~/lib/navigation";
import { usePartnerPath, useTheme } from "~/lib/theme";

/**
 * /:partner/user-verification — ถามว่าเคยเป็นสมาชิกหรือยัง
 * ต้นฉบับ: "เคยแล้ว" → verify-by-phone?action=merge, "ไม่เคย"/"ข้าม" → home (state.new_member)
 * "ข้าม" ไม่เปลี่ยนสถานะสมาชิก: Guest (มาจาก modal ชวนสมัคร / ปุ่มสมัครสมาชิก) ข้ามแล้วยังเป็น Guest และกลับหน้าเดิม
 *   · มาจาก LINE Login (บัญชีสมาชิกจำลอง) → หน้าแรกพร้อม popup ต้อนรับ ตามต้นฉบับ
 */
export default function UserVerification() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const to = usePartnerPath();
  const navigate = useNavigate();
  const goBack = useGoBack();

  const skip = () => {
    if (!session.isMember) return goBack();
    navigate(to("home"), { state: { new_member: true } });
  };

  return (
    <div class="min-h-screen bg-white">
      <BrandHeader />
      <div class="mt-8 flex flex-col items-center justify-center bg-white px-4 py-8">
        <h1 class="self-start text-18 font-semibold text-dark">
          {t("account.have_you_been_member", { brand: theme().display_name.replace(/\b\w/g, (c) => c.toUpperCase()) })}
        </h1>
        <div class="mt-8 flex w-full max-w-xs flex-col gap-4">
          <Button size="block" onClick={() => navigate(to("auth/verify-phone?action=merge"))}>
            {t("account.member_yes")}
          </Button>
          {/* ปุ่มหลักมีปุ่มเดียว — "ไม่เคย" เป็นปุ่มรอง (2026-11-28) */}
          <Button variant="secondary" size="block" onClick={() => navigate(to("auth/register"))}>
            {t("account.member_no")}
          </Button>
        </div>
      </div>
      <BottomActionBar>
        <Button variant="ghost" size="block" class="text-dark" onClick={skip}>
          {t("account.skip")}
        </Button>
      </BottomActionBar>
    </div>
  );
}
