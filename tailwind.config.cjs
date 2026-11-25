/**
 * Tailwind config — Design System จาก Figma "CharmissCRM" (ไฟล์ g7WqHiqTtDuUjouKk5SRvW)
 *
 * กติกา (ดู docs/02-design-system.md):
 * - ตัวอักษร: IBM Plex Sans Thai, line-height 1.5 ทุกขนาด ใช้ได้ 5 ขนาด 24 / 18 / 16 / 14 / 12
 *   น้ำหนัก: Regular = ข้อความทั่วไป (พื้นฐาน), Medium = แท็บ/badge/ป้ายกำกับ, Semibold = หัวข้อ · ห้าม Bold
 * - สี: ใช้ชื่อ token ด้านล่างเท่านั้น (ไม่มีพาเลตต์ Tailwind เริ่มต้น เช่น gray-200, red-500)
 * - ระยะห่าง: ฐาน 8 (p-2, p-4, p-6, p-8 …) ยอม 4px (…-1) เฉพาะช่องแคบภายใน เช่น ไอคอนกับข้อความ
 * - มุมโค้ง: 8 (rounded-lg) · 12 (rounded-xl) · 16 (rounded-2xl) · 24 (rounded-3xl) · แคปซูล (rounded-full)
 * - เงา: shadow-card (Figma effect "Card") · drop-shadow-card สำหรับรูปทรงที่มีรอยบาก (คูปอง)
 * - ชั้น (z-index): z-raised / card / header / fab / bar / modal / toast / devtools / fullscreen / loading
 * - ขนาดคงที่: w-modal (343) · max-w-mobile (375) · max-w-tool (960) · max-w-docs (1100) · h-hero (200) · aspect-cover (16:9) · aspect-banner (2:1)
 *
 * Single source of truth: ไฟล์นี้เป็นที่เดียวที่กำหนดค่าสี plugin ด้านล่างจะสร้าง CSS variable `--color-<token>`
 * (เช่น --color-dark, --color-stroke) ให้ CSS ที่ไม่ใช่ Tailwind (app.css, innerHTML, SVG) ใช้ค่าชุดเดียวกัน
 * สีแบรนด์ (primary/secondary/teriary) เป็นธีม partner — ใน CSS ให้ใช้ var(--primary-base) ฯลฯ โดยตรง
 * ตรวจด้วย `npm run lint:ds`
 * @type {import('tailwindcss').Config}
 */
const plugin = require("tailwindcss/plugin");
const flattenColorPalette = require("tailwindcss/lib/util/flattenColorPalette").default;

/** สร้าง --color-* จาก token สีคงที่ (ข้ามสีธีม partner ที่เป็น var() อยู่แล้ว) */
const colorVariables = plugin(({ addBase, theme }) => {
  const vars = {};
  for (const [name, value] of Object.entries(flattenColorPalette(theme("colors")))) {
    if (typeof value !== "string" || !value.startsWith("#")) continue;
    vars[`--color-${name}`] = value;
  }
  addBase({ ":root": vars });
});

