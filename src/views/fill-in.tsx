import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { createMemo, createSignal, Show } from "solid-js";
import { InfoBox, ResultModal } from "~/components/ui/modal";
import { BottomActionBar, BottomActionBarSpacer } from "~/components/layout/bottom-action-bar";
import { PageHeader } from "~/components/layout/page-header";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { PageLoading } from "~/components/ui/page-loading";
import { useI18n } from "~/lib/i18n";
import { sessionActions } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { delay } from "~/lib/utils";
import { missionService } from "~/services/mission-service";
import { missionCollectKey } from "~/components/mission/mission-status";
import { IconAlert } from "~/components/ui/icons";
import { ConnectPlatformHint } from "~/components/platform/connect-platform-hint";

/**
 * /:partner/point-collection/fill-in/:id — 0 = กรอกเลขที่ใบเสร็จ, 1 = กรอกรหัสสินค้า
 * (route เดียวกับต้นฉบับ · หน้าตาตาม Figma "Input Receipt" 677:14152 / "InputCode" 677:14723)
 * - PageHeader (+ ไอคอน ! ต่อท้ายชื่อหน้า ไปหน้าตัวอย่างใบเสร็จ เฉพาะเลขที่ใบเสร็จ)
 * - กล่องแจ้งข้อมูล, ช่องกรอก, Button block "สะสมคะแนน" ด้านล่าง (disabled จนกว่าจะกรอก)
 * Mock: ค่าที่ขึ้นต้นด้วย "0000" = ไม่พบในระบบ (Modal_NonSuccess), อื่น ๆ ได้ 150 คะแนน
 */
const POINTS = 150;

/** กรอกเลขที่ใบเสร็จ (kind="receipt") / รหัสสินค้า (kind="product-code") — ใช้โดย routes earn/receipt และ earn/product-code */
export default function FillIn(props: { kind: "receipt" | "product-code" }) {
  const { t } = useI18n();
  const params = useParams();
  const [search] = useSearchParams<{ mission?: string }>();
  const navigate = useNavigate();
  const to = usePartnerPath();
  const isReceipt = () => props.kind === "receipt";
  const mission = createMemo(() => (search.mission ? missionService.get(search.mission) : undefined));
  const [value, setValue] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [result, setResult] = createSignal<{ variant: "success" | "error"; title: string; description?: string } | null>(null);

  // โหมดภารกิจ: "สะสมคอยน์" / "สะสมแสตมป์" แทน "สะสมคะแนน" (คะแนน = ซื้อสินค้าเท่านั้น)
  const collectLabel = () => (mission() ? t(missionCollectKey(mission()!)) : t("component.card_member.collect_points"));
  const texts = () =>
    isReceipt()
      ? {
          title: t("core.method_receipt"),
          info: mission() ? t("mis.fill_receipt_info", { action: collectLabel() }) : t("core.fill_receipt_info"),
          label: t("core.receipt_number"),
          notFound: t("core.receipt_not_found"),
        }
      : {
          title: t("core.method_code"),
          info: mission() ? t("mis.fill_code_info", { action: collectLabel() }) : t("core.fill_code_info"),
          label: t("core.product_code"),
          notFound: t("core.product_code_not_found"),
        };

  const submit = async () => {
    const v = value().trim();
    if (!v) return;
    setLoading(true);
    await delay(900);
    setLoading(false);
    if (v.startsWith("0000")) return setResult({ variant: "error", title: texts().notFound, description: t("core.check_or_retry") });
    const m = mission();
    // โหมดภารกิจ: ใช้ตัวเดียวกับหน้าสะสมคะแนน (ครบแสตมป์ = ได้คอยน์รางวัล · ทำสำเร็จแล้ว/หมดเวลา = แจ้งว่าสะสมไม่ได้)
    if (m) return setResult(missionService.collect(m.id));
    sessionActions.addPoints(
      POINTS,
      { key: isReceipt() ? "hist.earned_receipt" : "hist.earned_product_code", params: { points: POINTS, code: v } },
      { key: isReceipt() ? "hist.src_receipt" : "hist.src_product_code" },
    );
    setResult({ variant: "success", title: t("core.earned_points_done", { points: POINTS }), description: t("common.points_history_hint") });
  };

  return (
    <div class="min-h-screen bg-white">
      <PageLoading show={loading()} />
      <PageHeader
        backTo="earn"
        title={
          // ไอคอน ! อยู่ติดชื่อหน้า (ตาม Figma) ไม่ใช่ชิดขวา
          <span class="flex items-center gap-2">
            {texts().title}
            <Show when={isReceipt()}>
              <button type="button" class="hit-area" aria-label={t("core.receipt_example")} onClick={() => navigate(to("earn/receipt-example"))}>
                <IconAlert size={16} class="text-gray" />
              </button>
            </Show>
          </span>
        }
      />
      <div class="px-4">
        <InfoBox>{texts().info}</InfoBox>
        <form
          class="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Label for="fill-in">{texts().label}</Label>
          <Input id="fill-in" placeholder={t("core.enter_field", { field: texts().label })} value={value()} onInput={(e) => setValue(e.currentTarget.value)} autocomplete="off" />
        </form>
      </div>
      <BottomActionBarSpacer />
      <BottomActionBar class="pb-8">
        <Button size="block" disabled={!value().trim()} onClick={submit}>
          {collectLabel()}
        </Button>
      </BottomActionBar>
      <ResultModal
        open={!!result()}
        onOpenChange={(o) => !o && setResult(null)}
        variant={result()?.variant}
        title={result()?.title}
        description={result()?.description}
        // สะสมคะแนนสำเร็จ (ไม่ใช่โหมดภารกิจ) → ชวนเชื่อมต่อแพลตฟอร์ม
        extra={result()?.variant === "success" && !mission() ? <ConnectPlatformHint /> : undefined}
        onButton={() => {
          if (result()?.variant === "error") return;
          const m = mission();
          navigate(m ? to(`missions/${m.id}`) : to("earn"));
        }}
      />
    </div>
  );
}
