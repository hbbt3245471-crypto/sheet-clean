import { SheetCleaner } from "@/components/SheetCleaner";
import { FREE_ROW_LIMIT } from "@/lib/clean";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-[var(--line)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4">
          <p className="text-sm font-semibold tracking-tight text-[var(--ink)]">
            Sheet Clean
          </p>
          <p className="text-xs text-[var(--muted)]">In-browser · $0 demo</p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-5 py-12 sm:py-16">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl">
            Clean a shop CSV in the browser
          </h1>
          <p className="max-w-xl text-base leading-7 text-[var(--muted)]">
            Upload a product catalog or orders file. We trim whitespace, flag
            duplicate SKUs and titles, then let you download a cleaned CSV.
            First {FREE_ROW_LIMIT} rows are free.
          </p>
          <p className="text-sm font-medium text-[var(--ink)]">
            Files never leave this browser.
          </p>
        </div>

        <SheetCleaner />
      </main>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-1 px-5 py-6 text-sm text-[var(--muted)]">
          <p>$0 demo, no card</p>
          <p>No backend AI. No paid APIs. Processing stays on your device.</p>
        </div>
      </footer>
    </div>
  );
}
