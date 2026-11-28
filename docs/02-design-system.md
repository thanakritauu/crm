# Design System

ที่มา: Figma **CharmissCRM** (`g7WqHiqTtDuUjouKk5SRvW`), variables และ text styles ของหน้า Connect Platform, My Coupon, Point History, Earn Point, Profile และ Home
เว็บเดิมไม่มี design system (ใช้ค่าดิบ เช่น `text-[13px]`, `#637381`), prototype จึงยึด Figma เป็นหลักทั้งหมด

- ดูตัวอย่างจริง: **`/styleguide`** (ใช้ component จริงของโปรเจกต์)
- **Single source of truth:** ค่าทั้งหมดอยู่ใน `tailwind.config.cjs` ที่เดียว; สีธีม partner อยู่ใน `src/app.css` (ค่าเริ่มต้น) และ `src/lib/theme.tsx`
  - plugin ใน config สร้าง CSS variable `--color-<token>` จาก token สีคงที่ให้อัตโนมัติ (เช่น `--color-dark`, `--color-stroke`) สำหรับ CSS ที่ไม่ใช่ Tailwind / inline style
  - ใน `.css` ใช้ `theme("colors.dark")`, `theme("spacing.4")` ฯลฯ · ใน TSX ใช้ class · ห้ามเขียน hex/px ซ้ำ
  - ไม่มีชุดตัวแปร HSL ของ solid-ui (`--background`, `--foreground` …) แล้ว — สีข้อความพื้นฐานของ `body` = `dark`
- ตรวจโค้ด: `npm run lint:ds` (หรือ `npm run lint:ds -- <ไฟล์>`) ตรวจ `.tsx` `.ts` `.css` ใน `src` ถ้าไม่ผ่านจะบอกไฟล์ บรรทัด และ class ที่ผิด

> `docs/styleguide/index.html` เป็น style guide ของเว็บเดิมจากช่วงที่ 2 เก็บไว้อ้างอิงเท่านั้น

## 1. ตัวอักษร

ฟอนต์ IBM Plex Sans Thai, line-height 1.5 ทุกขนาด (อยู่ใน token แล้ว ไม่ต้องใส่ `leading-*`)

**กฎน้ำหนัก (กำหนดเพิ่มจาก Figma):**
- **Semibold (600) = หัวข้อ** ชื่อหน้า หัวข้อ section/การ์ด/modal ชื่อรายการ ข้อความปุ่ม ตัวเลขเน้น (`font-semibold`)
- **Medium (500) = แท็บ, badge, ป้ายกำกับฟอร์ม** รวมถึงชื่อเมนูและชื่อปุ่มแบบแผ่น (`font-medium`)
- **Regular (400) = ข้อความทั่วไป** วันที่ เงื่อนไข ข้อความในกล่องข้อมูล ค่าในช่องกรอก — เป็นน้ำหนักพื้นฐานที่ `body` ไม่ต้องใส่ class
- **ห้ามใช้ Bold** — Tailwind ไม่มี `font-bold` แล้ว, `<b>` `<strong>` เป็น 600, จุดที่ Figma ใช้ Bold ให้ใช้ Semibold

| ขนาด / น้ำหนัก | Class | ใช้กับ |
|---|---|---|
| 24 / Semibold | `text-24 font-semibold` | ตัวเลขคะแนนบนการ์ดสมาชิก, หัวข้อใหญ่ |
| 18 / Semibold | `text-18 font-semibold` | ชื่อหน้า, หัวข้อ modal, หัวข้อ section |
| 16 / Semibold | `text-16 font-semibold` | ข้อความปุ่ม lg, หัวข้อการ์ด, หัวข้อ sheet |
| 16 / Medium | `text-16 font-medium` | ป้ายกำกับฟอร์ม |
| 14 / Semibold | `text-14 font-semibold` | ชื่อรายการ, ชื่อสินค้า, ตัวเลขเน้น, ปุ่ม md/sm |
| 14 / Medium | `text-14 font-medium` | แท็บ, ชื่อเมนู, ชื่อปุ่มแบบแผ่น |
| 14 / Regular | `text-14` | ข้อความทั่วไป, กล่องข้อมูล, เงื่อนไข, ค่าในช่องกรอก |
| 12 / Medium | `text-12 font-medium` | badge, ป้ายสถานะ, ชื่อในแถบเมนูล่าง |
| 12 / Regular | `text-12` | วันที่, คำอธิบาย, ข้อความแจ้งข้อผิดพลาด |

