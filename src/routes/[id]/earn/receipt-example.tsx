import { For } from "solid-js";
import { ReceiptExample, type ReceiptChannel } from "~/components/figma/receipt-example";
import { PageHeader } from "~/components/layout/page-header";
import { useI18n } from "~/lib/i18n";

/** /:partner/point-collection/detail — ตัวอย่างเลขที่ใบเสร็จแต่ละช่องทางการสั่งซื้อ (Figma "Info Receipt" 677:14204) */
const CHANNELS: ReceiptChannel[] = ["eveandboy", "shopee", "lazada", "tiktok"];

export default function PointCollectionDetail() {
  const { t } = useI18n();
  return (
    <div class="min-h-screen bg-white">
      <PageHeader title={t("core.receipt_examples_title")} backTo="earn" />
      <div class="mx-auto flex max-w-mobile flex-col gap-4 px-4 pb-8">
        <For each={CHANNELS}>{(c) => <ReceiptExample channel={c} />}</For>
      </div>
    </div>
  );
}
