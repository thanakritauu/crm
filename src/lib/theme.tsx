import { useLocation } from "@solidjs/router";
import { createContext, createMemo, useContext, type JSX, type ParentComponent } from "solid-js";
import { themes, type PartnerTheme } from "~/mocks/theme";

/**
 * เทียบเท่า ThemeContext ของต้นฉบับ
 * - path segment แรกคือ partner (เช่น /charmiss/home)
 * - ต้นฉบับดึงธีมจาก /api/theme แบบ async แล้วเขียน CSS variable
 * - prototype อ่านจาก mock แบบ sync เพื่อไม่ให้สีกระพริบตอน SSR
 */
type ThemeContextValue = { partner: () => string; theme: () => PartnerTheme };
const ThemeContext = createContext<ThemeContextValue>();

export const DEFAULT_PARTNER = "charmiss";

export function themeToCssVars(theme: PartnerTheme): JSX.CSSProperties {
  return {
    "--primary-base": theme.primary.base,
    "--primary-light": theme.primary.light,
    "--primary-dark": theme.primary.dark,
    "--secondary-base": theme.secondary.base,
    "--secondary-light": theme.secondary.light,
    "--secondary-dark": theme.secondary.dark,
    "--teriary-base": theme.teriary.base,
    "--teriary-light": theme.teriary.light,
    "--teriary-dark": theme.teriary.dark,
    // เฉดที่ Figma ใช้ (PinkCharmiss-50/300/400, ม่วงอ่อน) คำนวณจากสีหลักของ partner เพื่อรองรับหลายธีม
    "--primary-surface": `color-mix(in srgb, ${theme.primary.base} 10%, white)`,
    "--primary-400": `color-mix(in srgb, ${theme.primary.base} 80%, white)`,
    "--primary-300": `color-mix(in srgb, ${theme.primary.base} 67%, white)`,
    "--secondary-surface": `color-mix(in srgb, ${theme.secondary.base} 10%, white)`,
  };
}

export const ThemeProvider: ParentComponent = (props) => {
  const location = useLocation();
  const partner = createMemo(() => {
    const first = location.pathname.split("/").filter(Boolean)[0];
    return first && themes[first] ? first : DEFAULT_PARTNER;
  });
  const theme = createMemo(() => themes[partner()]);
  return (
    <ThemeContext.Provider value={{ partner, theme }}>
      <div style={themeToCssVars(theme())}>{props.children}</div>
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/** สร้าง path ภายใต้ partner ปัจจุบัน: partnerPath("home") → "/charmiss/home" */
export function usePartnerPath() {
  const { partner } = useTheme();
  return (path = "") => `/${partner()}/${path.replace(/^\//, "")}`;
}