ห้ามใช้: `text-[13px]`, `text-sm`, `font-bold`, `font-[800]`, `leading-snug` ฯลฯ (lint จะแจ้ง)

## 2. สี

ไม่มีพาเลตต์ Tailwind เริ่มต้น (`gray-200`, `red-500` จะไม่ทำงาน) ใช้ชื่อ token ด้านล่างกับ `text-` `bg-` `border-` ได้ทุกตัว

| Figma | Token | ค่า |
|---|---|---|
| Text/Black | `dark` | `#1E3146` |
| Text/Gray | `gray` | `#5A6A85` |
| Text/Disable | `gray-disable` | `#909BAD` |
| Text/Placeholder | `gray-placeholder` | `#B3BAC7` |
| Text/White · Background/White | `white` | `#FFFFFF` |
| Stroke/Gray | `stroke` | `#EFF0F3` |
| ขอบช่องกรอก | `stroke-strong` | `#D2D8E0` |
| Surface/Gray | `surface-gray` | `#EFF0F3` |
| Brand/Pink · Text/Pink | `primary` | `var(--primary-base)` = `#F1336E` |
| PinkCharmiss-400 / 300 | `primary-400` / `primary-300` | `#F45C8B` / `#F6769E` |
| Surface/Pink · PinkCharmiss-50 | `primary-surface` | `#FEEBF1` |
| Brand/Purple | `secondary` | `var(--secondary-base)` = `#7650FF` |
| ม่วงอ่อน (แท็บที่เลือก, InfoBox) | `secondary-surface` | `#F1EEFF` |
| Yellow-500 | `teriary` / `warning` | `#FF9300` |
| Yellow-50 | `warning-surface` | `#FFF4E6` |
| System/Green | `success` / `success-surface` | `#00C763` / `#DAF8E6` |
| System/Red | `error` / `error-surface` | `#F23030` / `#FEEAEA` |
| Surface/Op20, Op30 White | `white/20`, `white/30` | |
| overlay | `black/50` | ใช้กับฉากหลัง modal เท่านั้น |
| สีแพลตฟอร์ม | `platform-line`, `platform-tiktok`, `platform-tiktok-dark`, `platform-shopee(-light)`, `platform-lazada` | ใช้กับปุ่ม/โลโก้ของแพลตฟอร์มนั้นเท่านั้น |
| เหรียญอันดับ | `medal-gold`, `medal-silver`, `medal-bronze` | ใช้ในหน้า leaderboard เท่านั้น |

**ธีมหลาย partner:** `primary*`, `secondary*`, `teriary*` เป็น CSS variable ที่ `ThemeProvider` เขียนทับตาม partner
เฉด `-surface`, `-300`, `-400` คำนวณจากสีหลักด้วย `color-mix` จึงเปลี่ยนตามธีมอัตโนมัติ

## 3. ระยะห่าง (ฐาน 8)

| px | Class | ใช้กับ |
|---|---|---|
| 4 | `…-1` | ช่องแคบภายในเท่านั้น: ไอคอน↔ข้อความ, ป้าย↔ช่องกรอก, หัวข้อ↔คำอธิบาย |
| 8 | `…-2` | ระยะในกลุ่ม, ปุ่มคู่ |
| 16 | `…-4` | padding หน้า (`px-4`), padding การ์ด, ระยะระหว่างรายการ |
| 24 | `…-6` | padding modal/sheet, ระยะระหว่าง section |
| 32, 40, 48 … | `…-8`, `…-10`, `…-12` | ระยะใหญ่ |

