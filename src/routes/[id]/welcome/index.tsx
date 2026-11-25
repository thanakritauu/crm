import { useNavigate } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { GuestMemberModal } from "~/components/account/guest-member-modal";
import { BrandHeader } from "~/components/layout/brand-header";
import { Button } from "~/components/ui/button";
import { PageLoading } from "~/components/ui/page-loading";
import { useI18n } from "~/lib/i18n";
import { session, sessionActions } from "~/lib/session";
import { usePartnerPath, useTheme } from "~/lib/theme";
import { outsideLine } from "~/prototype/settings";
import { LanguageSheet } from "~/components/figma/language-sheet";
import { IconInfo, IconSmartphone, IconUser } from "~/components/ui/icons";

/**
 * /:partner/landing — เลือกวิธีเข้าสู่ระบบ/สมัครสมาชิก
 * Figma: Select_Login (1279:9620, เปิดใน LINE) · Select_Register (1279:9750, เปิดนอก LINE เพิ่มปุ่มเบอร์มือถือ)
 * - LINE → (จำลอง LINE Login) → user-verification "คุณเคยเป็นสมาชิกแล้วหรือยัง?"
 * - เบอร์มือถือ (นอก LINE) → ยืนยันเบอร์ + OTP (verify-by-phone?action=signin)
 * - Guest → เข้าหน้าแรกแบบไม่สมัครสมาชิก (sessionActions.enterGuest)
 * - "ความต่างระหว่าง Guest กับ Member" → ตารางเปรียบเทียบ (GuestMemberModal)
 * เปิดนอก LINE จำลองได้จากเมนู prototype
 */
export default function Landing() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const to = usePartnerPath();
  const navigate = useNavigate();
  const [loading, setLoading] = createSignal(false);
  const [compareOpen, setCompareOpen] = createSignal(false);
  const [languageOpen, setLanguageOpen] = createSignal(false);

  const loginWithLine = () => {
    setLoading(true);
    setTimeout(() => {
      sessionActions.login();
      navigate(to("auth/member-check"));
    }, 900);
  };
  const loginWithPhone = () => navigate(to("auth/verify-phone?action=signin"));
  const enterGuest = () => {
    sessionActions.enterGuest();
    navigate(to("home"), { replace: true });
  };

  return (
    <div class="flex min-h-screen flex-col bg-white">
      {/* เปลี่ยนภาษาได้ก่อนเข้าสู่ระบบ (Guest ก็เปลี่ยนได้) */}
      <BrandHeader
        right={
          <button
            type="button"
            onClick={() => setLanguageOpen(true)}
            class="flex min-h-10 items-center gap-2 rounded-full bg-white/20 px-4 text-12 font-medium text-white"
            aria-label={t("common.choose_language")}
          >
            <img src={session.language === "en" ? "/images/figma/flag-en.png" : "/images/figma/flag-th.png"} alt="" width="16" height="16" class="size-4 rounded-full" />
            {session.language === "en" ? "EN" : "TH"}
          </button>
        }
      />
      <div class="flex flex-col items-center px-4 pt-16 text-center">
        <p class="text-18 font-semibold text-dark">{t("landing.welcome")}</p>
        <p class="text-24 font-semibold text-primary">{theme().display_name}</p>
      </div>

      <div class="mt-auto flex flex-col items-center gap-4 px-4 py-10">
        <p class="text-18 font-semibold text-dark">{t("auth.select_method")}</p>
        <div class="flex w-full flex-col gap-4">
          <Button variant="line" size="block" onClick={loginWithLine}>
            <img src="/images/figma/icon-line-white.svg" alt="" width="20" height="20" />
            {t("landing.line")}
          </Button>
          <Show when={outsideLine()}>
            <Button size="block" onClick={loginWithPhone}>
              <IconSmartphone size={20} class="text-white" />
              {t("auth.mobile_number")}
            </Button>
          </Show>
          <div class="flex items-center gap-4" aria-hidden="true">
            <span class="h-px flex-1 bg-stroke" />
            <span class="text-14 text-gray">{t("landing.or")}</span>
            <span class="h-px flex-1 bg-stroke" />
          </div>
          <Button size="block" onClick={enterGuest}>
            <IconUser size={20} class="text-white" />
            {t("landing.register_guest")}
          </Button>
        </div>
        <button type="button" class="flex items-center gap-2 pt-6 text-14 text-gray underline" onClick={() => setCompareOpen(true)}>
          <IconInfo size={16} class="text-gray" />
          {t("auth.guest_vs_member_link")}
        </button>
      </div>

      <GuestMemberModal open={compareOpen()} onOpenChange={setCompareOpen} />
      <LanguageSheet open={languageOpen()} onOpenChange={setLanguageOpen} />
      <PageLoading show={loading()} message={t("account.line_login_loading")} />
    </div>
  );
}
