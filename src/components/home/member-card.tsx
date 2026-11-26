import { A } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { buttonVariants } from "~/components/ui/button";
import { Avatar } from "~/components/ui/avatar";
import { ResultModal } from "~/components/ui/modal";
import { useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { formatNumber } from "~/lib/utils";
import { IconRefresh, IconUser } from "~/components/ui/icons";

/**
 * การ์ดสมาชิก (Figma Home_Coupon "Content" 583:4018)
 * bg-primary border-[3px] border-white/30 rounded-[24px] p-[24px] h-[190px] shadow card
 * แถวบน: รูป 24px + "สวัสดี คุณ<ชื่อ>" 18/700 ขาว | โลโก้ 48px
 * แถวล่าง: "คะแนนทั้งหมด" 14/700 + ไอคอนรีเฟรช 11px, คะแนน 24/700, ปุ่ม Button white/sm (32px) "ดูประวัติคะแนน" (เป็นลิงก์)
 */
export function MemberCard() {
  const { t, locale } = useI18n();
  const to = usePartnerPath();
  const [refreshed, setRefreshed] = createSignal(false);

  return (
    <div class="flex h-[190px] w-full flex-col justify-between overflow-hidden rounded-3xl border-[3px] border-white/30 bg-primary p-6 shadow-card">
      <div class="flex items-center justify-between">
        <A href={to("profile")} class="flex min-w-0 items-center gap-2">
          <Show
            when={session.isMember}
            fallback={
              // Guest (Figma Home_Guest mode): ไอคอนผู้ใช้ + "สวัสดี ยินดีต้อนรับ"
              <>
                <span class="flex size-6 shrink-0 items-center justify-center rounded-full border border-white">
                  <IconUser size={16} class="text-white" />
                </span>
                <p class="truncate text-18 font-semibold text-white">{t("auth.hello_guest")}</p>
              </>
            }
          >
            <Avatar size={24} />
            <p class="truncate text-18 font-semibold text-white">{t("core.hello_name", { name: session.customer.name || session.customer.line_display_name })}</p>
          </Show>
        </A>
        <img src="/images/figma/home-logo.png" alt="" width="48" height="48" class="h-12 w-12 shrink-0 rounded-full" />
      </div>
      <div class="flex flex-col">
        <div class="flex items-center gap-1">
          <p class="text-14 font-semibold text-white">{t("component.card_member.total_points")}</p>
          <button type="button" class="hit-area" aria-label={t("core.refresh_points")} onClick={() => setRefreshed(true)}>
            <IconRefresh size={12} class="text-white" />
          </button>
        </div>
        <div class="flex items-center justify-between gap-2">
          <p class="min-w-0 truncate text-white">
            <span class="text-24 font-semibold">{formatNumber(session.customer.points)}</span>{" "}
            {/* ไทยตาม Figma (24/Semibold ทั้งบรรทัด) · อังกฤษคำยาวกว่า ย่อหน่วยเป็น 14 เพื่อไม่ชนปุ่ม */}
            <span class={locale() === "en" ? "text-14 font-medium" : "text-24 font-semibold"}>{t("core.points_unit")}</span>
          </p>
          <Show
            when={session.isMember}
            fallback={
              <A href={to("auth/member-check")} class={buttonVariants({ variant: "white", size: "sm" })}>
                {t("profile.register_button")}
              </A>
            }
          >
            <A href={to("wallet/points-history")} class={buttonVariants({ variant: "white", size: "sm" })}>
              {t("component.card_member.view_points_history")}
            </A>
          </Show>
        </div>
      </div>
      <ResultModal
        open={refreshed()}
        onOpenChange={setRefreshed}
        title={t("dialog.refresh_point.points_is_now")}
        description={t("core.total_points_amount", { points: formatNumber(session.customer.points) })}
      />
    </div>
  );
}