ไม่ใช้ 2, 6, 10, 12, 14, 20px (lint จะแจ้ง)

**ความสูงของ control:** ปุ่ม 48 / 40 / 32 · ช่องกรอก 48 · แท็บ 40 · ไอคอนวงกลมใน modal 48

## 4. มุมโค้งและเงา

| px | Class | ใช้กับ |
|---|---|---|
| 8 | `rounded-lg` | รูปตัวอย่างขนาดเล็ก |
| 12 | `rounded-xl` | ช่องกรอก |
| 16 | `rounded-2xl` | การ์ด, InfoBox |
| 24 | `rounded-3xl` | modal, sheet, ขอบล่าง header สีชมพู, การ์ดสมาชิก |
| แคปซูล | `rounded-full` | ปุ่ม, แท็บ, badge |

- **กฎ (DSL): การ์ดใช้เฉพาะสิ่งที่กดได้** (28 พ.ย. 2569) — ส่วนที่เป็นข้อมูล (ความคืบหน้า, สรุปยอด, รายการสิทธิประโยชน์, อันดับ) = พื้นเรียบ + เส้นคั่น `border-stroke` · กล่องคำแนะนำไม่เกิน 1 กล่องต่อหน้า และไม่ใส่ถ้าชื่อหน้า/ช่องกรอก/ปุ่มบอกครบแล้ว
- **กฎ (DSL): หัวหน้า 3 แบบ ตามประเภทหน้า** (28 พ.ย. 2569)
  - **หัวชมพู ชื่อกึ่งกลาง** (`PageHeader tone="primary" align="center"`) = หน้าหลัก/หน้ารายการ (แท็บเมนูล่าง, ประวัติ, คูปองของฉัน, แจ้งเตือน, เชื่อมต่อแพลตฟอร์ม, ระดับสมาชิก) · มียอดคะแนน/คอยน์ใต้ชื่อได้
  - **หัวขาว ชื่อชิดซ้าย** = หน้าทำรายการ/ฟอร์ม/รายละเอียด/ข้อความยาว (กรอกเลขใบเสร็จ, ที่อยู่, สรุปก่อนแลก, ตอบคำถาม, นโยบาย) และหน้ารายละเอียดที่มีรูปปก
  - **หัวชมพูสูงแบบ hero** = เฉพาะขั้นตอนสมัคร/เข้าสู่ระบบ
- **รายการ (ActivityRow)**: ชื่อรายการตัวปกติ ตัวเลขด้านขวาเด่น · แจ้งเตือนที่ยังไม่อ่าน = ตัวหนา
- **กฎ (DSL): บทบาทสี — แต่ละสีมีหน้าที่เดียว** (28 พ.ย. 2569)
  - **ชมพู (หลัก)** = สิ่งที่กดเพื่อทำรายการ + ยอดคะแนน: ปุ่ม, ลิงก์, เมนูล่างที่เลือก, ตัวเลขคะแนน, หัวหน้าชมพู
  - **ม่วง (รอง)** = นำทาง/ข้อมูล (ส่วนใหญ่เป็นพื้นอ่อน + ไอคอน/ตัวม่วง): กล่องคำแนะนำ, วงไอคอนทางลัด/ช่องทาง, แท็บด้านบนที่เลือก, วงเลขขั้นตอน, ไอคอนหน้าแถวรายการ
  - **เหลืองส้ม** = คอยน์ · **เขียว** = สำเร็จ/เชื่อมแล้ว · **แดง** = แจ้งเตือน/ป้ายเด่น · **เทา** = สถานะทั่วไป (ป้าย "ยังไม่เริ่ม", "ค่าเริ่มต้น")
  - ห้ามผสม: พื้นอ่อนสีหนึ่งกับตัว/ไอคอนอีกสี (`lint:ds` ตรวจ ม่วงอ่อน+ชมพู / ชมพูอ่อน+ม่วง)
