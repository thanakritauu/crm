import { children, createSignal, For, Show, type Component, type JSX, type ParentComponent } from "solid-js";
import { BottomActionBar, BottomActionBarSpacer } from "~/components/layout/bottom-action-bar";
import { NavigationTopbar } from "~/components/layout/navigation-topbar";
import { CoverImage } from "~/components/ui/cover-image";
import { RedeemSummary, type BalanceUnit } from "~/components/ui/balance-bar";
import { useI18n } from "~/lib/i18n";
import { cn } from "~/lib/utils";

/**
 * Template หน้ารายละเอียด — ใช้ร่วมกัน: คูปอง / สิทธิพิเศษ / ภารกิจ / ของรางวัล / แลกรางวัลภารกิจ
 *
 * โครงจากบนลงล่าง
 *   1. Header บนรูป (NavigationTopbar + ชื่อหน้า, ไล่เฉดดำให้อ่านได้บนรูป)
 *   2. รูปปก 16:9 + ข้อความทับรูป (dark = ใช้ไม่ได้/หมดเขต, gray = แลก/ใช้แล้ว) · รูปโหลดไม่ได้ = รูป error เดียวกันทุกหน้า
 *   3. status (ช่องเสริม ติดใต้รูป ไม่มีขอบ) — เช่น แถบความคืบหน้าภารกิจ
 *   4. เนื้อหา p-4 ห่างกัน 16px: DetailTitle → DetailMeta → StatSplitBox → ส่วนเฉพาะหน้า → InfoTabs
 *   5. DetailActionBar (แถวสรุปไม่บังคับ + ปุ่ม)
 * แต่ละหน้าเก็บ logic เอง (สถานะ การแลก modal) — template คุมแค่โครง ระยะห่าง ฟอนต์ สี
 */
export const DetailLayout: ParentComponent<{
  /** ชื่อหน้าบน header (เช่น "สิทธิพิเศษ") */
  title: string;
  backTo?: string;
  cover: DetailCoverProps;
  /** ช่องเสริมติดใต้รูป (เต็มความกว้าง) */
  status?: JSX.Element;
}> = (props) => {
  const status = children(() => props.status);
  return (
    <div class="flex min-h-screen flex-col bg-white">
      <NavigationTopbar isLightColor overImage textMain={props.title} navTo={props.backTo} />
      <DetailCover {...props.cover} />
      <Show when={status()}>{status()}</Show>
      <div class="flex flex-col gap-4 p-4">{props.children}</div>
    </div>
  );
};

export type DetailCoverProps = {
  colors: [string, string];
  src?: string;
  /** ข้อความทับรูป · tone: dark = ใช้ไม่ได้ (หมดเขต / หมด / หมดอายุ), gray = แลก/ใช้แล้ว */
  overlay?: { text: string; tone?: "dark" | "gray" };
};

/** รูปปก 16:9 — ไม่มีรูป = ภาพไล่สี · โหลดไม่ได้ = รูป error */
export function DetailCover(props: DetailCoverProps) {
  const [failed, setFailed] = createSignal(false);
  return (
    <div class="relative aspect-cover w-full overflow-hidden">
      <Show
        when={props.src && !failed()}
        fallback={
          <Show when={props.src} fallback={<CoverImage colors={props.colors} class="absolute inset-0 size-full" />}>
            <div class="absolute inset-0 flex items-center justify-center bg-gray-placeholder">
              <img src="/images/figma/image-error.svg" alt="" width="100" height="100" />
            </div>
          </Show>
        }
      >
        <img src={props.src} alt="" onError={() => setFailed(true)} class="absolute inset-0 size-full object-cover" />
      </Show>
      <Show when={props.overlay}>
        {(o) => (
          <div class={cn("absolute inset-0 flex items-center justify-center px-4 text-center", o().tone === "gray" ? "bg-gray/70" : "bg-black/40")}>
            <p class="text-18 font-semibold text-white">{o().text}</p>
          </div>
        )}
      </Show>
    </div>
  );
}

