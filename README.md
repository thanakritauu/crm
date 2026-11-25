# Charmiss Club — Clickable Prototype

Prototype แบบคลิกได้ของ **Charmiss Club** (https://club.charmiss.co/charmiss/home) สร้างใหม่จากเว็บที่ live อยู่ (ไม่มี repo ต้นฉบับ)
ใช้ framework, CSS และไลบรารี UI ชุดเดียวกับต้นฉบับ เพื่อให้ dev หยิบ component/หน้าไปใช้ต่อได้โดยไม่ต้องแปลงภาษา
ทุกส่วนที่ต้องใช้ backend (ล็อกอิน LINE, OTP, แลกรางวัล, ฟอร์ม) เป็น **ข้อมูลจำลอง**

## เริ่มใช้งาน

ต้องใช้ Node.js 20 ขึ้นไป

```bash
npm install
```

```bash
npm run dev
```

เปิด http://localhost:3000

| URL | คืออะไร |
|---|---|
| `/` | เปิดแอป → หน้าเข้าสู่ระบบ (`/charmiss/landing`) |
| `/charmiss/home` | หน้าแรกสมาชิก |
| `/prototype` | หน้ารวม prototype — ลิงก์ไปทุกหน้า |
| `/styleguide` | Design System (ยึด Figma) ที่ใช้ component จริง · ตรวจโค้ดด้วย `npm run lint:ds` |
| `/docs` | เอกสาร (README และ `docs/*.md`) |

ปุ่มกลมสีน้ำเงินเข้มมุมขวาล่าง = **เมนู prototype**: กระโดดไปหน้าใดก็ได้, เปิด/ปิด "กรอบมือถือ", รีเซ็ตข้อมูลจำลอง

### ขนาดหน้าจอ
แอปเป็น mobile first และแสดงเต็มความกว้างจอทุกขนาดเหมือนต้นฉบับ (เน้นใช้งานใน LINE)
ถ้าจะนำเสนอบนจอคอม ให้เปิด "แสดงในกรอบมือถือ" ในเมนู prototype จะแสดงในกรอบกว้าง 480px กลางจอ (จำค่าไว้ในเบราว์เซอร์)

### คำสั่งอื่น
| คำสั่ง | ใช้ทำอะไร |
|---|---|
| `npm run build` | build สำหรับ production (ผลลัพธ์ที่ `.output/`) |
| `npm run start` | รันผลลัพธ์จาก build (หรือ `node .output/server/index.mjs`) |
| `npm run typecheck` | ตรวจ TypeScript |

> **ข้อควรรู้:** ใน `npm run dev` ถ้าสร้างไฟล์ `.tsx` ใหม่แล้ว class Tailwind ใหม่ไม่ทำงาน ให้หยุดแล้วรัน `npm run dev` ใหม่ (vinxi ไม่ตรวจไฟล์ใหม่ให้ Tailwind)

## Stack (ตรงกับต้นฉบับ)

| | ต้นฉบับ | Prototype |
|---|---|---|
| Framework | SolidStart (vinxi) + TypeScript | `@solidjs/start` 1.5, `solid-js` 1.9, `@solidjs/router` 0.15 |
| CSS | Tailwind CSS v3 (arbitrary values เยอะ) | `tailwindcss` 3.4 + `tailwindcss-animate` |
| UI primitives | Kobalte | `@kobalte/core` 0.13 (ต้นฉบับน่าจะเป็นรุ่นก่อน 0.13 — prototype ไม่ใช้ `As`/`asChild`) |
| Variant / class | cva + clsx + tailwind-merge (`cn`) | เหมือนกัน |
| ไอคอน | solid-icons | `solid-icons` |
| ฟอนต์ | IBM Plex Sans Thai | ไฟล์เดียวกัน (`public/fonts`) |
| i18n | dictionary คีย์แบน (`common.*`, `mission.*` …) | `src/i18n/th.json` — 789 คีย์ ดึงจากเว็บจริง |
| HTTP / วันที่ | axios, moment-timezone | ไม่ใช้ (ข้อมูลจำลอง, ใช้ `Intl`) |

## โครงสร้างโฟลเดอร์

```
src/
  app.tsx                  Router + Meta + I18nProvider + ThemeProvider (+ MobileFrame/PrototypeNav)
  app.css                  Tailwind, @font-face, CSS variables (:root ตามต้นฉบับ)
  entry-client.tsx / entry-server.tsx
  routes/
    index.tsx              / → redirect ไปหน้าเข้าสู่ระบบ
    prototype.tsx          หน้ารวม prototype            ← เฉพาะ prototype
    docs/                  หน้าเอกสาร /docs             ← เฉพาะ prototype
    styleguide.tsx         style guide                  ← เฉพาะ prototype
    [...404].tsx           หน้าไม่พบ (ข้อความตามต้นฉบับ)
    [id]/…                 หน้าของแอป — [id] = partner (เช่น charmiss) · ผังหน้าดู docs/04-sitemap.md
  views/                   เนื้อหาหน้าที่ route สลับใช้ (รายละเอียด/สรุปการแลก, แคตตาล็อก, กรอกเลข)
  components/
    ui/                    button, input (Label/Input/FieldError/Alert), checkbox, dialog, alert-dialog,
                           badge, progress, skeleton, empty-data, tabs, cover-image, page-loading
    layout/                navigation-topbar, brand-header, bottom-nav, bottom-action-bar,
                           page-header, mobile-frame
    home/ mission/ reward/ coupon/ privilege/ account/ history/ platform/   component แยกตามโดเมน
  lib/
    utils.ts               cn, formatNumber, formatDate (พ.ศ.), daysLeft, delay
    i18n.tsx               I18nProvider + useI18n().t("key", { param })
    theme.tsx              ThemeProvider (สีตาม partner → CSS variable), usePartnerPath()
    session.ts             store จำลองของผู้ใช้ + actions (แลกรางวัล, แลกคูปอง, เพิ่มคะแนน ฯลฯ)
  services/                ชั้นดึงข้อมูล — ตอนนี้คืนข้อมูลจำลอง (ดู "ต่อ backend จริง")
  mocks/                   ข้อมูลจำลอง (ลูกค้า, ภารกิจ, รางวัล, คูปอง, สิทธิพิเศษ, ประวัติ, แพลตฟอร์ม, ธีม, นโยบาย)
  prototype/               รายการหน้า + เมนู prototype     ← เฉพาะ prototype
  i18n/th.json
public/fonts, public/images
docs/                      เอกสารแต่ละช่วงงาน (ดูด้านล่าง)
```

## ธีมและสี
แอปรองรับหลายแบรนด์: path segment แรก (`/charmiss/...`) คือ partner
`ThemeProvider` อ่านธีมจาก `src/mocks/theme.ts` (ต้นฉบับ: `GET /api/theme?partner=…`) แล้วตั้ง CSS variable
`--primary-base / -light / -dark`, `--secondary-*`, `--teriary-*` → ใช้ผ่าน class `bg-primary`, `text-primary-light`, `bg-teriary` …
(ชื่อ `teriary` สะกดตามต้นฉบับโดยตั้งใจ)

## ข้อมูลจำลองและสถานะ
- สถานะผู้ใช้อยู่ใน `src/lib/session.ts` (+ `services/mission-service.ts`, `services/history-service.ts`, `mocks/platforms.ts`) และบันทึกใน `localStorage` เพื่อให้คลิกต่อเนื่องได้ เช่น แลกของแล้วคะแนนลดและขึ้นในประวัติ
- รีเซ็ตได้จากเมนู prototype → "รีเซ็ตข้อมูลจำลอง"
- OTP: กรอกเลขใดก็ได้ 6 หลัก (`000000` = จำลอง error)
- เชื่อมแพลตฟอร์ม: เลขคำสั่งซื้อสั้นกว่า 6 ตัว = ไม่พบ, ขึ้นต้นด้วย `X` = ตอบผิด
- รูปภารกิจ/รางวัล/คูปอง/สิทธิพิเศษใช้รูปจริงจากภารกิจของ Charmiss Club (`public/images/missions`, ดาวน์โหลด 18 พ.ย. 2569) เป็นตัวอย่าง; ถ้าไม่มีรูปจะเป็นภาพไล่สี (`CoverImage`)

## ต่อ backend จริง
1. แก้ไฟล์ใน `src/services/*` ให้เรียก API จริง (ต้นฉบับใช้ axios) แทนการอ่าน `mocks/*`
2. ย้าย action ใน `lib/session.ts` ไปเรียก API แล้วอัปเดต store จากผลลัพธ์
3. `ThemeProvider` เปลี่ยนเป็นโหลด `/api/theme` (ต้นฉบับโหลดแบบ async)
4. เพิ่มการตรวจล็อกอิน: ต้นฉบับ redirect หน้า member ไป `/:partner/landing` ถ้ายังไม่ล็อกอิน (prototype เปิดได้ทุกหน้า)
5. ส่งฟิลด์ `image` จาก API ให้ `CoverImage` (รองรับ `src` อยู่แล้ว)

## สิ่งที่มีเฉพาะ prototype (ลบได้เมื่อนำไปใช้)
- `src/components/layout/mobile-frame.tsx` + utility `.fixed-frame` ใน `app.css` — ค่าเริ่มต้นเต็มจอเหมือนต้นฉบับ (`fixed left-0 w-full`) และมีโหมดกรอบมือถือ 480px สำหรับนำเสนอ
- `src/prototype/*` และ `routes/prototype.tsx`, `routes/styleguide.tsx`, `routes/docs/*`, `lib/docs.ts`
- `src/mocks/*`, `localStorage` persistence ใน store

## เอกสาร
| ไฟล์ | เนื้อหา |
|---|---|
| [docs/01-tech-stack-and-sitemap.md](docs/01-tech-stack-and-sitemap.md) | tech stack ที่ตรวจพบ + sitemap ทั้งหมดของต้นฉบับ |
| [docs/04-sitemap.md](docs/04-sitemap.md) | sitemap ใหม่ของ prototype (ปรับโครงหน้า) + URL เดิม → ใหม่ และเหตุผล |
| [docs/02-design-system.md](docs/02-design-system.md) | สี ฟอนต์ ขนาด ระยะห่าง component breakpoint |
| [docs/03-project-setup.md](docs/03-project-setup.md) | การตั้งโปรเจคและ component กลาง |
| [docs/05-changes-by-page.md](docs/05-changes-by-page.md) | **สรุปสิ่งที่เปลี่ยนจากเว็บเดิม แยกตามหน้า (สำหรับ dev)** |
| [docs/styleguide/index.html](docs/styleguide/index.html) | style guide ของเว็บเดิม (ช่วงที่ 2) เก็บไว้อ้างอิง — ใช้ `/styleguide` แทน |

## ภาษา (ไทย / English)

เปลี่ยนภาษาได้จากหน้าโปรไฟล์ → ภาษา · คำแปลอยู่ใน `src/i18n` (`th.json`, `en.json` และ `pages/*.th.json` / `*.en.json`)
เพิ่มข้อความใหม่: ใส่ key ทั้งไฟล์ `.th.json` และ `.en.json` ของส่วนนั้น แล้วเรียก `t("key")` — รายละเอียดใน `src/lib/i18n.tsx`
