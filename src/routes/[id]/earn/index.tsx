import { A, useNavigate, useSearchParams } from "@solidjs/router";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { AlertDialog, InfoBox, ResultModal } from "~/components/ui/modal";
import { BottomNav, BottomNavSpacer } from "~/components/layout/bottom-nav";
import { PageHeader } from "~/components/layout/page-header";
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
import { missionCollectKey } from "~/components/mission/mission-status";
import { cardClass } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { IconCamera, IconChevronRight, IconEdit, IconReceipt, IconRefresh, IconScanner, IconSmartphone } from "~/components/ui/icons";

/**
 * /:partner/point-collection — สะสมคะแนน (Figma "Earn Point" 589:3670)
 * - หัวข้อ "สะสมคะแนน" 18/700 + กล่องแจ้งข้อมูล
 * - การ์ด 2x2: ถ่ายรูปใบเสร็จ / แสกนคิวอาร์โค้ด / กรอกเลขที่ใบเสร็จ / กรอกรหัสสินค้า (เปิดใช้ครบตาม Figma)
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

/** คำแนะนำหน้าสะสมคะแนน — ข้อความจาก production (ไทย · อังกฤษ · จีน แสดงพร้อมกัน ไม่แปลตามภาษาแอป) */
const EARN_NOTICE = [
  "การสะสมคะแนนในส่วนนี้ใช้สำหรับแลกสินค้าเท่านั้น ไม่รวมถึงภารกิจหรือกิจกรรมอื่น ๆ",
  "Points collected here are for product redemption only and do not include missions or other activities.",
  "此处积累的积分仅用于兑换商品，不包含任务或其他活动。",
];

export default function EarnPoint() {
  const { t } = useI18n();
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
      {/* หน้าสะสมคะแนนปกติ: ชื่อชิดซ้าย + ปุ่มรีเฟรชมุมขวา (ย้ายมาจากหน้าเชื่อมต่อแพลตฟอร์ม — อัปเดตคะแนนและคอยน์เหมือนปุ่มหน้าแรก · 2026-11-25)
          โหมดภารกิจ: ชื่อกึ่งกลาง + ปุ่มย้อนกลับไปหน้าภารกิจ (ไม่มีรีเฟรช) */}
      <Show
        when={mission()}
        fallback={<PageHeader title={t("component.card_member.collect_points")} hideBack right={<PlatformRefreshButton unit="all" />} />}
      >
        {(m) => <PageHeader align="center" title={t(missionCollectKey(m()))} backTo={`missions/${m().id}`} />}
      </Show>

      <div class="px-4 pb-4">
        <InfoBox>
          {/* หน้าสะสมคะแนนปกติ: ข้อความจาก production (club.charmiss.co/charmiss/point-collection — 25 พ.ย. 2569) แสดง 3 ภาษาพร้อมกันทุกภาษาแอป
              โหมดภารกิจ: ข้อความภารกิจเดิม (สะสมแสตมป์ / คอยน์) */}
          <Show
            when={!mission()}
            fallback={mission()?.type === "stamp" ? t("common.notice_earn_stamp") : t("common.notice_earn_coin")}
          >
            <span class="flex flex-col gap-1">
              <For each={EARN_NOTICE}>{(line) => <span>{line}</span>}</For>
            </span>
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
                <span class="flex shrink-0 items-center gap-x-1 text-12 font-medium text-teriary">
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

        {/* เชื่อมต่อแพลตฟอร์มออนไลน์ = ช่องทางแนะนำ → การ์ดเต็มความกว้างบนสุด (2026-11-26 · เดิมเป็นช่องแรกในตาราง)
            ป้าย "แนะนำ" สีเหลืองมุมซ้ายบนติดขอบ (แบบป้ายสถานะการ์ดภารกิจ) · พื้นชมพูเข้ม ตัวขาว · ไอคอนวงขาว + ชื่อ 14/Medium + คำอธิบาย 14 + ">" · ไม่แสดงในโหมดภารกิจ */}
        <Show when={!mission()}>
          <button
            type="button"
            onClick={() => choose("platform")}
            class="relative flex w-full items-center gap-4 rounded-2xl bg-primary px-4 pb-4 pt-8 text-left transition active:scale-[0.98]"
          >
            {/* ป้าย "แนะนำ" สีเหลือง (teriary = Yellow-500 ของ design system) — 2026-11-26 */}
            <span class="absolute left-0 top-0 rounded-r-lg rounded-tl-2xl bg-teriary px-2 py-1 text-12 font-medium text-white">{t("core.recommended")}</span>
            <span class="flex size-12 shrink-0 items-center justify-center rounded-full bg-white">
              <IconSmartphone size={24} class="text-primary" />
            </span>
            <span class="flex min-w-0 flex-1 flex-col gap-1">
              {/* ขนาดตัวอักษรเท่าการ์ดช่องทางอื่นในหน้านี้ (14/Medium) */}
              {/* ">" อยู่บรรทัดเดียวกับชื่อ (ชิดขวา) — 2026-11-26 */}
              <span class="flex items-center justify-between gap-2">
                <span class="text-14 font-medium text-white">{t("platform.connect_platform")}</span>
                <IconChevronRight size={16} class="shrink-0 text-white" />
              </span>
              {/* 14 เท่าคำอธิบายในหน้าเชื่อมต่อแพลตฟอร์ม ("เชื่อมต่อบัญชี Shopee ของคุณ…") */}
              <span class="text-14 text-white">{t("club.connect_card_desc")}</span>
            </span>
          </button>
        </Show>

        <div class="grid grid-cols-2 gap-4">
          <For each={methods.filter((m) => m.id !== "platform" && (!mission() || m.id !== "missions"))}>
            {(m) => (
              <button
                type="button"
                onClick={() => choose(m.id)}
                class={cn(cardClass, "relative flex min-w-0 flex-col items-center justify-center gap-2 px-4 py-8 transition active:scale-[0.98]")}
              >
                {/* สะสมคอยน์ = เหรียญ C สีเหลืองเต็มวง 40px (ไม่มีวงชมพู) · การ์ดอื่น = ไอคอนชมพูในวงชมพูอ่อน */}
                <Show
                  when={m.id === "missions"}
                  fallback={
                    <span class="flex size-10 items-center justify-center rounded-full bg-primary-surface">
                      <Dynamic component={m.icon} size={24} class="text-primary" />
                    </span>
                  }
                >
                  <CoinIcon size={40} />
                </Show>
                <span class="line-clamp-2 max-w-full text-center text-14 font-medium text-dark">{t(m.title)}</span>
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
