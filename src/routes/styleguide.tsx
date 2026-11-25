import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { createSignal, For, onMount, type JSX, type ParentComponent } from "solid-js";
import { PageHeader } from "~/components/layout/page-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Dialog } from "~/components/ui/dialog";
import { EmptyData } from "~/components/ui/empty-data";
import { InfoTabs } from "~/components/ui/info-tabs";
import { Alert, FieldError, Input, Label } from "~/components/ui/input";
import { AlertDialog, ConfirmModal, InfoBox, ResultModal } from "~/components/ui/modal";
import { PillTabs } from "~/components/ui/pill-tabs";
import { Progress } from "~/components/ui/progress";
import { Sheet } from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import { IconTicket } from "~/components/ui/icons";

/**
 * /styleguide — Design System ของ prototype (อ้างอิง Figma "CharmissCRM")
 * ทุกตัวอย่างใช้ token และ component จริงของโปรเจกต์ · กติกาเต็มอยู่ที่ docs/02-design-system.md
 */

const Section: ParentComponent<{ id: string; title: string; note?: string }> = (props) => (
  <section id={props.id} class="scroll-mt-4">
    <Card class="p-6">
      <h2 class="text-18 font-semibold text-dark">{props.title}</h2>
      {props.note && <p class="mt-1 text-12 text-gray">{props.note}</p>}
      <div class="mt-4">{props.children}</div>
    </Card>
  </section>
);

const Code = (props: { children: string }) => <code class="break-all font-mono text-12 text-gray">{props.children}</code>;

const Phone: ParentComponent = (props) => (
  <div class="w-[375px] max-w-full overflow-hidden rounded-3xl border border-stroke bg-white">{props.children}</div>
);

const TYPE: [string, string, string][] = [
  ["24 / Semibold", "text-24 font-semibold", "1,250 คะแนน"],
  ["18 / Semibold", "text-18 font-semibold", "ชื่อหน้า · หัวข้อ section · หัวข้อ modal"],
  ["16 / Semibold", "text-16 font-semibold", "ข้อความปุ่ม · หัวข้อการ์ด"],
  ["16 / Medium", "text-16 font-medium", "ป้ายกำกับฟอร์ม"],
  ["14 / Semibold", "text-14 font-semibold", "ชื่อรายการ · ชื่อสินค้า · ตัวเลขเน้น"],
  ["14 / Medium", "text-14 font-medium", "แท็บ · ชื่อเมนู · ชื่อปุ่มแบบแผ่น"],
  ["14 / Regular (พื้นฐาน)", "text-14", "ข้อความทั่วไป ข้อความในกล่องข้อมูล เงื่อนไข"],
  ["12 / Medium", "text-12 font-medium", "badge · ป้ายสถานะ"],
  ["12 / Regular (พื้นฐาน)", "text-12", "วันที่ · คำอธิบาย · ข้อความแจ้งข้อผิดพลาด"],
];

/**
 * สีทั้งหมดอ่านค่าจริงจาก CSS variable ตอนแสดงผล (ค่าอยู่ที่ tailwind.config.cjs ที่เดียว)
 * สีคงที่ = --color-<token> (สร้างโดย plugin ใน config) · สีแบรนด์ = ตัวแปรธีม partner
 */
const BRAND_VAR: Record<string, string> = {
  primary: "--primary-base",
  "primary-400": "--primary-400",
  "primary-300": "--primary-300",
  "primary-surface": "--primary-surface",
  secondary: "--secondary-base",
  "secondary-surface": "--secondary-surface",
  teriary: "--teriary-base",
};
const cssVarOf = (token: string) => BRAND_VAR[token] ?? `--color-${token}`;

