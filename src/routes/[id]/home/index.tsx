import { A, useLocation, useNavigate } from "@solidjs/router";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { BannerCarousel } from "~/components/home/banner-carousel";
import { MemberCard } from "~/components/home/member-card";
import { WelcomePopup } from "~/components/home/welcome-popup";
import { BottomNav, BottomNavSpacer } from "~/components/layout/bottom-nav";
import { NotificationBell } from "~/components/layout/notification-bell";
import { PlatformRefreshButton } from "~/components/platform/platform-refresh-button";
import { BalanceSplit } from "~/components/ui/balance-bar";
import { Avatar } from "~/components/ui/avatar";
import { MissionGridCard } from "~/components/mission/mission-grid-card";
import { privilegeState } from "~/components/privilege/privilege-card";
import { Button } from "~/components/ui/button";
import { cardClass } from "~/components/ui/card";
import { IconChevronRight } from "~/components/ui/icons";
import { RewardGridCard } from "~/components/ui/reward-grid-card";
import { useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { cn, formatDate, formatNumber } from "~/lib/utils";
import type { Privilege } from "~/mocks/privileges";
import { missionService } from "~/services/mission-service";
import { privilegeService } from "~/services/privilege-service";
import { tierStatus } from "~/services/tier-service";
import { showTierCard, tierSystem } from "~/prototype/settings";

/**
 * /:partner/home — หน้าแรกสมาชิก (โครงแบบ Okya · token ตาม Figma Charmiss)
 * 1. ทักทาย + กระดิ่งแจ้งเตือน (มุมขวาบน · ป้ายตัวเลขที่ยังไม่อ่าน) → /notifications
 *    (ปุ่ม QR สมาชิกเอาออก — ยังไม่มีฟีเจอร์ให้พนักงานสแกน · components/member/member-qr-modal.tsx เก็บไว้ใช้ภายหลัง)
 * 2. การ์ดแบ่งสองฝั่ง "คะแนน | คอยน์" — สองสกุลแยกกันชัดเจน:
 *    คะแนน (P) ได้จากการซื้อทุกช่องทาง → สะสมคะแนน · คอยน์ (C) ได้จากภารกิจ → ภารกิจ
 *    + บรรทัดคะแนนใกล้หมดอายุ (เมื่อเปิด "คะแนนมีวันหมดอายุ")
 * 3. แถวระดับสมาชิก (คิดจากคะแนนอย่างเดียว) + แถบความคืบหน้า → /profile/tier
 * 4. แบนเนอร์ 2:1
 * 5. ภารกิจสะสมคอยน์ — การ์ดภารกิจ 2 คอลัมน์ (ป้าย +N คอยน์)
 * 6. ใช้คะแนนแลกสินค้า — grid 2 คอลัมน์ · คะแนนไม่พอ = รูปจาง + กุญแจ + "ขาดอีก X คะแนน"
 *    (คูปองของฉันย้ายไปแท็บในหน้าแลกรางวัล + เมนูโปรไฟล์)
 * Guest: การ์ดสมาชิกแบบเดิม (ชวนสมัคร) แทนการ์ดคะแนน/ระดับ
 */
function SectionTitle(props: { title: string; href: string }) {
  const { t } = useI18n();
  return (
    <div class="flex items-center justify-between">
      <h2 class="text-18 font-semibold text-dark">{props.title}</h2>
      <A href={props.href} class="hit-area flex items-center gap-1 text-14 font-medium text-gray" aria-label={t("core.see_all_section", { title: props.title })}>
        {t("club.see_all")}
        <IconChevronRight size={16} />
      </A>
    </div>
  );
}

export default function Home() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const navigate = useNavigate();
  const location = useLocation<{ new_member?: boolean }>();
  const [welcome, setWelcome] = createSignal(false);
  onMount(() => {
    setWelcome(!!location.state?.new_member);
    missionService.restore();
  });

  // สินค้า 4 ใบ (ไม่รวมคูปอง และที่หมดเขตแล้ว) — หมด/ยังไม่เริ่ม แสดงป้ายทับรูป
  const privileges = () => privilegeService.list().filter((p) => p.reward_type !== "coupon" && privilegeState(p) !== "expired_redeem").slice(0, 4);
  const overlayOf = (p: Privilege) => {
    const st = privilegeState(p);
    return st === "out_of_stock" ? t("common.stock_out_overlay") : st === "not_started" ? t("priv.starts_on", { date: formatDate(p.redeem_start) }) : undefined;
  };
  const missions = createMemo(() =>
    missionService
      .list()
      .filter((m) => m.status !== "expired" && m.status !== "completed" && (m.type === "coin" || m.reward_coins > 0))
      .slice(0, 2),
  );

  return (
    <div class="relative min-h-screen bg-white">
      <div class="absolute left-0 right-0 top-0 h-[240px] bg-brand-fade" />

      <Show
        when={session.isMember}
        fallback={
          <div class="relative px-4 pt-6">
            <MemberCard />
          </div>
        }
      >
        <div class="relative flex flex-col gap-4 px-4 pt-6">
          {/* ทักทาย + กระดิ่งแจ้งเตือน */}
          <div class="flex items-center gap-2">
            <A href={to("profile")} class="flex min-w-0 flex-1 items-center gap-2">
              <Avatar size={40} />
              <span class="flex min-w-0 flex-col">
                <span class="truncate text-18 font-semibold text-dark">{t("core.hello_name", { name: session.customer.name || session.customer.line_display_name })}</span>
                {/* รหัสสมาชิก (เช่น charmiss000000005) แทนชื่อระดับ */}
                <span class="truncate text-12 text-gray">{session.customer.member_code}</span>
              </span>
            </A>
            {/* ปุ่มเดียวอัปเดตทั้งคะแนนและคอยน์ — วงกลมขาวข้างกระดิ่ง (ตัดสินใจ 2026-11-25) */}
            <div class="flex shrink-0 items-center gap-2">
              <PlatformRefreshButton unit="all" />
              <NotificationBell />
            </div>
          </div>

          {/* คะแนน | คอยน์ — BalanceSplit (pattern เดียวกับทุกหน้า) · หน้าแรกพื้นชมพูเข้ม ตัวขาว (แบบ B — เลือกแล้ว 2026-11-25) */}
          <BalanceSplit size="lg" tone="brand" pointsHref="earn" countUp />
          {/* การ์ดระดับของคุณ — เปิด/ปิดได้จากเมนู prototype (มีระบบระดับ + แสดงการ์ด) */}
          <Show when={tierSystem() && showTierCard()}>
            <TierRow />
          </Show>
        </div>
      </Show>

      {/* แบนเนอร์ */}
      <div class="relative mt-6 px-4">
        {/* สไลด์แบนเนอร์ 2:1 · รูปจริงจากเจ้าของ (2400×1200 → ย่อ 1200×600 jpg) public/images/home/slide-1..4.jpg — 2026-11-25 */}
        <BannerCarousel images={[1, 2, 3, 4].map((n) => `/images/home/slide-${n}.jpg`)} />
      </div>

      {/* ภารกิจสะสมคอยน์ (ก่อนส่วนแลกสินค้า) */}
      <section class="relative mt-6 flex flex-col gap-2 px-4">
        <SectionTitle title={t("club.missions_coins")} href={to("missions")} />
        <Show when={!session.isMember}>
          {/* Guest (Figma Home_Guest mode): ชวนสมัครสมาชิก */}
          <div class="flex items-center gap-2 rounded-2xl bg-secondary-surface p-4">
            <div class="min-w-0 flex-1">
              <p class="text-14 font-semibold text-dark">{t("auth.guest_mission_title")}</p>
              <p class="text-14 text-gray">{t("auth.guest_mission_desc")}</p>
            </div>
            <Button variant="primary" size="md" onClick={() => navigate(to("auth/member-check"))}>
              {t("auth.sign_up_now")}
            </Button>
          </div>
        </Show>
        <div class="grid grid-cols-12 gap-4">
          <For each={missions()}>{(m) => <MissionGridCard mission={m} />}</For>
        </div>
      </section>

      {/* ใช้คะแนนแลกสินค้า */}
      <section class="relative mt-6 flex flex-col gap-2 px-4">
        <SectionTitle title={t("club.redeem_with_points")} href={to("rewards")} />
        <div class="grid grid-cols-2 gap-4">
          <For each={privileges()}>
            {(p) => (
              <RewardGridCard
                href={to(`rewards/${p.id}`)}
                image={{ colors: p.cover, src: p.image }}
                title={p.title}
                cost={p.points}
                unit="points"
                balance={session.isMember ? session.customer.points : 0}
                overlay={overlayOf(p)}
              />
            )}
          </For>
        </div>
      </section>

      <div class="h-6" aria-hidden="true" />
      <BottomNavSpacer />
      <BottomNav />

      {/* ต้อนรับสมาชิกใหม่ (Figma Popup welcome 1346:5123): รูปแบนเนอร์ + "ปิดหน้าต่างนี้" */}
      <WelcomePopup open={welcome()} onClose={() => setWelcome(false)} />
    </div>
  );
}

