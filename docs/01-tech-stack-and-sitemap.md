# ช่วงที่ 1 — Tech stack และ Sitemap

ต้นฉบับ: https://club.charmiss.co/charmiss/home (ตรวจเมื่อ 17 พ.ย. 2026 ในฐานะผู้ใช้ทั่วไปที่ยังไม่ล็อกอิน)

## 1. Tech stack (ยืนยันจากเว็บที่ live)

| ส่วน | สิ่งที่ใช้ | หลักฐาน |
|---|---|---|
| Framework | **SolidStart** (Solid.js + Vinxi, file-based routing, SSR + hydration) | `window._$HY`, `data-hk`, ไฟล์อยู่ที่ `/_build/assets/`, `window.manifest` ชี้ไปที่ `src/routes/**/*.tsx` |
| ภาษา | TypeScript (`.tsx`) | ชื่อ route ใน manifest |
| CSS | **Tailwind CSS v3** (utility class + arbitrary values เช่น `text-[18px]`, `bg-[#FFFFFF]`) | preflight ของ Tailwind ใน `client-*.css`, class เช่น `bg-primary`, `rounded-b-lg` |
| UI primitives | **Kobalte** (`@kobalte/core`) — Dialog, AlertDialog, Tabs, Tooltip | ข้อความ error `[kobalte]: useDialogContext...` ใน bundle |
| รูปแบบ component | แบบ **solid-ui (shadcn สำหรับ Solid)**: `cva` (class-variance-authority) + `clsx` + `tailwind-merge` → ฟังก์ชัน `cn()` | `button-*.js` มีโค้ด cva/clsx, `utils-*.js` มี `conflictingClassGroups` (tailwind-merge) |
| HTTP | axios | chunk `axios-*.js` |
| วันที่ | moment + moment-timezone | chunk `moment-*.js` |
| อื่น ๆ | qr-scanner, jsQR (สแกนใบเสร็จ/QR) | chunk ชื่อเดียวกัน |
| i18n | dictionary แบบ key แบน (`common.*`, `mission.*`, `profile.*` …) ~755 คีย์ ส่งมากับ SSR, ค่าเริ่มต้นภาษาไทย มีตัวเลือกภาษา | payload ใน HTML |
| Theme | **multi-tenant**: path segment แรก (`charmiss`) = partner, ดึงสีจาก `/api/theme?partner=charmiss` แล้วใส่เป็น CSS variable | `ThemeContext-*.js` |
| Login | LINE Login (LIFF/OAuth) — หน้า member ทั้งหมด redirect ไป `/charmiss/landing` ถ้ายังไม่ล็อกอิน | ทดสอบจริง |
| ฟอนต์ | IBM Plex Sans Thai (หลัก), Kanit, Noto Sans Thai | `@font-face` ใน CSS |
| รูปแบบหน้าจอ | Mobile-first (LINE in-app browser), viewport `user-scalable=no` | meta viewport |

ธีมของ charmiss จาก API: primary `#F1336E` (ชมพู), secondary `#7650FF` (ม่วง), tertiary `#FF9300` (ส้ม) — แต่ละตัวมี `light` / `dark`

**แผนสำหรับ prototype:** SolidStart + TypeScript + Tailwind v3 + Kobalte + cva/clsx/tailwind-merge (โครงแบบ solid-ui) — ตรงกับต้นฉบับ dev หยิบไปใช้ต่อได้ทันที

## 2. Sitemap (`/:partner/...` โดย partner = `charmiss`)

> ⚠️ ตารางนี้คือ URL ของ**เว็บต้นฉบับ** — prototype ปรับโครงหน้าใหม่แล้ว ดู [04-sitemap](04-sitemap.md) (URL เดิมยังพาไปหน้าใหม่ให้อัตโนมัติ)

สถานะ: 🟢 เข้าได้โดยไม่ล็อกอิน · 🔒 ต้องล็อกอิน LINE (redirect ไป landing) · ⚫ ปิดใช้/404 หรือเป็นหน้า dev

### A. เข้าสู่ระบบ / สมัครสมาชิก
| Route | หน้า | สถานะ |
|---|---|---|
| `/charmiss/landing` | หน้าต้อนรับ + ปุ่ม LINE | 🟢 |
| `/charmiss/user-verification` | "เคยเป็นสมาชิกแล้วหรือยัง?" (เคยแล้ว / ไม่เคย / ข้าม) | 🟢 |
| `/charmiss/verify-by-phone` | ยืนยันตัวตนด้วยเบอร์โทร + OTP | 🔒 |
| `/charmiss/register`, `/charmiss/registration` | ฟอร์มสมัครสมาชิก | 🔒 |
| `/charmiss/consent` | ยอมรับข้อตกลง/PDPA | 🔒 |
| `/charmiss/line-authentication` | callback ของ LINE | ⚫ (ระบบ) |

