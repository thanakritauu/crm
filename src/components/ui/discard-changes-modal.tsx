import { ConfirmModal } from "~/components/ui/modal";
import { useI18n } from "~/lib/i18n";
import { IconInfo } from "~/components/ui/icons";

/**
 * ถามก่อนออกจากฟอร์มที่แก้ไขแล้วยังไม่บันทึก (ข้อมูลส่วนตัว / เพิ่ม-แก้ไขที่อยู่)
 * ใช้คู่กับ useDiscardGuard: กดย้อนกลับ → ถ้ามีการแก้ไข เปิด modal นี้ · "ทิ้งการแก้ไข" (แดง) = ออก · "แก้ไขต่อ" = อยู่หน้าเดิม
 */
export function DiscardChangesModal(props: { open: boolean; onOpenChange: (o: boolean) => void; onDiscard: () => void }) {
  const { t } = useI18n();
  return (
    <ConfirmModal
      open={props.open}
      onOpenChange={props.onOpenChange}
      tone="warning"
      icon={<IconInfo size={24} />}
      title={t("account.discard_title")}
      description={t("account.discard_desc")}
      cancelText={t("account.discard_keep")}
      confirmText={t("account.discard_confirm")}
      destructive
      onConfirm={props.onDiscard}
    />
  );
}
