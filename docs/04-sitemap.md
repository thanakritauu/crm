# ช่วงที่ 4 — Sitemap ใหม่ (ปรับโครงหน้า)

> เอกสาร [01-tech-stack-and-sitemap](01-tech-stack-and-sitemap.md) คือ sitemap ของ**เว็บต้นฉบับ** ส่วนเอกสารนี้คือโครงหน้าของ prototype หลังปรับให้เข้าใจง่ายขึ้น
> ทุก URL อยู่ใต้ `/:partner/` (เช่น `/charmiss/...`) · URL เดิมทุกอันยังใช้ได้ — ระบบพาไป URL ใหม่ให้อัตโนมัติ (`src/lib/legacy-routes.ts`)

## หลักการ

1. **หนึ่งเรื่องอยู่ที่เดียว** — การแลกด้วยคะแนนทั้งหมดอยู่ใน "แลกรางวัล" · ประวัติทั้งหมดอยู่ใน "ประวัติ" · โปรไฟล์มีแค่เรื่องของผู้ใช้
2. **หน้าย่อยอยู่ใต้หน้าแม่ใน URL** — เช่น `/missions/:id/leaderboard` บอกเองว่าเป็นอันดับของภารกิจไหน
3. **id อยู่ใน path · query ใช้แค่แท็บ/ตัวกรอง** — เช่น `/rewards/:id/checkout` (เดิม `reward/summarize?id=`), `?type=coupons`
4. **ชื่อ URL เป็นภาษาอังกฤษที่สะกดถูกและสื่อความหมาย** — `privilage` → `rewards`, `fill-in/0` → `earn/receipt`
5. **ปุ่มย้อนกลับไปหน้าแม่** — โครงที่ซ้อนกันทำให้ "หน้าแม่" ชัดเจน ลดการส่งต่อด้วย `state.from`

## แถบเมนูล่าง

หน้าแรก `/home` · แลกรางวัล `/rewards` · สะสมคะแนน `/earn` · ภารกิจ `/missions` · โปรไฟล์ `/profile`

ฝั่งซ้ายเรื่องคะแนน (แลกรางวัล) ฝั่งขวาเรื่องคอยน์ (ภารกิจ) · การแจ้งเตือน `/notifications` เข้าจากกระดิ่งมุมขวาบนหน้าแรก (มีป้ายตัวเลขที่ยังไม่อ่าน) และเมนูการตั้งค่าในโปรไฟล์ — ย้อนกลับไปหน้าที่เข้ามา

## ผังหน้า

```
/home                                   หน้าแรก
/rewards                                แลกรางวัล (แท็บ: แลกสินค้า · แลกคูปอง · คูปองของฉัน*)
  ?type=products|coupons|mine           *คูปองของฉัน แสดงเมื่อเคยแลกคูปองแล้ว
  /:id                                  รายละเอียด (id "r-…" = ของรางวัล, อื่นๆ = สิทธิพิเศษ)
  /:id/checkout                         สรุปการแลก (ที่อยู่จัดส่ง + ยืนยัน)
  /points-to-coupon                     แลกคะแนนเป็นคูปองส่วนลด
/missions                               ภารกิจ
  /:id                                  รายละเอียดภารกิจ
  /:id/quiz                             ตอบคำถาม
  /:id/leaderboard                      อันดับคอยน์
  /:id/rewards/:rewardId                แลกรางวัลของภารกิจ
/earn                                   สะสมคะแนน (ถ่ายรูป / สแกน QR อยู่ในหน้านี้)
  /receipt                              กรอกเลขที่ใบเสร็จ
  /product-code                         กรอกรหัสสินค้า
  /receipt-example                      ตัวอย่างเลขที่ใบเสร็จ
/wallet                                 กระเป๋าของฉัน (→ /wallet/coupons)
  /coupons → /rewards?type=mine · /coupons/:id   รายละเอียดคูปองของฉัน
  /history?type=points|coins|redemptions   ประวัติคะแนน / คอยน์ / การแลก
/notifications                          การแจ้งเตือน
/profile                                โปรไฟล์
  /info                                 ข้อมูลส่วนตัว
  /tier                                 ระดับสมาชิก (คิดจากคะแนน · เข้าจากหน้าแรก)
  /addresses · /addresses/new · /addresses/:addressId   สมุดที่อยู่
  /platforms · /platforms/:platform     เชื่อมต่อแพลตฟอร์มออนไลน์
  /privacy                              นโยบายคุ้มครองข้อมูลส่วนบุคคล
/welcome                                หน้าต้อนรับ (ยังไม่เข้าสู่ระบบ)
/auth
  /member-check                         เคยเป็นสมาชิกหรือยัง
  /verify-phone?action=merge|signin|register|change_phone   ยืนยันเบอร์ + OTP
  /register                             สมัครสมาชิก
  /consent                              ยอมรับข้อตกลง (ขั้นใน flow LINE)
```

## URL เดิม → URL ใหม่ และเหตุผล

