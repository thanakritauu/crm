import { A, useLocation, useNavigate } from "@solidjs/router";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { BannerCarousel, type BannerSlide } from "~/components/home/banner-carousel";
import { HomeQuickActions } from "~/components/home/home-shortcuts";
import { MemberCard } from "~/components/home/member-card";
import { shouldShowWelcome, WelcomePopup } from "~/components/home/welcome-popup";
import { BottomNav, BottomNavSpacer } from "~/components/layout/bottom-nav";
import { NotificationBell } from "~/components/layout/notification-bell";
import { PlatformRefreshButton } from "~/components/platform/platform-refresh-button";
import { BalanceSplit } from "~/components/ui/balance-bar";
import { cardClass } from "~/components/ui/card";
import { Avatar } from "~/components/ui/avatar";
import { MissionGridCard } from "~/components/mission/mission-grid-card";
import { privilegeState } from "~/components/privilege/privilege-card";
import { Button } from "~/components/ui/button";
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
import { homeDark, showTierCard, tierSystem } from "~/prototype/settings";

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

/**
 * สไลด์แบนเนอร์หน้าแรก — แก้รูป/ลิงก์ได้ที่นี่ที่เดียว
 * href: path ในแอป (ไม่ต้องใส่ /charmiss) หรือ URL ภายนอก https://… (เปิดแท็บใหม่) · ไม่ใส่ = กดไม่ได้
 * ลิงก์ตอนนี้เป็นตัวอย่าง (2026-11-25) — เปลี่ยนเป็นแคมเปญจริงได้
 */
const BANNER_SLIDES: BannerSlide[] = [
  { src: "/images/home/slide-1.jpg", href: "missions/cm-201" }, // Charmiss Playground → ภารกิจสะสมคอยน์
  { src: "/images/home/slide-2.jpg", href: "rewards/p-001" }, // Happy Birthday (ออม) → ของขวัญวันเกิด
  { src: "/images/home/slide-3.jpg", href: "missions" }, // แจก 5 รางวัล → หน้าภารกิจ
  { src: "/images/home/slide-4.jpg", href: "rewards" }, // Charmiss × Crayon Shin-chan → แลกรางวัล
];