/** แถวระดับสมาชิก (ชื่อ/เหรียญเหมือนเว็บ ecom) — คิดจากคะแนนที่ได้รับในปีนี้ (คอยน์ไม่นับ) */
function TierRow() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const s = () => tierStatus();
  return (
    <A href={to("profile/tier")} class={cn(cardClass, "flex items-center gap-2 p-4")}>
      <img src={s().current.mark} alt="" width="40" height="40" class="size-10 shrink-0 object-contain" />
      {/* ชื่อระดับ (ยาว เช่น Charmiss Radiance) บรรทัดบน · แถบความคืบหน้า · ข้อความถึงระดับถัดไปบรรทัดล่าง */}
      <span class="flex min-w-0 flex-1 flex-col gap-1">
        <span class="truncate text-14 font-semibold text-dark">{t(`tier.name_${s().current.id}`)}</span>
        <span class="h-1 w-full overflow-hidden rounded-full bg-surface-gray">
          <span class="block h-1 rounded-full bg-primary" style={{ width: `${Math.round(s().progress * 100)}%` }} />
        </span>
        <span class="truncate text-12 text-gray">
          <Show when={s().next} fallback={t("tier.top")}>
            {(n) => t("tier.to_next", { points: formatNumber(s().needed), tier: t(`tier.name_${n().id}`) })}
          </Show>
        </span>
      </span>
      <IconChevronRight size={16} class="shrink-0 text-gray" />
    </A>
  );
}