- **กฎ (DSL): ไอคอนใน popup = วงกลมพื้นสีอ่อน + ไอคอนสีเข้มของสีเดียวกัน** — `warning` = พื้นเหลืองอ่อน (`bg-warning-surface`) + ไอคอนเหลือง (`text-warning`) เช่น "คอยน์ไม่พอ" · `success` เขียวอ่อน/เขียว · `error` แดงอ่อน/แดง · `primary` ชมพูอ่อน/ชมพู · ห้ามผสมสี (เช่น ไอคอนม่วงบนพื้นเหลือง) — ModalBody ใส่สีไอคอนตาม tone ให้อัตโนมัติ (27 พ.ย. 2569)
  - **บังคับใช้**: สีมาจาก `tone` ของ modal ที่เดียว (`ResultModal` variant · `AlertDialog` / `ConfirmModal` prop `tone`) — ไอคอนที่ส่งผ่าน `icon={…}` **ห้ามใส่ class สีเอง** (`npm run lint:ds` แจ้ง error) · ยืนยันการกระทำที่ย้อนไม่ได้/เตือน (ยกเลิกเชื่อมต่อ, ทิ้งการแก้ไข) = `warning` · รูปเหรียญคอยน์ (สีเหลือง) = `warning` · ไม่ระบุ = `primary`
- **กฎ (DSL): ป้ายตัวเลขบนไอคอน = `CountBadge`** — วงกลม 20×20 ขอบขาว ตัวขาว 12/Medium (เกิน 9 = "9+") วางมุมขวาบน (`absolute -right-1 -top-1`) · แดง = แจ้งเตือน/คูปองที่ใช้ได้ · **เขียว = แพลตฟอร์มที่เชื่อมต่อแล้ว "1/4"** (ข้อความยาวกว่า 1 ตัว = แคปซูลสูง 20 กว้างตามข้อความ) (26 พ.ย. 2569)
  - ป้าย "x/4" เชื่อมต่อแพลตฟอร์ม: ยังไม่ครบ (0/4–3/4) = **แดง + เด้งเบาๆ** · ครบ 4/4 = **เขียว ไม่เด้ง** (28 พ.ย. 2569)
- **กฎ (DSL): ป้ายเด่น/โปรโมชัน ใช้สีแดง ไม่ใช้ชมพูแบรนด์** (ชมพู = ปุ่ม/การกระทำ) · 12/Medium (28 พ.ย. 2569)
  - ป้ายมุมการ์ด (เช่น "แนะนำ") = **แดงทึบ `bg-error` ตัวขาว**
  - ป้ายในบรรทัด/ต่อท้ายชื่อ (เช่น "รับคะแนน x10") = **พื้นแดงอ่อน `bg-error-surface` ตัวแดงเข้ม `text-error`**
- **กฎ (DSL): ตัวเลขความคืบหน้า (เช่น "0/3", "2/5 ครั้ง") และตัวเลขในแถบสถานะภารกิจ (เช่น "+20 คอยน์") เป็นสีดำ `text-dark` ทั้งหมด** — สีส้ม/ชมพูใช้กับแถบความคืบหน้าและไอคอนเท่านั้น (26 พ.ย. 2569)
- **กฎ (DSL): พื้นหลังสีชมพูเต็มความกว้างด้านบนหน้า ต้องโค้งมุมล่างซ้าย-ขวา `rounded-b-3xl` (24px) เสมอ** — `PageHeader tone="primary"`, หัวหน้าโปรไฟล์, พื้นชมพูเข้มหน้าแรก, BrandHeader · ห้ามเป็นมุมเหลี่ยม (26 พ.ย. 2569)
- `shadow-card` = Figma effect "Card" (`0 2px 12px rgba(90,106,133,.1)`) ใช้กับการ์ดและแถบแท็บ
- `drop-shadow-card` ใช้กับรูปทรงที่มีรอยบาก (คูปอง)
- `bg-brand-fade` = ไล่สีชมพู 15% ด้านบนหน้าแรก
- `shadow-scan-mask` = พื้นดำ 30% รอบกรอบสแกน QR (Figma "scan overlay")