### B. หน้าหลักและกิจกรรม
| Route | หน้า | สถานะ |
|---|---|---|
| `/charmiss/home` | หน้าแรกสมาชิก (โปรไฟล์, คอยน์, ภารกิจ, รางวัล) | 🔒 |
| `/charmiss/mission` | รายการภารกิจ | 🔒 |
| `/charmiss/mission/detail/:id` | รายละเอียดภารกิจ | 🔒 |
| `/charmiss/mission/redeem-detail/:id` | รางวัลของภารกิจ | 🔒 |
| `/charmiss/quiz-activity/:id` | ภารกิจแบบตอบคำถาม | 🔒 |
| `/charmiss/leaderboard/:id` | อันดับการสะสมคอยน์ | 🔒 |
| `/charmiss/point-collection` (+ `/detail`, `/mission`, `/fill-in/:id`) | สะสมคะแนน/สแตมป์ (สแกนใบเสร็จ, กรอกโค้ด) | 🔒 |

### C. รางวัล / สิทธิพิเศษ / คูปอง
| Route | หน้า | สถานะ |
|---|---|---|
| `/charmiss/reward` | แคตตาล็อกของรางวัล (แท็บหมวด + รายการสินค้า) | 🟢 |
| `/charmiss/reward/detail/:id` | รายละเอียดรางวัล | 🟢? |
| `/charmiss/reward/summarize` | สรุปก่อนแลก | 🔒 |
| `/charmiss/retail` (+ `/detail/:id`, `/summarize`) | สินค้า retail (UI เดียวกับ reward) | 🟢 / 🔒 |
| `/charmiss/privilage` + `/detail/:id` | สิทธิพิเศษสมาชิก | 🔒 |
| `/charmiss/redeem/:id`, `/redeem/detail/:id` | แลกรางวัล / โค้ดรับรางวัล | 🔒 |
| `/charmiss/exchange-point` | แลกคะแนน | 🔒 |
| `/charmiss/coupon` | คูปองที่แลกได้ | 🔒 |
| `/charmiss/coupon/my-coupons` + `/detail/:id` | คูปองของฉัน | 🔒 |

### D. บัญชีผู้ใช้
| Route | หน้า | สถานะ |
|---|---|---|
| `/charmiss/profile` | โปรไฟล์ + เมนู | 🔒 |
| `/charmiss/profile/information-personal`, `/charmiss/personal-information` | ข้อมูลส่วนตัว (มี date picker วันเกิด) | 🔒 |
| `/charmiss/personal-information/address`, `/charmiss/pick-address` | ที่อยู่ (autocomplete จังหวัด/อำเภอ) | 🔒 |
| `/charmiss/history`, `/charmiss/coin-history` | ประวัติแลก / ประวัติคอยน์ | 🔒 |
| `/charmiss/notification` | การแจ้งเตือน | 🔒 |
| `/charmiss/online-platform-connection` + `/question-answer/:platform` | เชื่อมบัญชี Shopee/Lazada ฯลฯ | 🔒 |
| `/charmiss/settings` | การตั้งค่า (ภาษา) | 🟢 |
| `/charmiss/policy` | นโยบายคุ้มครองข้อมูลส่วนบุคคล | 🟢 |

### E. ไม่แนะนำให้ทำ
- `/404` (ทำเป็นหน้า not found ทั่วไปได้)
- หน้า dev/ทดสอบ: `/charmiss/skeleton`, `/charmiss/loading`, `/openai`, `/event/club/test`
- กลุ่ม route เก่าที่ตอนนี้ไป 404 ทั้งหมด: `/redemption/*`, `/event/*`, `/event-point/*`, `/customer/*`, `/registration`, `/line/*`

## 3. ข้อจำกัด
หน้า 🔒 เข้าได้เฉพาะหลังล็อกอิน LINE ซึ่งผมทำแทนไม่ได้ (ไม่กรอกรหัสผ่าน/ไม่ข้ามระบบรักษาความปลอดภัย) มี 2 ทาง:
1. **คุณล็อกอิน LINE เองใน Browser pane** แล้วผมเปิดดูหน้าเหล่านั้นแบบอ่านอย่างเดียว → prototype จะตรงต้นฉบับมากที่สุด
2. **ไม่ล็อกอิน** → ผมสร้างจาก component/ข้อความ i18n ใน bundle + สไตล์ของหน้าที่เปิดได้ หน้าตาจะใกล้เคียงแต่ไม่ตรง 100% (จะระบุไว้ในรายการสิ่งที่เปลี่ยนแปลงช่วงที่ 5)

## 4. ลำดับความสำคัญที่เสนอ
1. landing → user-verification → verify-by-phone → register
2. home + bottom navigation
3. mission (list / detail)
4. reward (list / detail / summarize)
5. coupon / my-coupons (+ detail)
6. profile → personal-information → address, settings, policy
7. history / coin-history, notification
8. (ถ้ามีเวลา) privilege, point-collection, leaderboard, quiz, online-platform-connection, exchange-point, retail
