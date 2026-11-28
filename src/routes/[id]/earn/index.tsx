import { A, useNavigate, useSearchParams } from "@solidjs/router";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { AlertDialog, InfoBox, ResultModal } from "~/components/ui/modal";
import { BottomNav, BottomNavSpacer } from "~/components/layout/bottom-nav";
import { PageHeader } from "~/components/layout/page-header";
import { BalanceBar } from "~/components/ui/balance-bar";
import { PlatformRefreshButton } from "~/components/platform/platform-refresh-button";
import { ConnectPlatformHint } from "~/components/platform/connect-platform-hint";
import { CoinIcon } from "~/components/mission/coin-icon";
import { QrScannerScreen } from "~/components/point/qr-scanner-screen";
import { PageLoading } from "~/components/ui/page-loading";
import { Progress } from "~/components/ui/progress";
import { useI18n } from "~/lib/i18n";
import { session, sessionActions } from "~/lib/session";
import { earnService } from "~/services/earn-service";
import { usePartnerPath } from "~/lib/theme";
import { delay, formatNumber } from "~/lib/utils";
import { missionService } from "~/services/mission-service";
import { platformService } from "~/services/platform-service";
import { PlatformTile } from "~/components/platform/platform-icon";
import { missionCollectKey } from "~/components/mission/mission-status";
import { cardClass } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { IconCamera, IconEdit, IconReceipt, IconRefresh, IconScanner, IconSmartphone } from "~/components/ui/icons";

/**
 * /:partner/point-collection — สะสมคะแนน (Figma "Earn Point" 589:3670)
 * - หัวข้อ "สะสมคะแนน" 18/700 + กล่องแจ้งข้อมูล
 * - การ์ด 2x2: ถ่ายรูปใบเสร็จ / สแกนคิวอาร์โค้ด / กรอกเลขที่ใบเสร็จ / กรอกรหัสสินค้า (เปิดใช้ครบตาม Figma)
 * - (การ์ด "กดเพื่ออัปเดตคะแนนจากแพลตฟอร์มออนไลน์" ย้ายไปล่างสุดของหน้าเชื่อมต่อแพลตฟอร์มออนไลน์)
 * - การ์ดแรกใน grid "เชื่อมต่อแพลตฟอร์มออนไลน์" (คู่กับถ่ายรูปใบเสร็จ) → /profile/platforms (LINE Shopping บนสุด)
 * Flow ตาม Figma:
 *   ถ่ายรูป → เลือกรูป → "ส่งตรวจสอบการสะสมคะแนน เรียบร้อยแล้ว / ใช้เวลาตรวจสอบประมาณ 48 ชั่วโมง" (ยังไม่ได้คะแนน)
 *   สแกน QR (กล้องจริง / อ่านจากรูป) → ผลตามรหัสใน QR (ดู services/earn-service.ts):
 *     สำเร็จ "สะสม 150คะแนน เรียบร้อยแล้ว" · "ไม่พบคิวอาร์โค้ดนี้ในระบบ" · "คิวอาร์โค้ดนี้ถูกใช้งานแล้ว"
 *   อัปเดตคะแนนจากแพลตฟอร์ม → ยังไม่เชื่อมต่อ: ชวนไปเชื่อมต่อ · มีคำสั่งซื้อใหม่: เพิ่มคะแนน · ไม่มี: คะแนนเป็นปัจจุบันแล้ว
 *   กรอกเลขที่ใบเสร็จ / รหัสสินค้า → หน้า earn/receipt | earn/product-code
 * ?mission=<id> (มาจากหน้าภารกิจ): สะสมแสตมป์/ความคืบหน้าให้ภารกิจแทนคะแนน
 */
type Method = "platform" | "photo" | "scan" | "receipt" | "code" | "missions";