| เดิม | ใหม่ | เหตุผล / ดีขึ้นอย่างไร |
|---|---|---|
| `/privilage`, `/privilage/detail/:id`, `/privilage/summary/:id` | `/rewards`, `/rewards/:id`, `/rewards/:id/checkout` | ชื่อสะกดผิด และเป็นแค่ 1 ใน 4 ที่แลกด้วยคะแนน → รวมเป็นหน้า "แลกรางวัล" ที่เดียว |
| `/reward`, `/reward/detail/:id`, `/reward/summarize?id=` | `/rewards?type=products`, `/rewards/:id`, `/rewards/:id/checkout` | หน้าแคตตาล็อกของรางวัล**ไม่มีลิงก์เข้าเลย** · หน้าสรุปการแลกมี 2 แบบ → ตอนนี้เป็นแท็บในหน้าเดียวกัน และหน้ารายละเอียด/สรุปใช้ URL รูปแบบเดียว |
| `/coupon` | `/rewards?type=coupons` | แลกคูปองก็คือการแลกด้วยคะแนน → แท็บในหน้าแลกรางวัล |
| `/exchange-point` (เมนูโปรไฟล์) | `/rewards/points-to-coupon` (แท็บคูปอง) | เป็นเรื่องการแลก ไม่ใช่ข้อมูลผู้ใช้ → ย้ายมาอยู่กับการแลก |
| `/coupon/my-coupons`, `/coupon/my-coupons/detail/:id` | `/wallet/coupons`, `/wallet/coupons/:id` | "คูปองของฉัน" คือของที่มีอยู่แล้ว ไม่ใช่ที่แลก → อยู่ใน "กระเป๋าของฉัน" |
| `/history`, `/coin-history`, แท็บ "ประวัติการแลก" ในสิทธิพิเศษ | `/wallet/history?type=points\|coins\|redemptions` | ประวัติกระจาย 3 ที่ (ประวัติคอยน์เข้าได้จากหน้าภารกิจเท่านั้น) → รวมที่เดียว เข้าได้จากหน้าแรก โปรไฟล์ และหน้าแลกรางวัล |
| `/mission`, `/mission/detail/:id` | `/missions`, `/missions/:id` | ใช้พหูพจน์เหมือนหน้ารายการอื่น |
| `/mission/redeem-detail/:id?reward=` | `/missions/:id/rewards/:rewardId` | id ของรางวัลอยู่ใน path · อยู่ใต้ภารกิจ |
| `/quiz-activity/:id`, `/leaderboard/:id` | `/missions/:id/quiz`, `/missions/:id/leaderboard` | หน้าย่อยของภารกิจเคยอยู่ระดับบนสุด → ย้ายมาอยู่ใต้ภารกิจ |
| `/point-collection`, `/point-collection/detail`, `/point-collection/fill-in/0`, `/fill-in/1` | `/earn`, `/earn/receipt-example`, `/earn/receipt`, `/earn/product-code` | `detail` ไม่ได้หมายถึงรายละเอียด (จริงๆ คือตัวอย่างใบเสร็จ) และ `0/1` ไม่สื่อความหมาย |
| `/notification` | `/notifications` | พหูพจน์ตามหน้ารายการอื่น |
| `/personal-information`, `/personal-information/address(/new, /edit/:id)` | `/profile/info`, `/profile/addresses(/new, /:id)` | เป็นหน้าย่อยของโปรไฟล์ · สมุดที่อยู่ไม่ได้เป็นส่วนของ "ข้อมูลส่วนตัว" |
| `/online-platform-connection`, `/question-answer/:platform` | `/profile/platforms`, `/profile/platforms/:platform` | ชื่อยาวและอยู่ระดับบนสุด → ใต้โปรไฟล์ |
| `/policy` | `/profile/privacy` | ใต้โปรไฟล์ (มีลิงก์จากเมนูการตั้งค่า) |
| `/settings` | `/profile` | หน้ามีแค่เลือกภาษา ซ้ำกับเมนูภาษาในโปรไฟล์ และไม่มีลิงก์เข้า → เลิกใช้ |
| `/landing`, `/user-verification`, `/verify-by-phone`, `/register`, `/consent` | `/welcome`, `/auth/member-check`, `/auth/verify-phone`, `/auth/register`, `/auth/consent` | รวมขั้นตอนเข้าสู่ระบบ/สมัครไว้ใต้ `/auth` |

## โค้ดที่เกี่ยวข้อง

- `src/routes/[id]/…` — ไฟล์หน้าตามผังด้านบน
- `src/views/` — เนื้อหาหน้าที่ใช้ร่วม/สลับตาม id: `privilege-detail`, `reward-detail`, `privilege-checkout`, `reward-checkout`, `reward-catalog`, `coupon-catalog`, `fill-in`
- `src/lib/legacy-routes.ts` + `src/routes/[...404].tsx` — URL เดิม → URL ใหม่ (คงค่า query)
- `src/prototype/screens.ts` — รายการหน้าบนหน้า /prototype
