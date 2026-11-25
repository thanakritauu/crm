import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  vite: {
    // @solar-icons/solid เลือก runtime ผ่าน condition "solid" (ไฟล์ JSX ต้นฉบับ) — ห้าม pre-bundle
    // และต้องให้ SSR compile เอง ไม่งั้นได้ runtime ที่ไม่รองรับ hydration (Failed attempt to create new DOM elements during hydration)
    optimizeDeps: { exclude: ["@solar-icons/solid"] },
    ssr: { noExternal: ["@solar-icons/solid"] },
  },
});