module.exports = {
  darkMode: ["class", '[data-kb-theme="dark"]'],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    fontFamily: {
      sans: ["IBMPlexSansThai", "sans-serif"],
    },
    // Figma text styles (ขนาด + line-height 1.5) — น้ำหนักใส่แยกด้วย font-semibold / font-medium / font-normal
    fontSize: {
      24: ["24px", { lineHeight: "1.5" }], // Title 24/Bold
      18: ["18px", { lineHeight: "1.5" }], // Header 18/Bold
      16: ["16px", { lineHeight: "1.5" }], // Header 16/Bold, 16/Semi
      14: ["14px", { lineHeight: "1.5" }], // Header 14/Bold, Semi, Med · Body 14/Reg
      12: ["12px", { lineHeight: "1.5" }], // Body 12/Semi, 12/Reg
    },
    // ใช้ได้ 3 น้ำหนัก: Regular = ข้อความทั่วไป (พื้นฐานที่ body), Medium = แท็บ/badge/ป้ายกำกับ, Semibold = หัวข้อ · ไม่มี Bold
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      inherit: "inherit",
      white: "#FFFFFF", // White/White · Text/White · Background/White
      black: "#000000", // ใช้กับ overlay เท่านั้น (bg-black/50)

      // ---- Text ----
      dark: "#1E3146", // Text/Black
      gray: {
        DEFAULT: "#5A6A85", // Text/Gray
        disable: "#909BAD", // Text/Disable
        placeholder: "#B3BAC7", // Text/Placeholder
      },

      // ---- Stroke / Surface ----
      stroke: {
        DEFAULT: "#EFF0F3", // Stroke/Gray
        strong: "#D2D8E0", // ขอบช่องกรอก
      },
      surface: {
        gray: "#EFF0F3", // Surface/Gray
      },

      // ---- Brand (ธีม partner — ThemeProvider เขียนทับตัวแปรได้) ----
      primary: {
        DEFAULT: "var(--primary-base)", // Brand/Pink · Text/Pink · Stroke/Pink · PinkCharmiss-500
        400: "var(--primary-400)", // PinkCharmiss-400
        300: "var(--primary-300)", // PinkCharmiss-300
        surface: "var(--primary-surface)", // Surface/Pink · PinkCharmiss-50
        light: "var(--primary-light)",
        dark: "var(--primary-dark)",
      },
      secondary: {
        DEFAULT: "var(--secondary-base)", // Brand/Purple
        surface: "var(--secondary-surface)", // แท็บที่เลือก / กล่องข้อมูล
        light: "var(--secondary-light)",
        dark: "var(--secondary-dark)",
      },
      teriary: {
        DEFAULT: "var(--teriary-base)", // Yellow-500
        light: "var(--teriary-light)",
        dark: "var(--teriary-dark)",
      },

      // ---- System ----
      success: { DEFAULT: "#00C763", surface: "#DAF8E6" }, // System/Green
      error: { DEFAULT: "#F23030", surface: "#FEEAEA" }, // System/Red
      warning: { DEFAULT: "#FF9300", surface: "#FFF4E6" }, // Yellow-500 / Yellow-50

      // ---- สีของแพลตฟอร์มภายนอก (ใช้กับโลโก้/ปุ่มของแพลตฟอร์มนั้นเท่านั้น) ----
      platform: {
        line: "#06C755",
        tiktok: "#FE2C55",
        shopee: { DEFAULT: "#EE4D2D", light: "#FF6533" },
        lazada: "#0F146D",
        "tiktok-dark": "#0F172A",
      },

      // ---- เหรียญอันดับ (leaderboard เท่านั้น) ----
      medal: {
        gold: "#F5B700",
        silver: "#A7B1C2",
        bronze: "#D68A4C",
      },
    },
    // ชั้นของ element ที่ลอยอยู่ (เรียงจากล่างขึ้นบน) — ห้ามใช้ z-[…]
    zIndex: {
      auto: "auto",
      0: "0",
      raised: "10", // ซ้อนเหนือเนื้อหาในหน้า (เนื้อหาที่วางทับรูป/แถบสี)
      card: "20", // การ์ดในรายการที่ต้องอยู่เหนือพื้นหลังตกแต่ง
      header: "30", // แถบหัวหน้า (NavigationTopbar ทั้งแบบโปร่งและ sticky)
      fab: "48", // ปุ่มลอย (เมนู prototype)
      bar: "49", // แถบเมนูล่าง / แถบปุ่มล่าง
      modal: "50", // modal, dialog, sheet
      toast: "60",
      devtools: "70", // เมนู prototype (อยู่เหนือ modal ของแอป)
      fullscreen: "999", // หน้าจอเต็ม เช่น กล้องสแกน QR
      loading: "9999",
    },
    extend: {
      width: {
        modal: "343px", // ความกว้าง modal / dialog (Figma)
      },
      maxWidth: {
        mobile: "375px", // คอลัมน์เนื้อหาขนาดจอมือถือ Figma
        tool: "960px", // หน้าเครื่องมือ prototype (/prototype, /qr, /styleguide)
        docs: "1100px", // หน้าเอกสาร /docs (มีแถบเมนูซ้าย)
      },
      height: {
        hero: "200px", // พื้นที่หัวของหน้า (hero): แถบสีชมพูขอบล่างโค้ง หรือรูปหัวหน้า detail
      },
      // สัดส่วนรูปมาตรฐาน (รูปที่สัดส่วนไม่ตรงจะถูกตัดแบบ object-cover ตรงกลาง)
      //   square (aspect-square ของ Tailwind) 1:1 = การ์ด / thumbnail · cover 16:9 = ปกหน้ารายละเอียด · banner 2:1 = แบนเนอร์หน้าแรก
      aspectRatio: {
        cover: "16 / 9",
        banner: "2 / 1",
      },
      backgroundImage: {
        // Figma หน้าแรก: ไล่สีชมพู 15% ลงขาว (ใช้ color-mix ให้ตามสีธีม partner)
        "brand-fade": "linear-gradient(180deg, color-mix(in srgb, var(--primary-base) 15%, transparent) 0%, rgba(255, 255, 255, 0.15) 100%)",
      },
      boxShadow: {
        card: "0px 2px 12px 0px rgba(90, 106, 133, 0.1)", // Figma effect "Card"
        "scan-mask": "0 0 0 100vmax rgba(0, 0, 0, 0.3)", // Figma "scan overlay": พื้นดำ 30% รอบกรอบสแกน
      },
      dropShadow: {
        card: "0px 2px 6px rgba(90, 106, 133, 0.1)", // เทียบเท่า "Card" สำหรับรูปทรงที่ไม่ใช่สี่เหลี่ยม
      },
      keyframes: {
        "content-show": { from: { opacity: 0, transform: "scale(0.96)" }, to: { opacity: 1, transform: "scale(1)" } },
        "content-hide": { from: { opacity: 1, transform: "scale(1)" }, to: { opacity: 0, transform: "scale(0.96)" } },
      },
      animation: {
        "content-show": "content-show 0.2s ease-out",
        "content-hide": "content-hide 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), colorVariables],
};