const COLORS: { group: string; items: [string, string][] }[] = [
  {
    group: "Text",
    items: [
      ["Text/Black", "dark"],
      ["Text/Gray", "gray"],
      ["Text/Disable", "gray-disable"],
      ["Text/Placeholder", "gray-placeholder"],
      ["Text/White", "white"],
    ],
  },
  {
    group: "Brand (ธีม partner)",
    items: [
      ["Brand/Pink", "primary"],
      ["PinkCharmiss-400", "primary-400"],
      ["PinkCharmiss-300", "primary-300"],
      ["Surface/Pink", "primary-surface"],
      ["Brand/Purple", "secondary"],
      ["Surface ม่วงอ่อน", "secondary-surface"],
      ["Yellow-500", "teriary"],
    ],
  },
  {
    group: "Stroke / Surface",
    items: [
      ["Stroke/Gray", "stroke"],
      ["ขอบช่องกรอก", "stroke-strong"],
      ["Surface/Gray", "surface-gray"],
      ["Background/White", "white"],
    ],
  },
  {
    group: "System",
    items: [
      ["System/Green", "success"],
      ["Green surface", "success-surface"],
      ["System/Red", "error"],
      ["Red surface", "error-surface"],
      ["Yellow-500", "warning"],
      ["Yellow-50", "warning-surface"],
    ],
  },
  {
    group: "เฉพาะจุด (ใช้ได้เฉพาะที่ระบุ)",
    items: [
      ["เหรียญทอง (leaderboard)", "medal-gold"],
      ["เหรียญเงิน", "medal-silver"],
      ["เหรียญทองแดง", "medal-bronze"],
      ["LINE", "platform-line"],
      ["Shopee", "platform-shopee"],
      ["Lazada", "platform-lazada"],
      ["TikTok", "platform-tiktok"],
    ],
  },
];

/** ชั้น z-index (ล่าง → บน) และขนาดคงที่จาก Figma */
const LAYERS: [string, string][] = [
  ["z-raised", "10"],
  ["z-card", "20"],
  ["z-header", "30"],
  ["z-fab", "48"],
  ["z-bar", "49"],
  ["z-modal", "50"],
  ["z-toast", "60"],
  ["z-devtools", "70"],
  ["z-fullscreen", "999"],
  ["z-loading", "9999"],
];
const SIZES: [string, string][] = [
  ["w-modal", "343px · modal / dialog"],
  ["max-w-mobile", "375px · คอลัมน์เนื้อหาบนจอใหญ่"],
  ["max-w-tool", "960px · หน้าเครื่องมือ prototype"],
  ["max-w-docs", "1100px · หน้าเอกสาร"],
  ["h-hero", "200px · พื้นที่หัวของหน้า (แถบสี / รูปหัว)"],
  ["aspect-cover", "1923 / 1000 · ภาพปกหน้า detail"],
];

const SPACING: [string, string][] = [
  ["4", "1"],
  ["8", "2"],
  ["16", "4"],
  ["24", "6"],
  ["32", "8"],
  ["40", "10"],
  ["48", "12"],
];

const RADIUS: [string, string][] = [
  ["8", "rounded-lg"],
  ["12", "rounded-xl"],
  ["16", "rounded-2xl"],
  ["24", "rounded-3xl"],
  ["แคปซูล", "rounded-full"],
];

const NAV: [string, string][] = [
  ["type", "ตัวอักษร"],
  ["color", "สี"],
  ["space", "ระยะห่าง · มุม · เงา"],
  ["button", "ปุ่ม"],
  ["form", "ฟอร์ม"],
  ["tabs", "แท็บ"],
  ["header", "หัวหน้าเพจ"],
  ["content", "การ์ด · ป้าย · สถานะ"],
  ["overlay", "Modal · Sheet"],
];

