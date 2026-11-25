import { marked } from "marked";

/**
 * เอกสารโปรเจค (README + docs/*.md) แสดงผลที่ /docs — อ่านไฟล์ตอน build ด้วย import.meta.glob
 * แก้เอกสารที่ไฟล์ .md เดิม หน้าเว็บจะอัปเดตตาม
 */
const files = {
  ...import.meta.glob("../../README.md", { query: "?raw", import: "default", eager: true }),
  ...import.meta.glob("../../docs/*.md", { query: "?raw", import: "default", eager: true }),
} as Record<string, string>;

export type DocEntry = { slug: string; title: string; markdown: string };

export const docs: DocEntry[] = Object.entries(files)
  .map(([path, markdown]) => {
    const name = path.split("/").pop()!.replace(/\.md$/, "");
    const slug = name === "README" ? "readme" : name;
    const title = markdown.match(/^#\s+(.+)$/m)?.[1] ?? name;
    return { slug, title, markdown };
  })
  .sort((a, b) => (a.slug === "readme" ? -1 : b.slug === "readme" ? 1 : a.slug.localeCompare(b.slug)));

/** แปลง markdown → HTML และแก้ลิงก์ระหว่างเอกสารให้ชี้ไป /docs/<slug> */
export function renderDoc(markdown: string) {
  const html = marked.parse(markdown, { async: false }) as string;
  return html.replace(/href="(?:\.\.\/|\.\/)?(?:docs\/)?([0-9a-z-]+|README)\.md"/gi, (_m, name: string) =>
    `href="/docs/${name.toUpperCase() === "README" ? "readme" : name}"`,
  );
}
