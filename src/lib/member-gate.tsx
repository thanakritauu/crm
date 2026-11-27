import { useNavigate } from "@solidjs/router";
import { createSignal, onMount } from "solid-js";
import { AlertDialog } from "~/components/ui/modal";
import { useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { IconGift } from "~/components/ui/icons";

/**
 * จำกัดสิทธิ์โหมด Guest (Figma "ความแตกต่าง Guest Mode vs Member")
 * Guest สะสมคะแนนและทำภารกิจได้ · แลกของรางวัล / ใช้คูปอง / เชื่อมต่อแพลตฟอร์ม ฯลฯ ต้องเป็นสมาชิก
 * ใช้: requireMember(() => ทำต่อ) — ถ้าเป็น Guest จะเปิด modal ชวนสมัครสมาชิกแทน
 * วาง <MemberGateModal /> ไว้ครั้งเดียวใน app shell
 */
const [open, setOpen] = createSignal(false);

export function requireMember(action: () => void) {
  if (session.isMember) return action();
  setOpen(true);
}

/**
 * หน้าสำหรับสมาชิกเท่านั้น (ข้อมูลส่วนตัว, สมุดที่อยู่, เชื่อมต่อแพลตฟอร์ม, แลกคะแนนเป็นคูปอง)
 * Guest เปิดตรงด้วย URL → กลับหน้าโปรไฟล์ + modal ชวนสมัครสมาชิก
 * รอ restoreSession (onMount ของ Shell ทำหลังหน้าลูก) ก่อนตรวจ
 */
export function useMemberOnly() {
  const navigate = useNavigate();
  const to = usePartnerPath();
  onMount(() =>
    setTimeout(() => {
      if (session.isMember) return;
      navigate(to("profile"), { replace: true });
      setOpen(true);
    }, 0),
  );
}

export function MemberGateModal() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const to = usePartnerPath();
  return (
    <AlertDialog
      open={open()}
      onOpenChange={setOpen}
      icon={<IconGift size={20} />}
      title={t("auth.member_only_title")}
      description={t("auth.member_only_desc")}
      cancelText={t("auth.later")}
      confirmText={t("profile.register_button")}
      onConfirm={() => navigate(to("auth/member-check"))}
    />
  );
}
