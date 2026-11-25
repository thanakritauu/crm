# ช่วงที่ 3 — โครงโปรเจคและ component กลาง

## วิธีรัน
```bash
npm install
npm run dev        # http://localhost:3000
```
- `/` หน้ารวม prototype (ลิงก์ไปทุกหน้า + สถานะ)
- `/styleguide` style guide ที่ใช้ component จริง
- `/charmiss/...` หน้าของแอป (ช่วงที่ 4)

## Stack (ตรงกับต้นฉบับ)
| | เวอร์ชัน |
|---|---|
| SolidStart (vinxi) | 1.5 |
| @solidjs/router | 0.15 |
| solid-js | 1.9 |
| Tailwind CSS | 3.4 + tailwindcss-animate |
| Kobalte | 0.13 |
| cva / clsx / tailwind-merge | 0.7 / 2.1 / 2.6 |

ต้นฉบับน่าจะใช้ Kobalte รุ่นก่อน 0.13 (ยังมี component `As`) ส่วน prototype ใช้ 0.13 ซึ่งเป็นรุ่นปัจจุบัน และไม่ได้ใช้ `As`/`asChild` เลย จึงย้ายโค้ดกลับได้ไม่ติดปัญหา

## โครงสร้าง
```
src/
  app.tsx                 Router + MetaProvider + I18nProvider + ThemeProvider
  app.css                 Tailwind + ฟอนต์ + CSS variable (:root ตามต้นฉบับ)
  routes/                 file-based routing แบบเดียวกับต้นฉบับ
    [id]/                 [id] = partner (เช่น charmiss) — ตั้งชื่อตามต้นฉบับ
    index.tsx             หน้ารวม prototype
    styleguide.tsx
    [...404].tsx
  components/
    ui/                   button, input (Label/Input/FieldError/Alert), checkbox, dialog,
                          alert-dialog, badge, progress, skeleton, empty-data, tabs
    layout/               navigation-topbar, brand-header (BrandHeader/PageTitleHeader),
                          bottom-action-bar (footer), page-header, mobile-frame
  lib/                    utils (cn), i18n, theme
  i18n/th.json            ข้อความภาษาไทย 789 คีย์ ดึงจากเว็บจริง
  services/               ชั้นเรียกข้อมูล (ตอนนี้คืน mock) — ตั้งชื่อตาม service ของต้นฉบับ
  mocks/                  ข้อมูลจำลอง
  prototype/              ของเฉพาะ prototype (รายการหน้า, เมนูลอย) — ลบได้เมื่อใช้จริง
public/fonts, public/images
```

## จุดที่ต่างจากต้นฉบับ (จะสรุปรวมในช่วงที่ 5)
- กรอบมือถือ 480px บนจอใหญ่ (`MobileFrame`) และ utility `.fixed-frame` สำหรับ element ที่ fixed
- ปุ่มลอยเมนู prototype และหน้า `/`, `/styleguide`
- `Button` มี variant ของแอปเพิ่ม (brand, brand-soft, line, chip, muted)
- ThemeProvider อ่านธีมจาก mock แบบ sync แทนการเรียก `/api/theme`
