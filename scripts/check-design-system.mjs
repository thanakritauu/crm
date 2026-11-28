#!/usr/bin/env node
/**
 * ตรวจ class ให้ตรง Design System (docs/02-design-system.md)
 *   npm run lint:ds               ตรวจทั้งโปรเจกต์
 *   npm run lint:ds -- <ไฟล์...>  ตรวจเฉพาะไฟล์
 * ตรวจไฟล์ .tsx / .ts / .css ใน src — ข้ามบรรทัดคอมเมนต์ และหน้า styleguide (แสดงค่าดิบเพื่ออธิบาย token)
 * ค่าสีอยู่ที่ tailwind.config.cjs ที่เดียว: ใน CSS ใช้ theme("colors.x") / var(--color-x) · ใน TSX ใช้ class
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SKIP = ["src/routes/styleguide.tsx"];
/** ไฟล์ที่มี hex ได้: ข้อมูลจำลอง (สีปกจาก backend), โลโก้แบรนด์ภายนอก, ภาพ QR จำลอง */
const HEX_OK = ["src/mocks/", "src/lib/session.ts", "src/components/platform/platform-icon.tsx", "src/components/coupon/fake-qr.tsx"];

const SPACING = "(?:-?)(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|gap|gap-x|gap-y|space-x|space-y)";
const B = "(?<=[\\s\"'`:{(]|^)";
const E = "(?=[\\s\"'`)}\\\\]|$)"; // รวม \\ เพื่อจับ class ที่ปิดด้วย \" ใน string

