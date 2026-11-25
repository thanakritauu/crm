import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { For } from "solid-js";
import { screenGroups } from "~/prototype/screens";
import { cn } from "~/lib/utils";
import { cardClass } from "~/components/ui/card";

/** /prototype — หน้ารวม prototype (ไม่มีในต้นฉบับ) */
export default function PrototypeHub() {
  const done = () => screenGroups.flatMap((g) => g.screens).filter((s) => s.status === "done").length;
  const total = () => screenGroups.flatMap((g) => g.screens).length;
  return (
    <main class="mx-auto max-w-tool px-4 py-10">
      <Title>Charmiss Club — Prototype</Title>
      <header class="mb-8 flex items-center gap-4">
        <img src="/images/logo.png" alt="" class="h-14 w-14 rounded-full border-[3px] border-white shadow-card" />
        <div>
          <h1 class="text-24 font-semibold text-dark">Charmiss Club — Clickable Prototype</h1>
          <p class="text-14 text-gray">
            SolidStart + Tailwind v3 + Kobalte · สร้างแล้ว {done()}/{total()} หน้า ·{" "}
            <A href="/styleguide" class="font-semibold text-primary underline-offset-4 hover:underline">Style guide</A> ·{" "}
            <A href="/docs" class="font-semibold text-primary underline-offset-4 hover:underline">เอกสาร</A> ·{" "}
            <A href="/qr" class="font-semibold text-primary underline-offset-4 hover:underline">QR ตัวอย่าง</A>
          </p>
        </div>
      </header>
      <div class="grid gap-4 md:grid-cols-2">
        <For each={screenGroups}>
          {(group) => (
            <section class={cn(cardClass, "p-6")}>
              <h2 class="mb-2 text-16 font-semibold text-dark">{group.title}</h2>
              <ul class="space-y-1">
                <For each={group.screens}>
                  {(s) => (
                    <li>
                      <A href={`/charmiss/${s.path}`} class="flex items-center justify-between gap-2 rounded-xl px-4 py-2 hover:bg-surface-gray">
                        <span class="min-w-0">
                          <span class="block text-14 font-semibold text-dark">{s.title}</span>
                          <span class="block truncate text-12 text-gray">/charmiss/{s.path}</span>
                        </span>
                        <span
                          class={cn(
                            "shrink-0 rounded-full px-2 py-0 text-12 font-semibold",
                            s.status === "done" ? "bg-success-surface text-success" : "bg-surface-gray text-gray",
                          )}
                        >
                          {s.status === "done" ? "เสร็จแล้ว" : "ยังไม่ทำ"}
                        </span>
                      </A>
                    </li>
                  )}
                </For>
              </ul>
            </section>
          )}
        </For>
      </div>
    </main>
  );
}