## 4.1 ชั้น (z-index) และขนาดคงที่

ไม่มีสเกล `z-10 … z-50` ของ Tailwind แล้ว — ใช้ชื่อชั้นตามหน้าที่ (lint จะแจ้ง `z-[…]` / `z-50`)

| Class | ค่า | ใช้กับ |
|---|---|---|
| `z-raised` | 10 | เนื้อหาที่ซ้อนทับรูป/แถบสีในหน้า |
| `z-card` | 20 | การ์ดในรายการที่อยู่เหนือพื้นตกแต่ง |
| `z-header` | 30 | `NavigationTopbar` (โปร่งใสและ sticky), header หน้าเอกสาร |
| `z-fab` | 48 | ปุ่มลอย (เมนู prototype) |
| `z-bar` | 49 | `BottomNav`, `BottomActionBar` |
| `z-modal` | 50 | modal / dialog / sheet (ผ่าน `components/ui/overlay.ts`) |
| `z-toast` | 60 | toast แจ้งผล |
| `z-devtools` | 70 | เมนู prototype |
| `z-fullscreen` | 999 | กล้องสแกน QR |
| `z-loading` | 9999 | `PageLoading` |

| Class | ค่า | ใช้กับ |
|---|---|---|
| `w-modal` | 343px | กรอบ modal / dialog |
| `max-w-mobile` | 375px | คอลัมน์เนื้อหาขนาดจอ Figma |
| `max-w-tool` | 960px | `/prototype`, `/qr`, `/styleguide` |
| `max-w-docs` | 1100px | `/docs` |
| `h-hero` | 200px | พื้นที่หัวของหน้า (hero) ด้านบนสุด: แถบสีชมพูขอบล่างโค้ง (register, verify-by-phone) หรือรูปหัวหน้า detail (คูปองของฉัน) — ห้ามใช้กับรูป/กล่องกลางหน้า |
| `aspect-cover` | 1923 / 1000 | ภาพปกหน้า detail |

## 5. Component ที่ใช้ร่วมกัน