export default function StyleGuide() {
  const [tab, setTab] = createSignal("received");
  const [agree, setAgree] = createSignal(true);
  const [open, setOpen] = createSignal<null | "success" | "error" | "confirm" | "alert" | "dialog" | "sheet">(null);
  const is = (k: NonNullable<ReturnType<typeof open>>) => open() === k;
  const close = (o: boolean) => !o && setOpen(null);
  let root!: HTMLElement;
  const [resolved, setResolved] = createSignal<Record<string, string>>({});
  onMount(() => {
    const cs = getComputedStyle(root);
    const out: Record<string, string> = {};
    for (const g of COLORS) for (const [, token] of g.items) out[token] = cs.getPropertyValue(cssVarOf(token)).trim();
    setResolved(out);
  });

  return (
    <main ref={root} class="min-h-screen bg-surface-gray">
      <Title>Style guide · Charmiss prototype</Title>
      <div class="mx-auto flex max-w-tool flex-col gap-6 px-4 py-8">
        <header class="flex flex-col gap-2">
          <A href="/prototype" class="text-14 font-semibold text-primary">
            ← กลับเมนู prototype
          </A>
          <h1 class="text-24 font-semibold text-dark">Design System</h1>
          <p class="text-14 text-gray">
            อ้างอิง Figma “CharmissCRM” · ฟอนต์ IBM Plex Sans Thai · line-height 1.5 · ระยะห่างฐาน 8 · ตรวจโค้ดด้วย <Code>npm run lint:ds</Code>
          </p>
          <nav class="flex flex-wrap gap-2 pt-2">
            <For each={NAV}>
              {([id, label]) => (
                <a href={`#${id}`} class="rounded-full bg-white px-4 py-1 text-12 font-semibold text-dark shadow-card">
                  {label}
                </a>
              )}
            </For>
          </nav>
        </header>

        <Section id="type" title="1. ตัวอักษร" note="Semibold = หัวข้อ · Medium = แท็บ, badge, ป้ายกำกับ · Regular = ข้อความทั่วไป (พื้นฐาน ไม่ต้องใส่ class) · ห้ามใช้ Bold">
          <div class="flex flex-col divide-y divide-stroke">
            <For each={TYPE}>
              {([name, cls, sample]) => (
                <div class="grid grid-cols-1 gap-1 py-4 md:grid-cols-[180px_1fr] md:gap-4">
                  <div>
                    <div class="text-12 font-semibold text-dark">{name}</div>
                    <Code>{cls}</Code>
                  </div>
                  <div class={`${cls} text-dark`}>{sample}</div>
                </div>
              )}
            </For>
          </div>
        </Section>

        <Section id="color" title="2. สี" note="ชื่อ class = ชื่อ token (text-dark, bg-primary-surface, border-stroke …) · ไม่มีพาเลตต์ Tailwind เริ่มต้น">
          <div class="flex flex-col gap-6">
            <For each={COLORS}>
              {(g) => (
                <div>
                  <h3 class="mb-2 text-14 font-semibold text-dark">{g.group}</h3>
                  <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                    <For each={g.items}>
                      {([name, token]) => (
                        <div>
                          <div class="h-12 rounded-xl border border-stroke" style={{ background: `var(${cssVarOf(token)})` }} />
                          <div class="mt-1 text-12 font-semibold text-dark">{name}</div>
                          <Code>{token}</Code>
                          <div>
                            <Code>{resolved()[token] ?? `var(${cssVarOf(token)})`}</Code>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Section>

        <Section id="space" title="3. ระยะห่าง · มุมโค้ง · เงา" note="ระยะห่างฐาน 8 · ยอม 4 เฉพาะช่องแคบภายใน (ไอคอน↔ข้อความ, ป้าย↔ช่องกรอก)">
          <div class="flex flex-col gap-6">
            <div class="flex flex-wrap items-end gap-4">
              <For each={SPACING}>
                {([px, key]) => (
                  <div class="flex flex-col items-center gap-1">
                    <div class="bg-primary-300" style={{ width: `${px}px`, height: `${px}px` }} />
                    <span class="text-12 font-semibold text-dark">{px}</span>
                    <Code>{`p-${key}`}</Code>
                  </div>
                )}
              </For>
            </div>
            <div class="flex flex-wrap gap-4">
              <For each={RADIUS}>
                {([px, cls]) => (
                  <div class="flex flex-col items-center gap-1">
                    <div class={`size-16 border-2 border-primary bg-primary-surface ${cls}`} />
                    <span class="text-12 font-semibold text-dark">{px}</span>
                    <Code>{cls}</Code>
                  </div>
                )}
              </For>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 class="mb-2 text-14 font-semibold text-dark">ชั้น (z-index) — ห้ามใช้ z-[…]</h3>
                <div class="flex flex-wrap gap-2">
                  <For each={LAYERS}>{([cls, v]) => <Code>{`${cls} = ${v}`}</Code>}</For>
                </div>
              </div>
              <div>
                <h3 class="mb-2 text-14 font-semibold text-dark">ขนาดคงที่</h3>
                <div class="flex flex-col gap-1">
                  <For each={SIZES}>{([cls, v]) => <Code>{`${cls} — ${v}`}</Code>}</For>
                </div>
              </div>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl bg-white p-4 shadow-card">
                <div class="text-14 font-semibold text-dark">shadow-card</div>
                <Code>0 2px 12px rgba(90,106,133,.1) — Figma effect “Card”</Code>
              </div>
              <div class="rounded-2xl bg-white p-4 drop-shadow-card">
                <div class="text-14 font-semibold text-dark">drop-shadow-card</div>
                <Code>รูปทรงที่มีรอยบาก เช่น คูปอง</Code>
              </div>
            </div>
          </div>
        </Section>

        <Section id="button" title="4. ปุ่ม" note="ทรงแคปซูลทั้งหมด · lg 48 (16/Semi) · md 40 (14/Semi) · sm 32 (14/Semi) · disabled เป็นสีเทาอัตโนมัติ">
          <div class="flex flex-col gap-4">
            <For each={["primary", "secondary", "outline", "line", "muted"] as const}>
              {(v) => (
                <div class="flex flex-wrap items-center gap-2">
                  <span class="w-24 text-12 font-semibold text-gray">{v}</span>
                  <Button variant={v} size="lg">
                    ปุ่ม lg
                  </Button>
                  <Button variant={v} size="md">
                    ปุ่ม md
                  </Button>
                  <Button variant={v} size="sm">
                    ปุ่ม sm
                  </Button>
                </div>
              )}
            </For>
            <div class="flex flex-wrap items-center gap-2 rounded-2xl bg-primary p-4">
              <span class="w-24 text-12 font-semibold text-white">white</span>
              <Button variant="white" size="sm">
                ดูประวัติคะแนน
              </Button>
              <Button variant="link">ลิงก์</Button>
            </div>
            <div class="flex max-w-mobile flex-col gap-2">
              <Button size="block">ปุ่มเต็มความกว้าง (block)</Button>
              <Button size="block" disabled>
                กดไม่ได้ (disabled)
              </Button>
              <div class="flex gap-2">
                <Button variant="secondary" size="dialog">
                  ยกเลิก
                </Button>
                <Button size="dialog">ยืนยัน</Button>
              </div>
            </div>
          </div>
        </Section>

        <Section id="form" title="5. ฟอร์ม" note="ช่องกรอกสูง 48 · มุม 12 · ป้าย 16/Semi ห่างช่องกรอก 4 · focus ขอบชมพู · error ขอบแดง">
          <div class="grid max-w-[720px] gap-6 md:grid-cols-2">
            <div>
              <Label required for="sg-name">
                ชื่อ
              </Label>
              <Input id="sg-name" placeholder="กรอกชื่อ" />
            </div>
            <div>
              <Label for="sg-phone">เบอร์โทรศัพท์</Label>
              <Input id="sg-phone" prefix="+66" placeholder="8X XXX XXXX" />
            </div>
            <div>
              <Label for="sg-err">อีเมล</Label>
              <Input id="sg-err" invalid value="abc@" />
              <FieldError>รูปแบบอีเมลไม่ถูกต้อง</FieldError>
            </div>
            <div>
              <Label for="sg-dis">รหัสสมาชิก</Label>
              <Input id="sg-dis" disabled value="CM-000123" />
            </div>
            <InfoBox class="md:col-span-2">กรอกเลขที่ใบเสร็จเพื่อสะสมคะแนนจากร้านค้าที่ร่วมรายการ</InfoBox>
            <Alert class="md:col-span-2" title="ผิดพลาด">ไม่สามารถบันทึกข้อมูลได้</Alert>
            <Checkbox checked={agree()} onChange={setAgree}>
              ยอมรับข้อตกลงและเงื่อนไข
            </Checkbox>
          </div>
        </Section>

        <Section id="tabs" title="6. แท็บ" note="PillTabs เป็นแท็บแบบเดียวของแอป (สูง 40, 14/Semi) · InfoTabs = PillTabs + เนื้อหารายการ">
          <div class="flex max-w-mobile flex-col gap-6">
            <PillTabs
              value={tab()}
              onChange={setTab}
              items={[
                { value: "received", label: "ได้รับ" },
                { value: "redeemed", label: "ใช้แลก" },
                { value: "expired", label: "หมดอายุ" },
              ]}
            />
            <InfoTabs
              items={[
                { value: "howto", label: "ขั้นตอน", heading: "ขั้นตอน", content: ["กดรับคูปอง", "แสดงโค้ดที่หน้าร้าน"] },
                { value: "condition", label: "เงื่อนไข", heading: "เงื่อนไข", content: ["ใช้ได้ 1 ครั้ง/ท่าน"] },
              ]}
            />
          </div>
        </Section>

        <Section id="header" title="7. หัวหน้าเพจ" note="PageHeader: chevron 24 + ชื่อหน้า 18/Semi, padding 16 · หน้าที่มีรูปปกใช้ NavigationTopbar (โปร่งใส → sticky)">
          <div class="flex flex-wrap gap-6">
            <Phone>
              <PageHeader title="กรอกเลขที่ใบเสร็จ" onBack={() => {}} />
            </Phone>
            <Phone>
              <PageHeader tone="primary" align="center" title="คะแนนทั้งหมด" onBack={() => {}}>
                <PillTabs value={tab()} onChange={setTab} items={[{ value: "received", label: "ได้รับ" }, { value: "redeemed", label: "ใช้แลก" }]} />
              </PageHeader>
            </Phone>
          </div>
        </Section>

        <Section id="content" title="8. การ์ด · ป้าย · สถานะ">
          <div class="grid gap-6 md:grid-cols-2">
            <Card class="flex flex-col gap-1 p-4">
              <div class="text-16 font-semibold text-dark">Card</div>
              <p class="text-14 text-gray">พื้นขาว มุม 16 เงา Card · padding ปกติ p-4</p>
            </Card>
            <div class="flex flex-col gap-4">
              <div class="flex flex-wrap gap-2">
                <Badge>กำลังดำเนินการ</Badge>
                <Badge tone="success">สำเร็จ</Badge>
                <Badge tone="error">หมดอายุ</Badge>
                <Badge tone="primary">ใช้ 200 คะแนน</Badge>
                <Badge tone="secondary">ม่วง</Badge>
                <Badge tone="gray">ปิดแล้ว</Badge>
                <Badge tone="new" size="sm">
                  NEW
                </Badge>
              </div>
              <Progress value={2} max={3} />
              <div class="flex items-center gap-4">
                <Skeleton class="size-12 rounded-full" />
                <div class="flex flex-1 flex-col gap-2">
                  <Skeleton class="h-4 w-2/3" />
                  <Skeleton class="h-4 w-1/3" />
                </div>
              </div>
            </div>
            <div class="list md:col-span-2">
              <For each={["คุณได้รับ 150 คะแนน จากเลขที่ใบเสร็จ", "คุณใช้ 200 คะแนน แลกคูปองส่วนลด"]}>
                {(t, i) => (
                  <div class="flex flex-col gap-1 border-b border-stroke py-4">
                    <div class="flex justify-between gap-2">
                      <span class="text-14 font-semibold text-dark">{t}</span>
                      <span class={`text-14 font-semibold ${i() ? "text-error" : "text-success"}`}>{i() ? "-200" : "+150"}</span>
                    </div>
                    <span class="text-12 text-gray">13 ธ.ค. 2568 08:30 น.</span>
                  </div>
                )}
              </For>
            </div>
            <EmptyData class="md:col-span-2" title="ยังไม่มีประวัติคะแนนในขณะนี้" />
          </div>
        </Section>

        <Section id="overlay" title="9. Modal · Sheet" note="Modal กว้าง 343 มุม 24 padding 24 · ไอคอน 48 · Sheet มุมบน 24">
          <div class="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setOpen("success")}>
              ResultModal สำเร็จ
            </Button>
            <Button size="sm" onClick={() => setOpen("error")}>
              ResultModal ไม่สำเร็จ
            </Button>
            <Button size="sm" onClick={() => setOpen("confirm")}>
              ConfirmModal
            </Button>
            <Button size="sm" onClick={() => setOpen("alert")}>
              AlertDialog
            </Button>
            <Button size="sm" onClick={() => setOpen("dialog")}>
              Dialog
            </Button>
            <Button size="sm" onClick={() => setOpen("sheet")}>
              Sheet
            </Button>
          </div>
          <ResultModal open={is("success")} onOpenChange={close} title="สะสม 150 คะแนน เรียบร้อยแล้ว" description="ดูคะแนนได้ที่เมนูประวัติคะแนน" />
          <ResultModal open={is("error")} onOpenChange={close} variant="error" title="ไม่พบเลขที่ใบเสร็จนี้ในระบบ" description="โปรดตรวจสอบ หรือลองใหม่อีกครั้ง" />
          <ConfirmModal
            open={is("confirm")}
            onOpenChange={close}
            icon={<IconTicket size={20} class="text-primary" />}
            title="ยืนยันการใช้คูปอง"
            description="คูปองจะใช้ได้ภายใน 10 นาที"
            onConfirm={() => {}}
          />
          <AlertDialog open={is("alert")} onOpenChange={close} title="ออกจากระบบ" description="ต้องการออกจากระบบใช่หรือไม่" cancelText="ยกเลิก" confirmText="ออกจากระบบ" />
          <Dialog open={is("dialog")} onOpenChange={close} title="Dialog" description="กล่องสำหรับเนื้อหาอิสระ">
            <Button size="block" onClick={() => setOpen(null)}>
              ปิด
            </Button>
          </Dialog>
          <Sheet open={is("sheet")} onOpenChange={close} title="เรียงลำดับโดย">
            <div class="flex flex-col">
              <For each={["ใหม่ล่าสุด", "คะแนนน้อยไปมาก", "คะแนนมากไปน้อย"] as JSX.Element[]}>
                {(t) => <button class="border-b border-stroke py-4 text-left text-14 text-dark">{t}</button>}
              </For>
            </div>
          </Sheet>
        </Section>
      </div>
    </main>
  );
}
