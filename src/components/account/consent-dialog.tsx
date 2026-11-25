import { Dialog } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/lib/i18n";
import { customerService } from "~/services/customer-service";
import { PolicyHtml } from "./policy-html";

/**
 * ป๊อปอัปนโยบายคุ้มครองข้อมูลส่วนบุคคล — Dialog หัวข้อ 18/Semi กลาง, กล่องเนื้อหา 14/Med สีเทา มุม 16,
 * ปุ่มคู่ ปิด (secondary) + ยอมรับ (primary) สูง 48
 * ใช้ในหน้า register เมื่อกดลิงก์ในช่องติ๊กยินยอม — กด "ยอมรับ" = ติ๊กให้อัตโนมัติ
 */
export function ConsentDialog(props: { open: boolean; onOpenChange: (open: boolean) => void; onAccept?: () => void }) {
  const { t } = useI18n();
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} title={t("common.privacy_policy")} hideClose>
      <div class="max-h-[55vh] overflow-y-auto rounded-2xl bg-surface-gray p-4">
        <PolicyHtml html={customerService.consentHtml()} class="text-14 text-gray" />
      </div>
      <div class="flex w-full gap-2">
        <Button variant="secondary" size="dialog" onClick={() => props.onOpenChange(false)}>
          {t("common.close")}
        </Button>
        <Button
          size="dialog"
          onClick={() => {
            props.onAccept?.();
            props.onOpenChange(false);
          }}
        >
          {t("common.accept")}
        </Button>
      </div>
    </Dialog>
  );
}
