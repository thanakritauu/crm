import { useNavigate, useSearchParams } from "@solidjs/router";
import { createSignal, onMount, Show } from "solid-js";
import { PolicyHtml } from "~/components/account/policy-html";
import { BottomActionBar, BottomActionBarSpacer } from "~/components/layout/bottom-action-bar";
import { PageHeader } from "~/components/layout/page-header";
import { Button } from "~/components/ui/button";
import { PageLoading } from "~/components/ui/page-loading";
import { useI18n } from "~/lib/i18n";
import { usePartnerPath } from "~/lib/theme";
import { customerService } from "~/services/customer-service";

/**
 * /:partner/consent?action=...&type=line — ขอความยินยอม PDPA ก่อนยืนยันตัวตน/สมัครสมาชิก
 * ต้นฉบับ: index-12348f3c — Topbar "นโยบายคุ้มครองข้อมูลส่วนบุคคล", กล่องเลื่อนใส่ HTML จาก
 *   theme.consent, แถบล่าง (BottomActionBar) ปุ่ม "ยอมรับ" (กดได้เมื่อเลื่อนอ่านจนสุด)
 *   type=line → ปุ่มเขียว "ยอมรับและสมัครสมาชิกด้วย LINE" → line-authentication
 *   ปกติ → verify-by-phone?action=...
 * Prototype: ไม่บันทึก consent ที่ backend · ไม่มี action → ไปหน้า register
 *   ConsentDialog-83d3b0c8 (ป๊อปอัป) อยู่ที่ components/account/consent-dialog.tsx
 */
export default function Consent() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const navigate = useNavigate();
  const [params] = useSearchParams<{ action?: string; type?: string; path?: string }>();
  const [readToEnd, setReadToEnd] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  let box: HTMLDivElement | undefined;

  const check = () => {
    if (!box || readToEnd()) return;
    const { scrollTop, scrollHeight, clientHeight } = box;
    // เนื้อหาสั้นกว่ากล่อง หรือเลื่อนถึงล่างสุดแล้ว
    if (scrollHeight <= clientHeight + 1 || scrollTop + clientHeight >= scrollHeight - 4) setReadToEnd(true);
  };
  onMount(() => setTimeout(check, 100));

  const accept = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (params.type === "line") return navigate(to("auth/member-check"), { replace: true });
      if (params.action) {
        const path = params.path ? `&path=${encodeURIComponent(params.path)}` : "";
        return navigate(to(`auth/verify-phone?action=${params.action}${path}`), { replace: true });
      }
      navigate(to("auth/register"), { replace: true });
    }, 600);
  };

  return (
    <div class="min-h-screen bg-white">
      <PageHeader title={t("common.privacy_policy")} />
      <div class="px-4">
        <div ref={box} onScroll={check} class="relative max-h-[calc(100vh-200px)] overflow-y-auto pb-4">
          <PolicyHtml html={customerService.consentHtml()} />
        </div>
      </div>
      <BottomActionBarSpacer />
      <BottomActionBar>
        <Show when={!readToEnd()}>
          <p class="mb-2 text-center text-12 text-gray">{t("account.scroll_to_end_to_accept")}</p>
        </Show>
        <Show
          when={params.type === "line"}
          fallback={
            <Button size="block" disabled={!readToEnd()} onClick={accept}>
              {t("common.accept")}
            </Button>
          }
        >
          <Button variant="line" size="block" disabled={!readToEnd()} onClick={accept}>
            <img src="/images/line-icon.svg" alt="" class="size-6" />
            {t("common.accept_and_register_with_line")}
          </Button>
        </Show>
      </BottomActionBar>
    </div>
  );
}