const RULES = [
  [new RegExp(B + "text-\\[[0-9.]+(px|rem)\\]" + E, "g"), "ขนาดตัวอักษรต้องเป็น text-24 / 18 / 16 / 14 / 12"],
  [new RegExp(B + "text-(xs|sm|base|lg|xl|[2-9]xl)" + E, "g"), "ขนาดตัวอักษรต้องเป็น text-24 / 18 / 16 / 14 / 12"],
  [new RegExp(B + "font-(\\[\\d+\\]|thin|extralight|light|bold|extrabold|black)" + E, "g"), "น้ำหนักใช้ได้แค่ font-normal (ข้อความทั่วไป) / font-medium (แท็บ, badge, ป้ายกำกับ) / font-semibold (หัวข้อ) — ห้าม Bold"],
  [/font-weight:\s*(bold|[7-9]00|[1-3]00)/g, "น้ำหนักใช้ได้แค่ 400 / 500 / 600 — ห้าม Bold"],
  [new RegExp(B + "leading-[\\w.\\[\\]]+" + E, "g"), "line-height อยู่ใน token แล้ว (1.5) — ไม่ต้องใส่ leading-*"],
  [new RegExp(B + "(text|bg|border|from|to|via|ring|fill|stroke|divide|outline|placeholder)-\\[(#|rgb|hsl|var)[^\\]]*\\]" + E, "g"), "ใช้สีจาก token (dark, gray, primary, stroke, surface-gray, success, error, warning …)"],
  [new RegExp(B + "(shadow|drop-shadow)-(\\[[^\\]]+\\]|sm|md|lg|xl|2xl)" + E, "g"), "เงาต้องเป็น shadow-card / drop-shadow-card"],
  [new RegExp(B + "rounded(-[trblse]{1,2})?-(\\[[^\\]]+\\]|sm|md)" + E, "g"), "มุมโค้งต้องเป็น rounded-lg (8) / xl (12) / 2xl (16) / 3xl (24) / full"],
  [new RegExp(B + "-?z-(\\[[^\\]]+\\]|[0-9]+)" + E, "g"), "z-index ต้องเป็น token: z-raised / card / header / fab / bar / modal / toast / devtools / fullscreen / loading"],
  [new RegExp(B + "(w-\\[343px\\]|max-w-\\[(375|960|1100)px\\]|h-\\[200px\\]|aspect-\\[1923/1000\\])" + E, "g"), "มี token แล้ว: w-modal / max-w-mobile / max-w-tool / max-w-docs / h-hero / aspect-cover"],
  [new RegExp(B + "(text|bg|border|ring|fill|stroke|from|to|via)-(gray|red|green|blue|yellow|pink|purple|slate|zinc|neutral)-[0-9]{2,3}" + E, "g"), "ไม่มีพาเลตต์ Tailwind เริ่มต้น — ใช้ token (gray, stroke, surface-gray …)"],
];
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
/** DSL ไอคอนใน popup: สีมาจาก tone ของ modal ที่เดียว — ไอคอนที่ส่งผ่าน prop icon={…} ห้ามใส่ class สีเอง (2026-11-27) */
/** DSL บทบาทสี: ห้ามผสมพื้นอ่อนสีหนึ่งกับตัว/ไอคอนอีกสีในชิ้นเดียว (ม่วงอ่อน+ชมพู / ชมพูอ่อน+ม่วง · 2026-11-28) */
const MIXED_TINT = /(bg-secondary-surface[^"'`]*\btext-primary\b|bg-primary-surface[^"'`]*\btext-secondary\b)/g;
const POPUP_ICON_COLOR = /icon=\{<\w+[^>]*\bclass="[^"]*\b(text-(?:primary|secondary|teriary|success|error|warning|dark|gray|white))\b/g;

/** ระยะห่างต้องเป็น 0, 4 หรือทวีคูณของ 8 */
function spacingIssues(line) {
  const out = [];
  const re = new RegExp(B + SPACING + "-(\\[([0-9.]+)px\\]|((?:0|[1-9][0-9]*)(?:\\.5)?))" + E, "g");
  for (const m of line.matchAll(re)) {
    const px = m[2] ? Number(m[2]) : Number(m[3]) * 4;
    if (px !== 0 && px !== 4 && px % 8 !== 0) out.push([m[0], `ระยะห่าง ${px}px ไม่ลงฐาน 8 (ใช้ 4, 8, 16, 24, 32 …)`]);
  }
  return out;
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (/\.(tsx|ts|css)$/.test(p) && !p.endsWith(".d.ts")) files.push(p);
  }
  return files;
}

const args = process.argv.slice(2);
const files = (args.length ? args.map((a) => join(process.cwd(), a)) : walk(join(ROOT, "src"))).filter(
  (f) => !SKIP.some((s) => relative(ROOT, f).startsWith(s)),
);

let count = 0;
for (const f of files) {
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    const t = line.trimStart();
    if (t.startsWith("*") || t.startsWith("//") || t.startsWith("/*") || t.startsWith("{/*")) return;
    const rel = relative(ROOT, f);
    const found = [];
    if (f.endsWith(".css")) {
      // CSS: ค่าสีต้องมาจาก theme() — ยกเว้นค่าเริ่มต้นของธีม partner (--primary-*, --secondary-*, --teriary-*)
      if (!/^\s*--(primary|secondary|teriary)-/.test(line)) for (const m of line.matchAll(HEX)) found.push([m[0], 'ใช้ theme("colors.…") แทน hex']);
    } else {
      for (const [re, msg] of RULES) for (const m of line.matchAll(re)) found.push([m[0], msg]);
      found.push(...spacingIssues(line));
      for (const m of line.matchAll(MIXED_TINT)) found.push([m[1].slice(0, 40), "ผสมสี: พื้นอ่อนกับตัวอักษร/ไอคอนต้องเป็นสีเดียวกัน (ม่วงอ่อน+ม่วง · ชมพูอ่อน+ชมพู) — DSL บทบาทสี"]);
      for (const m of line.matchAll(POPUP_ICON_COLOR)) found.push([m[1], "ไอคอนใน popup ห้ามใส่สีเอง — ใช้ tone ของ modal (primary/success/error/warning) · DSL พื้นอ่อน + ไอคอนสีเดียวกัน"]);
      if (!HEX_OK.some((s) => rel.startsWith(s)) && !/\bd="/.test(line)) for (const m of line.matchAll(HEX)) found.push([m[0], "ห้ามใส่ hex ในโค้ด — ใช้ class token หรือ var(--color-…)"]);
    }
    for (const [tok, msg] of found) {
      count++;
      console.log(`${relative(ROOT, f)}:${i + 1}  ${tok.trim()}  — ${msg}`);
    }
  });
}
console.log(count ? `\n${count} จุดไม่ตรง Design System` : "ผ่าน: ทุกไฟล์ตรง Design System");
process.exit(count ? 1 : 0);