/** title = key คำแปล */
/** การ์ดแรก = เชื่อมต่อแพลตฟอร์มออนไลน์ (คู่กับถ่ายรูปใบเสร็จ) — ไม่แสดงในโหมดภารกิจ */
const methods: { id: Method; title: string; icon: typeof IconCamera }[] = [
  { id: "platform", title: "platform.connect_platform", icon: IconSmartphone }, // ไอคอนเดียวกับเมนูในโปรไฟล์
  { id: "photo", title: "core.method_photo", icon: IconCamera },
  { id: "scan", title: "core.method_scan", icon: IconScanner },
  { id: "receipt", title: "core.method_receipt", icon: IconReceipt },
  { id: "code", title: "core.method_code", icon: IconEdit },
  // คู่กับกรอกรหัสสินค้า (เดิมเป็นแถบชมพูท้ายหน้า) — ไม่แสดงในโหมดภารกิจ
  { id: "missions", title: "common.earn_coins_from_mission", icon: CoinIcon as typeof IconCamera },
];

/** คะแนนจากใบเสร็จ (ถ่ายรูป) เมื่อเจ้าหน้าที่อนุมัติ (mock) */
const RECEIPT_PHOTO_POINTS = 150;

export default function EarnPoint() {
  const { t } = useI18n();
  // แพลตฟอร์มที่เปิดใช้ (แถวไอคอนในการ์ดเชื่อมต่อ)
  const enabledPlatforms = () => platformService.list().filter((p) => p.is_enabled);
  const to = usePartnerPath();
  const navigate = useNavigate();
  const [search] = useSearchParams<{ mission?: string }>();
  onMount(() => {
    missionService.restore();
    earnService.restore();
  });

  const mission = createMemo(() => (search.mission ? missionService.get(search.mission) : undefined));
  const [loading, setLoading] = createSignal<string | false>(false);
  const [scanOpen, setScanOpen] = createSignal(false);
  // connectHint: ส่งใบเสร็จ (ถ่ายรูป) สำเร็จ → ชวนเชื่อมต่อแพลตฟอร์มในป๊อปอัป
  const [result, setResult] = createSignal<{ variant: "success" | "error"; title: string; description?: string; connectHint?: boolean } | null>(null);
  let fileInput: HTMLInputElement | undefined;

  /** โหมดภารกิจ: สะสมให้ภารกิจ แล้วแจ้งผล (missionService.collect ใช้ร่วมกับหน้ากรอกเลข) */
  const collectForMission = () => setResult(missionService.collect(mission()!.id));

  const choose = (id: Method) => {
    if (id === "platform") return navigate(to("profile/platforms"));
    if (id === "missions") return navigate(to("missions"));
    if (id === "photo") return fileInput?.click();
    if (id === "scan") return setScanOpen(true);
    navigate(to(`earn/${id === "receipt" ? "receipt" : "product-code"}${mission() ? `?mission=${mission()!.id}` : ""}`));
  };

  const onPhoto = async () => {
    setScanOpen(false);
    setLoading(t("core.uploading_receipt"));
    await delay(1200);
    setLoading(false);
    if (mission()) return collectForMission();
    // ส่งให้เจ้าหน้าที่ตรวจ — ได้คะแนน + แจ้งเตือนเมื่ออนุมัติ (notificationService.syncTimed)
    sessionActions.submitReceiptReview(RECEIPT_PHOTO_POINTS);
    setResult({ variant: "success", title: t("core.receipt_submitted_title"), description: t("core.receipt_review_time"), connectHint: true });
  };

  const QR_ERROR = {
    not_found: "common.qr_not_found_title",
    used: "common.qr_already_used_title",
  } as const;

  /** ผลจากหน้าสแกน: data = ข้อความใน QR หรือ null ถ้าอ่านไม่ได้ */
  const onScanned = async (data: string | null) => {
    setScanOpen(false);
    setLoading(t("common.in_progress_wait_a_moment"));
    await delay(900);
    setLoading(false);
    const m = mission();
    const r = m ? earnService.checkQr(data) : earnService.redeemQr(data);
    if (r.status !== "success") return setResult({ variant: "error", title: t(QR_ERROR[r.status]), description: t("core.check_or_retry") });
    if (m) {
      earnService.markQrUsed(r.code);
      return collectForMission();
    }
    setResult({ variant: "success", title: t("core.earned_points_done", { points: r.points }), description: t("common.points_history_hint") });
  };


  return (
    <div class="min-h-screen bg-white">
      <PageLoading show={!!loading()} message={loading() || undefined} />
      {/* โหมดภารกิจมีปุ่มย้อนกลับไปหน้าภารกิจ */}
      {/* หน้าสะสมคะแนนปกติ: หัวหน้าชมพู ชื่อกึ่งกลาง + แถบยอดคะแนน + ปุ่มรีเฟรชมุมขวา (อัปเดตคะแนนและคอยน์เหมือนปุ่มหน้าแรก)
          โหมดภารกิจ: หัวหน้าชมพู ชื่อกึ่งกลาง + ปุ่มย้อนกลับไปหน้าภารกิจ (ไม่มีรีเฟรช) */}
      <Show
        when={mission()}
        fallback={
          // หัวหน้าแบบเดียวกับแลกรางวัล/ภารกิจ (2026-11-27): พื้นชมพูโค้งล่าง · ชื่อกึ่งกลาง · แถบยอดคะแนน (บรรทัดเดียว) · ปุ่มรีเฟรชมุมขวา
          <PageHeader tone="primary" align="center" hideBack title={t("component.card_member.collect_points")} right={<PlatformRefreshButton unit="all" />}>
            {/* countId "points" = ปลายทางเหรียญ P ปลิว + ตัวเลขนับขึ้น (ใช้ค่าที่จำร่วมกับหน้าแรก) */}
            <BalanceBar unit="points" inline countId="points" />
          </PageHeader>
        }
      >
        {(m) => <PageHeader tone="primary" align="center" title={t(missionCollectKey(m()))} backTo={`missions/${m().id}`} />}
      </Show>

      <div class="p-4">
        <InfoBox>
          {/* หน้าสะสมคะแนนปกติ: ข้อความจาก production (club.charmiss.co/charmiss/point-collection — 25 พ.ย. 2569) แสดงภาษาเดียวตามภาษาแอป (club.earn_notice)
              โหมดภารกิจ: ข้อความภารกิจเดิม (สะสมแสตมป์ / คอยน์) */}
          <Show
            when={!mission()}
            fallback={mission()?.type === "stamp" ? t("common.notice_earn_stamp") : t("common.notice_earn_coin")}
          >
            {/* ภาษาเดียว ตามภาษาที่ผู้ใช้เลือกในโปรไฟล์ (เดิมแสดง ไทย/อังกฤษ/จีน พร้อมกัน · 2026-11-27) */}
            <span>{t("club.earn_notice")}</span>
          </Show>
        </InfoBox>
      </div>

      <div class="flex flex-col gap-4 px-4">
        <Show when={mission()}>
          {(m) => (
            <A href={to(`missions/${m().id}`)} class={cn(cardClass, "block p-4")}>
              <div class="flex items-center justify-between gap-x-2">
                <h2 class="line-clamp-1 text-14 font-semibold text-dark">{m().title}</h2>
                {/* ภารกิจสะสมคอยน์ = คอยน์ที่สะสมได้ในภารกิจ · ภารกิจอื่น = คอยน์ที่จะได้เมื่อสำเร็จ */}
                <span class="flex shrink-0 items-center gap-x-1 text-12 font-medium text-teriary-text">
                  <CoinIcon size={14} />
                  {m().type === "coin" ? t("club.mission_collected_coins", { coins: formatNumber(m().coin_balance ?? 0) }) : `+${m().reward_coins}`}
                </span>
              </div>
              {/* แถบความคืบหน้าเฉพาะภารกิจที่มีเป้า (สะสมคอยน์แบบไม่มีเป้า = ไม่มีแถบ) */}
              <Show when={m().target > 0}>
                <div class="mt-2">
                  <Progress value={m().progress} max={m().target} />
                </div>
              </Show>
            </A>
          )}
        </Show>

        {/* เชื่อมต่อแพลตฟอร์มออนไลน์ = การ์ดขาว ภาษาภาพเดียวกับหน้าเชื่อมต่อแพลตฟอร์ม (2026-11-27)
            หัวข้อประโยชน์ + "ซื้อจากร้าน Charmiss Official" · แถวไอคอนแพลตฟอร์ม 40 (เท่ารายการหน้าเชื่อมต่อ · ถูกเขียว = เชื่อมแล้ว) + ปุ่มชมพู "เชื่อมต่อ" (ไม่มีบรรทัดจำนวนแล้ว — ถูกเขียวบนไอคอนบอกแทน)
            ทั้งการ์ดกด → หน้าเชื่อมต่อแพลตฟอร์ม · ไม่แสดงในโหมดภารกิจ */}
        <Show when={!mission()}>
          <div
            role="button"
            tabindex="0"
            onClick={() => choose("platform")}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && choose("platform")}
            class={cn(cardClass, "relative flex w-full cursor-pointer flex-col items-center gap-4 p-4 text-center transition active:scale-[0.98]")}
          >
            {/* ป้ายมุมซ้ายบน "แนะนำ" — ทรงเดียวกับป้ายสถานะบนการ์ดภารกิจ (rounded-r-lg rounded-tl-2xl) · แดงตาม DSL (2026-11-28) */}
            <span class="absolute left-0 top-0 rounded-r-lg rounded-tl-2xl bg-error px-2 py-1 text-12 font-medium text-white">{t("club.connect_hero_badge")}</span>
            {/* แถวไอคอนแพลตฟอร์ม 40 บนสุด (ถูกเขียว = เชื่อมแล้ว) · หัวข้อ 14/Medium ด้านล่าง · กึ่งกลางทั้งหมด · ไม่มีปุ่ม — ทั้งการ์ดกดได้ (2026-11-27) */}
            <div class="flex items-center justify-center gap-2">
              <For each={enabledPlatforms()}>{(p) => <PlatformTile platform={p} connected={!!p.status} size={40} />}</For>
            </div>
            <span class="text-center text-14 font-medium text-dark">
              {t("club.connect_hero_title")} {t("club.connect_hero_desc")}
            </span>
          </div>
        </Show>

        <div class="grid grid-cols-2 gap-4">
          <For each={methods.filter((m) => m.id !== "platform" && (!mission() || m.id !== "missions"))}>
            {(m) => (
              <button
                type="button"
                onClick={() => choose(m.id)}
                class={cn(cardClass, "relative flex min-w-0 flex-col items-center justify-center gap-2 px-4 py-8 transition active:scale-[0.98]")}
              >
                {/* สะสมคอยน์ = เหรียญ C สีเหลืองเต็มวง 40px (ไม่มีวงชมพู) · การ์ดอื่น = ไอคอนม่วงในวงม่วงอ่อน (เหมือนทางลัดหน้าแรก · DSL บทบาทสี 2026-11-28) */}
                <Show
                  when={m.id === "missions"}
                  fallback={
                    <span class="flex size-10 items-center justify-center rounded-full bg-secondary-surface">
                      <Dynamic component={m.icon} size={24} class="text-secondary" />
                    </span>
                  }
                >
                  <CoinIcon size={40} />
                </Show>
                {/* ไม่ใช้ line-clamp (overflow hidden ตัดสระ/วรรณยุกต์ไทยบน-ล่าง เช่น "ด" ใน "โค้ด" หาย · 2026-11-27) — ป้ายสั้น ขึ้นบรรทัดเองได้ */}
                <span class="max-w-full break-words text-center text-14 font-medium text-dark">{t(m.title)}</span>
              </button>
            )}
          </For>
        </div>

      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        class="hidden"
        onChange={(e) => {
          if (e.currentTarget.files?.[0]) onPhoto();
          e.currentTarget.value = "";
        }}
      />

      <BottomNavSpacer />
      <BottomNav />

      <QrScannerScreen open={scanOpen()} onClose={() => setScanOpen(false)} onResult={onScanned} />


      <ResultModal
        open={!!result()}
        onOpenChange={(o) => !o && setResult(null)}
        variant={result()?.variant}
        title={result()?.title}
        description={result()?.description}
        extra={result()?.connectHint ? <ConnectPlatformHint /> : undefined}
        onButton={() => {
          const m = mission();
          if (m && result()?.variant !== "error") navigate(to(`missions/${m.id}`));
        }}
      />
    </div>
  );
}
