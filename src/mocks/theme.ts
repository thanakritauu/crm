/** ข้อมูลจำลองของ GET /api/theme?partner=charmiss (ค่าจริง ณ วันที่ตรวจ) */
export type ThemeColorSet = { base: string; light: string; dark: string };
export type PartnerTheme = {
  client_name: string;
  primary: ThemeColorSet;
  secondary: ThemeColorSet;
  teriary: ThemeColorSet;
  card_style: number;
  logo: string;
  display_name: string;
  /** รูปปุ่มกลางของ bottom nav (สะสมคะแนน) */
  image_point: string;
  /** รูปเหรียญคอยน์ */
  image_coin: string;
  is_active: boolean;
  is_active_loyalty: boolean;
  is_coupon: boolean;
  is_privilage: boolean;
};

export const themes: Record<string, PartnerTheme> = {
  charmiss: {
    client_name: "charmiss",
    primary: { base: "#F1336E", light: "#fcd6e2", dark: "#480f21" },
    secondary: { base: "#7650FF", light: "#e4dcff", dark: "#23184d" },
    teriary: { base: "#FF9300", light: "#ffe9cc", dark: "#4d2c00" },
    card_style: 1,
    logo: "/images/logo.png",
    display_name: "charmiss club",
    image_point: "/images/icons/point.png",
    image_coin: "/images/coin.jpg",
    is_active: true,
    is_active_loyalty: true,
    is_coupon: true,
    is_privilage: true,
  },
};
