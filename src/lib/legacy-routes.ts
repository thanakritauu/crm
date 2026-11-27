/**
 * URL เดิม → URL ใหม่ (ปรับโครงหน้า/sitemap) — ใช้ใน [...404].tsx เพื่อพาไปหน้าใหม่แทนการขึ้น "ไม่พบหน้า"
 * รองรับลิงก์ที่ผู้ใช้บันทึกไว้, ลิงก์ในการแจ้งเตือนที่เก็บใน localStorage และเอกสารเก่า
 * รับ path หลัง /:partner/ (ไม่มี / นำหน้า) + query เดิม · คืน path ใหม่ (พร้อม query) หรือ null ถ้าไม่ใช่ URL เดิม
 */
export function legacyRedirect(path: string, search: string): string | null {
  const q = new URLSearchParams(search);
  const withQuery = (p: string, extra?: Record<string, string>) => {
    const params = new URLSearchParams(q);
    for (const [k, v] of Object.entries(extra ?? {})) params.set(k, v);
    const s = params.toString();
    return s ? `${p}${p.includes("?") ? "&" : "?"}${s}` : p;
  };
  const drop = (...keys: string[]) => keys.forEach((k) => q.delete(k));
  let m: RegExpMatchArray | null;

  // แลกรางวัล
  if (path === "privilage") return withQuery("rewards");
  if ((m = path.match(/^privilage\/detail\/([^/]+)$/))) return withQuery(`rewards/${m[1]}`);
  if ((m = path.match(/^privilage\/summary\/([^/]+)$/))) return withQuery(`rewards/${m[1]}/checkout`);
  if (path === "reward") return withQuery("rewards", { type: "products" });
  if ((m = path.match(/^reward\/detail\/([^/]+)$/))) return withQuery(`rewards/${m[1]}`);
  if (path === "reward/summarize") {
    const id = q.get("id");
    drop("id");
    return id ? withQuery(`rewards/${id}/checkout`) : withQuery("rewards", { type: "products" });
  }
  if (path === "coupon") return withQuery("rewards", { type: "coupons" });
  if (path === "exchange-point") return withQuery("rewards/points-to-coupon");
  // กระเป๋า
  if (path === "coupon/my-coupons") return withQuery("wallet/coupons");
  if ((m = path.match(/^coupon\/my-coupons\/detail\/([^/]+)$/))) return withQuery(`wallet/coupons/${m[1]}`);
  if (path === "history") {
    const tab = q.get("tab");
    drop("tab");
    return withQuery("wallet/points-history", tab && tab !== "received" ? { filter: tab } : undefined);
  }
  if (path === "coin-history") return "wallet/coins-history";
  // ภารกิจ
  if (path === "mission") return withQuery("missions");
  if ((m = path.match(/^mission\/detail\/([^/]+)$/))) return withQuery(`missions/${m[1]}`);
  if ((m = path.match(/^mission\/redeem-detail\/([^/]+)$/))) {
    const reward = q.get("reward");
    drop("reward");
    return withQuery(reward ? `missions/${m[1]}/rewards/${reward}` : `missions/${m[1]}`);
  }
  if ((m = path.match(/^quiz-activity\/([^/]+)$/))) return withQuery(`missions/${m[1]}/quiz`);
  if ((m = path.match(/^leaderboard\/([^/]+)$/))) return withQuery(`missions/${m[1]}/leaderboard`);
  // สะสมคะแนน
  if (path === "point-collection") return withQuery("earn");
  if (path === "point-collection/detail") return withQuery("earn/receipt-example");
  if (path === "point-collection/fill-in/0") return withQuery("earn/receipt");
  if (path === "point-collection/fill-in/1") return withQuery("earn/product-code");
  // แจ้งเตือน
  if (path === "notification") return withQuery("notifications");
  // โปรไฟล์
  if (path === "personal-information") return withQuery("profile/info");
  if (path === "personal-information/address") return withQuery("profile/addresses");
  if (path === "personal-information/address/new") return withQuery("profile/addresses/new");
  if ((m = path.match(/^personal-information\/address\/edit\/([^/]+)$/))) return withQuery(`profile/addresses/${m[1]}`);
  if (path === "online-platform-connection") return withQuery("profile/platforms");
  if ((m = path.match(/^online-platform-connection\/question-answer\/([^/]+)$/))) return withQuery(`profile/platforms/${m[1]}`);
  if (path === "policy") return withQuery("profile/privacy");
  if (path === "settings") return withQuery("profile");
  // เข้าสู่ระบบ / สมัคร
  if (path === "landing") return withQuery("welcome");
  if (path === "user-verification") return withQuery("auth/member-check");
  if (path === "verify-by-phone") return withQuery("auth/verify-phone");
  if (path === "register") return withQuery("auth/register");
  if (path === "consent") return withQuery("auth/consent");
  return null;
}
