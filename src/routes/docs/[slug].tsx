import { Title } from "@solidjs/meta";
import { A, useParams } from "@solidjs/router";
import { For, Show } from "solid-js";
import { cardClass } from "~/components/ui/card";
import { docs, renderDoc } from "~/lib/docs";
import { cn } from "~/lib/utils";

/** /docs/:slug — เอกสารโปรเจค (ไม่ใช่ส่วนของแอปจริง) */
export default function DocPage() {
  const params = useParams();
  const doc = () => docs.find((d) => d.slug === params.slug);
  return (
    <div class="min-h-screen bg-surface-gray">
      <Title>{doc()?.title ?? "เอกสาร"} — Charmiss Club Prototype</Title>
      <header class="sticky top-0 z-header border-b border-stroke bg-white/90 backdrop-blur">
        <div class="mx-auto flex max-w-docs items-center gap-2 px-4 py-4">
          <img src="/images/logo.png" alt="" class="h-8 w-8 rounded-full" />
          <span class="text-16 font-semibold text-dark">เอกสาร</span>
          <nav class="ml-auto flex gap-4 text-14 font-semibold">
            <A href="/charmiss/landing" class="text-primary">เปิดแอป</A>
            <A href="/prototype" class="text-primary">หน้ารวม</A>
            <A href="/styleguide" class="text-primary">Style guide</A>
          </nav>
        </div>
      </header>
      <div class="mx-auto grid max-w-docs gap-6 px-4 py-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside class="md:sticky md:top-24 md:self-start">
          <ul class="hide-scrollbar flex gap-2 overflow-x-auto md:flex-col md:gap-1">
            <For each={docs}>
              {(d) => (
                <li class="shrink-0">
                  <A
                    href={`/docs/${d.slug}`}
                    class={cn(
                      "block rounded-lg px-4 py-2 text-14",
                      d.slug === params.slug ? "bg-primary-surface font-medium text-primary" : "text-gray hover:bg-white",
                    )}
                  >
                    {d.title}
                  </A>
                </li>
              )}
            </For>
          </ul>
        </aside>
        <Show when={doc()} fallback={<p class="text-gray">ไม่พบเอกสาร</p>}>
          {(d) => <article class={cn(cardClass, "doc-body min-w-0 p-4 md:p-8")} innerHTML={renderDoc(d().markdown)} />}
        </Show>
      </div>
    </div>
  );
}