| Component | ไฟล์ | กติกา |
|---|---|---|
| `Button` | `components/ui/button.tsx` | variant: primary, secondary, outline, white, ghost, link, line, muted, error · size: lg 48, md 40, sm 32, icon, block (lg เต็มความกว้าง), dialog (คู่ปุ่มใน modal) · disabled เป็นสีเทาเอง |
| `PageHeader` | `components/layout/page-header.tsx` | chevron 24 + ชื่อหน้า 18/Semibold, p-4 gap-2 · `tone="primary"` = พื้นชมพูขอบล่างโค้ง 24 · `align="center"` · children อยู่ใต้ชื่อหน้า ห่าง 16 |
| `NavigationTopbar` | `components/layout/navigation-topbar.tsx` | ใช้เฉพาะหน้าที่หัวหน้าเพจวางบนรูปปก (โปร่งใส แล้ว sticky เมื่อเลื่อน) |
| `PillTabs` | `components/ui/pill-tabs.tsx` | แท็บแบบเดียวของแอป: แคปซูลขาว + เงา, สูง 40 (14/Medium), ที่เลือก = ม่วงอ่อน + ตัวชมพู |
| `InfoTabs` | `components/ui/info-tabs.tsx` | PillTabs + เนื้อหารายการลำดับเลข 12/Regular สำหรับหน้า detail |
| `ResultModal` / `ConfirmModal` / `AlertDialog` | `components/ui/modal.tsx` | กว้าง 343, มุม 24, padding 24, ช่องห่าง 24, ไอคอน 48, หัวข้อ 18/Semibold, ปุ่ม 48 |
| `InfoBox` | `components/ui/modal.tsx` | พื้นม่วงอ่อน มุม 16 padding 16 + ไอคอน info |
| ไอคอน (`IconBack`, `IconInfo` …) | `components/ui/icons.tsx` | Solar Icons สไตล์ Linear เท่านั้น · สีผ่าน class `text-*` · ขนาด 12/14/16/20/24/40 ผ่าน prop `size` |
| `Dialog` | `components/ui/dialog.tsx` | modal เนื้อหาอิสระ (เปลือกเดียวกับ modal) |
| `CodeDialog` | `components/coupon/code-dialog.tsx` | modal แสดงรหัสตัวเดียวของแอป (คูปองของฉัน, สิทธิพิเศษรับที่ร้าน): แท็บ QR / บาร์โค้ด / โค้ด + นับถอยหลังถึง `expiresAt` + ปุ่มกลับ |
| `Sheet` | `components/ui/sheet.tsx` | bottom sheet เดียวของแอป มุมบน 24 · `title` = หัวข้อ 16/Semibold + ปุ่มปิด |
| `Input` / `Label` / `FieldError` / `Alert` | `components/ui/input.tsx` | ช่องกรอกสูง 48 มุม 12 · ป้าย 16/Medium · error 12/Regular สีแดง |
| `fieldBox` / `selectClass` | `components/ui/input.tsx` | กรอบช่องกรอกที่ใช้ร่วมกัน · `<select>` แบบ native ใช้ `selectClass(invalid)` ให้หน้าตาเหมือน `Input` |
| `.policy-html` / `.doc-body` | `src/app.css` | ข้อความ HTML (innerHTML) — ใช้ type scale และสีจาก `theme()` |
| `Card` / `cardClass` | `components/ui/card.tsx` | พื้นขาว มุม 16 + shadow-card · element อื่น (`<A>`, `<li>`, `<button>`) ใช้ `cn(cardClass, …)` ห้ามเขียน `rounded-2xl bg-white shadow-card` เอง |
| `overlayBackdrop` / `overlayCenter` / `modalPanel` / `sheetPanel` | `components/ui/overlay.ts` | เปลือกของทุก modal/sheet (ฉากหลังดำ 50%, z-modal, กว้าง 343 มุม 24, อนิเมชันเข้า/ออก) — modal เฉพาะทาง (คูปอง, Guest vs Member, Welcome) ใช้ชุดนี้ |
| `Badge` | `components/ui/badge.tsx` | แคปซูล 12/Medium · tone: teriary, primary, secondary, success, error, gray, new |
| `EmptyData` | `components/ui/empty-data.tsx` | รูป Nodata 100 + ข้อความ 14/Semibold |
| `BottomActionBar` | `components/layout/bottom-action-bar.tsx` | แถบปุ่มด้านล่างจอ |

**รูปแบบที่ใช้ซ้ำ (ไม่มี component แยก):**
- แถวรายการ: `py-4 border-b border-stroke` · ชื่อ 14/Semi · วันที่ 12/Regular สีเทา
- หัวข้อ section ในหน้า: 16/Semibold (หรือ 18/Semibold ถ้าเป็นหัวข้อระดับหน้า) + ลิงก์ "ดูทั้งหมด" ด้านขวา
- ตัวเลขคะแนน: ได้รับ `text-success` (+), ใช้ `text-error` (−)

## 6. การเพิ่มของใหม่

1. หา component ในตารางข้อ 5 ก่อน ถ้ามีให้ใช้ ถ้าขาด variant ให้เพิ่มใน component นั้น อย่าเขียน class ซ้ำในหน้า
2. ใช้เฉพาะ token ในข้อ 1–4
3. รัน `npm run lint:ds` และ `npm run typecheck` ก่อนส่งงาน
4. ถ้า Figma มีค่าใหม่จริง ๆ ให้เพิ่มใน `tailwind.config.cjs` + ตารางนี้ + `/styleguide` พร้อมกัน