export default function Home() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const navigate = useNavigate();
  const location = useLocation<{ new_member?: boolean }>();
  const [welcome, setWelcome] = createSignal(false);
  // ทดลองดีไซน์ (2026-11-26): พื้นชมพูเข้ม + การ์ดขาว — สลับได้จากเมนู prototype
  const isDark = () => homeDark();
  onMount(() => {
    // สมาชิกใหม่เห็นเสมอ · คนอื่นเห็นครั้งเดียวต่อการเปิดแอป จนกว่าจะติ๊ก "ไม่ต้องแสดงอีก"
    setWelcome(!!location.state?.new_member || (session.isMember && shouldShowWelcome()));
    missionService.restore();
  });

  // สินค้า 4 ใบ (ไม่รวมคูปอง และที่หมดเขตแล้ว) — หมด/ยังไม่เริ่ม แสดงป้ายทับรูป
  // หน้าแรกไม่แสดงของรางวัลที่หมดแล้ว และที่หมดเขต (2026-11-26)
  const privileges = () =>
    privilegeService
      .list()
      .filter((p) => p.reward_type !== "coupon" && privilegeState(p) !== "expired_redeem" && privilegeState(p) !== "out_of_stock")
      .slice(0, 4);
  const overlayOf = (p: Privilege) => {
    const st = privilegeState(p);
    return st === "out_of_stock" ? t("common.stock_out_overlay") : st === "not_started" ? t("priv.starts_on", { date: formatDate(p.redeem_start) }) : undefined;
  };
  // หน้าแรก: ภารกิจที่กำลังทำ · ไม่มีเลย → ภารกิจล่าสุด (เริ่มใหม่สุด ไม่รวมที่หมดเวลา) แทน (ตัดสินใจ 2026-11-25)
  const missions = createMemo(() => {
    const list = missionService.list().filter((m) => m.type === "coin" || m.reward_coins > 0);
    const doing = list.filter((m) => m.status === "in_progress");
    if (doing.length) return doing.slice(0, 2);
    return list
      .filter((m) => m.status !== "expired")
      .sort((a, b) => b.start_date.localeCompare(a.start_date))
      .slice(0, 2);
  });

  return (
    <div class="relative min-h-screen bg-white">
      {/* พื้นหลังหัวหน้าแบบเดิม (ปิดตัวเลือก homeDark) = ไล่ชมพูอ่อน · แบบชมพูเข้ม = พื้นของกล่องสมาชิกด้านล่าง (ยาวคลุมถึงการ์ดระดับสมาชิก) */}
      <Show when={!isDark()}>
        <div class="absolute left-0 right-0 top-0 h-[240px] bg-brand-fade" />
      </Show>

      <Show
        when={session.isMember}
        fallback={
          <div class="relative px-4 pt-6">
            <MemberCard />
          </div>
        }
      >
        {/* ชมพูเข้ม: พื้นคลุมทักทาย + การ์ดคะแนน|คอยน์ + การ์ดระดับสมาชิก ทั้งหมด โค้งล่าง (2026-11-26) */}
        <div class={cn("relative flex flex-col gap-4 px-4 pt-6", isDark() && "rounded-b-3xl bg-primary pb-4")}>
          {/* ทักทาย + กระดิ่งแจ้งเตือน */}
          <div class="flex items-center gap-2">
            <A href={to("profile")} class="flex min-w-0 flex-1 items-center gap-2">
              <Avatar size={40} />
              <span class="flex min-w-0 flex-col">
                <span class={cn("truncate text-18 font-semibold", isDark() ? "text-white" : "text-dark")}>{t("core.hello_name", { name: session.customer.name || session.customer.line_display_name })}</span>
                {/* รหัสสมาชิก (เช่น charmiss000000005) แทนชื่อระดับ */}
                <span class={cn("truncate text-12", isDark() ? "text-white" : "text-gray")}>{session.customer.member_code}</span>
              </span>
            </A>
            {/* ปุ่มเดียวอัปเดตทั้งคะแนนและคอยน์ — วงกลมขาวข้างกระดิ่ง (ตัดสินใจ 2026-11-25) */}
            <div class="flex shrink-0 items-center gap-2">
              <PlatformRefreshButton unit="all" />
              <NotificationBell />
            </div>
          </div>

          {/* คะแนน | คอยน์ — BalanceSplit (pattern เดียวกับทุกหน้า) · หน้าแรกพื้นชมพูเข้ม ตัวขาว (แบบ B — เลือกแล้ว 2026-11-25) */}
          {/* ระดับสมาชิก = การ์ดขาวสอดอยู่ใต้การ์ดชมพู (ชมพูทับขอบบน 16px — ตัดสินใจ 2026-11-25) · เปิด/ปิดได้จากเมนู prototype */}
          <div class="flex flex-col">
            {/* พื้นชมพูเข้ม → การ์ดขาว (tone white) · พื้นชมพูอ่อน → การ์ดชมพูเข้ม (tone brand) */}
            <BalanceSplit size="lg" tone={isDark() ? "white" : "brand"} countUp class="relative z-raised" />
            <Show when={tierSystem() && showTierCard()}>
              <TierRow />
            </Show>
          </div>
        </div>
        {/* ทางลัด (คูปองของฉัน · เชื่อมต่อแพลตฟอร์ม · แลกคะแนนเป็นคูปอง · ประวัติคะแนน) (2026-11-26 · แถบเตือนคูปองใกล้หมดอายุ และการ์ดชวนเชื่อมต่อแพลตฟอร์ม เอาออกแล้ว) */}
        <div class="mt-4 flex flex-col gap-4 px-4">
          <HomeQuickActions />
        </div>
      </Show>

      {/* แบนเนอร์ */}
      <div class="relative mt-6 px-4">
        {/* สไลด์แบนเนอร์ 2:1 · รูปจริงจากเจ้าของ (2400×1200 → ย่อ 1200×600 jpg) public/images/home/slide-1..4.jpg — 2026-11-25 */}
        <BannerCarousel slides={BANNER_SLIDES} />
      </div>

      {/* ภารกิจสะสมคอยน์ (ก่อนส่วนแลกสินค้า) — ที่กำลังทำ หรือภารกิจล่าสุดถ้าไม่มี · ไม่มีภารกิจเลย (และเป็นสมาชิก) → ซ่อนทั้งส่วน */}
      <Show when={!session.isMember || missions().length > 0}>
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
      </Show>

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

      {/* popup ต้อนรับ (Figma Popup welcome 1346:5123): รูป + X · ☐ ไม่ต้องแสดงอีก · ปิดหน้าต่างนี้ */}
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
    // การ์ดขาวเดิม ดันขึ้นไปใต้การ์ดชมพู (-mt-4) แล้วเติมพื้นที่บน (pt-8) ให้เนื้อหาไม่โดนทับ
    <A href={to("profile/tier")} class={cn(cardClass, "-mt-4 flex items-center gap-2 rounded-t-none px-4 pb-4 pt-8")}>
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