/** ชื่อ 16/Semibold + รายละเอียด 14 สีเทา · รายละเอียดยาว (> 80 ตัวอักษร) พับ 2 บรรทัด + "ดูเพิ่ม" */
export function DetailTitle(props: { title: JSX.Element; description?: string; children?: JSX.Element }) {
  const { t } = useI18n();
  const [open, setOpen] = createSignal(false);
  const long = () => (props.description?.length ?? 0) > 80;
  const extra = children(() => props.children);
  return (
    <div class="flex flex-col gap-1">
      <h1 class="text-16 font-semibold text-dark">{props.title}</h1>
      <Show when={props.description}>
        <p class="whitespace-pre-line text-14 text-gray" classList={{ "line-clamp-2": long() && !open() }}>
          {props.description}
        </p>
      </Show>
      <Show when={extra()}>{extra()}</Show>
      <Show when={long()}>
        <button type="button" class="hit-area self-start text-12 text-gray underline" onClick={() => setOpen(!open())}>
          {open() ? t("common.show_less") : t("common.show_more")}
        </button>
      </Show>
    </div>
  );
}

export type DetailMetaItem = {
  icon: Component<{ size?: number; class?: string }>;
  text: JSX.Element;
  /** ข้อความเสริมใต้แถว (เช่น "หมดเวลาแลก" / "เริ่มแลก …") */
  note?: { text: string; tone: "error" | "secondary" };
};

/** แถวข้อมูล: ไอคอน 16 สีชมพู + ข้อความ 14 สีเทา (ห่างกัน 8) */
export function DetailMeta(props: { items: (DetailMetaItem | false | undefined)[] }) {
  return (
    <ul class="flex flex-col gap-2">
      <For each={props.items.filter((x): x is DetailMetaItem => !!x)}>
        {(m) => (
          <li class="flex flex-col gap-1">
            <span class="flex items-start gap-2 text-14 text-gray">
              <span class="flex h-5 shrink-0 items-center">
                <m.icon size={16} class="text-primary" />
              </span>
              <span class="min-w-0">{m.text}</span>
            </span>
            <Show when={m.note}>
              {(n) => <span class={cn("pl-6 text-12 font-medium", n().tone === "error" ? "text-error" : "text-secondary")}>{n().text}</span>}
            </Show>
          </li>
        )}
      </For>
    </ul>
  );
}

/** กล่องตัวเลข 2 ช่องมีเส้นคั่น (พื้นม่วงอ่อน มุม 16) — ค่า 16/Semibold สีชมพู + ป้าย 12 สีเทา */
export function StatSplitBox(props: { items: [StatItem, StatItem] }) {
  return (
    <div class="relative grid grid-cols-2 rounded-2xl bg-secondary-surface">
      <For each={props.items}>
        {(s) => (
          <div class="flex flex-col items-center p-4 text-center">
            <span class="flex items-center justify-center gap-2 text-16 font-semibold text-primary">
              {s.icon}
              {s.value}
            </span>
            <span class="text-12 text-gray">{s.label}</span>
          </div>
        )}
      </For>
      <div class="absolute inset-y-4 left-1/2 w-px bg-secondary" aria-hidden="true" />
    </div>
  );
}
export type StatItem = { icon?: JSX.Element; value: JSX.Element; label: string };

/** หัวข้อส่วนในหน้ารายละเอียด 16/Semibold */
export const DetailSectionTitle: ParentComponent<{ class?: string }> = (props) => (
  <h2 class={cn("text-16 font-semibold text-dark", props.class)}>{props.children}</h2>
);

/**
 * แถบปุ่มล่างของหน้ารายละเอียด — แถวสรุปตอนแลก (RedeemSummary: "ใช้ X คะแนน" / "ขาดอีก X" · "คงเหลือ (P) Y") + ปุ่ม
 * เว้นที่ด้านล่างของหน้าให้อัตโนมัติ · ใช้ทั้งหน้ารายละเอียด สรุปการแลก และแลกรางวัลของภารกิจ
 */
export const DetailActionBar: ParentComponent<{
  redeem?: { unit: BalanceUnit; cost: number; balance?: number };
}> = (props) => (
  <>
    <BottomActionBarSpacer />
    <Show when={props.redeem}>
      <div class="h-8" aria-hidden="true" />
    </Show>
    <BottomActionBar class="flex flex-col gap-2">
      <Show when={props.redeem}>{(r) => <RedeemSummary unit={r().unit} cost={r().cost} balance={r().balance} />}</Show>
      {props.children}
    </BottomActionBar>
  </>
);
