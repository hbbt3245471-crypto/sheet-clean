"use client";

import { useMemo, useRef, useState } from "react";
import { downloadCsv, parseCsv, serializeCsv, type CsvTable } from "@/lib/csv";
import {
  analyzeDuplicates,
  applyRowCap,
  detectColumns,
  FREE_ROW_LIMIT,
  isDuplicateValue,
  PAID_ROW_LIMIT,
  trimTable,
} from "@/lib/clean";

type Loaded = {
  name: string;
  raw: CsvTable;
};

export function SheetCleaner() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [creemNote, setCreemNote] = useState<string | null>(null);

  const result = useMemo(() => {
    if (!loaded) return null;
    const trimmed = trimTable(loaded.raw);
    const cols = detectColumns(trimmed.headers);
    const capped = applyRowCap(trimmed, unlocked);
    const stats = analyzeDuplicates(
      capped.table,
      cols.skuIndex,
      cols.titleIndex,
    );
    return { trimmed, cols, capped, stats };
  }, [loaded, unlocked]);

  async function onFile(file: File | undefined) {
    setError(null);
    setCreemNote(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setError("Please upload a .csv file.");
      return;
    }
    try {
      const text = await file.text();
      const raw = parseCsv(text);
      if (raw.headers.length === 0) {
        setError("That CSV looks empty.");
        return;
      }
      setLoaded({ name: file.name, raw });
    } catch {
      setError("Could not read that file in the browser.");
    }
  }

  function handleDownload() {
    if (!result || !loaded) return;
    const csv = serializeCsv(result.capped.table);
    const base = loaded.name.replace(/\.csv$/i, "");
    downloadCsv(`${base}-cleaned.csv`, csv);
  }

  /**
   * CREEM PLUG-IN POINT (later, still $0 today)
   * ------------------------------------------
   * When you wire billing:
   * 1. Create a Creem product: "Sheet Clean 10k rows" at $9.9/mo.
   * 2. From this click handler, redirect to Creem Checkout (or open their overlay)
   *    using a *publishable* checkout URL / product id — never a secret key.
   * 3. On success return URL, flip `unlocked` (or read an entitlement cookie
   *    set by a tiny serverless route that verifies the Creem webhook).
   * 4. Do not process CSVs on the server. Unlock only raises the in-browser cap.
   * This stub never charges and never calls Creem.
   */
  function handleUnlockStub() {
    setUnlocked(true);
    setCreemNote(
      "Test mode: 10k row limit unlocked. No charge. Creem checkout is not wired.",
    );
  }

  const skuName =
    result && result.cols.skuIndex >= 0
      ? result.capped.table.headers[result.cols.skuIndex]
      : "SKU";
  const titleName =
    result && result.cols.titleIndex >= 0
      ? result.capped.table.headers[result.cols.titleIndex]
      : "title";

  const skuDupSet = useMemo(
    () => new Set(result?.stats.duplicateSkuValues ?? []),
    [result],
  );
  const titleDupSet = useMemo(
    () => new Set(result?.stats.duplicateTitleValues ?? []),
    [result],
  );

  const previewRows = result?.capped.table.rows.slice(0, 8) ?? [];

  return (
    <div className="flex w-full flex-col gap-8">
      <section
        className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_1px_0_rgba(16,24,20,0.04)] sm:p-8"
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          void onFile(e.dataTransfer.files[0]);
        }}
      >
        <label className="block cursor-pointer">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--wash)] px-4 py-12 text-center">
            <span className="text-sm font-medium tracking-wide text-[var(--ink)]">
              Upload CSV
            </span>
            <span className="max-w-sm text-sm leading-6 text-[var(--muted)]">
              Product catalog or orders. Drop a file or click to choose.
              Typical columns: SKU, title, price.
            </span>
            {loaded ? (
              <span className="mt-1 rounded-full bg-[var(--ink)] px-3 py-1 text-xs font-medium text-white">
                {loaded.name}
              </span>
            ) : null}
          </div>
        </label>
        {error ? (
          <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      {result ? (
        <section className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat
              label="Rows"
              value={
                result.capped.truncated
                  ? `${result.capped.processed.toLocaleString()} / ${result.capped.total.toLocaleString()}`
                  : result.capped.processed.toLocaleString()
              }
              hint={
                result.capped.truncated
                  ? `Capped at ${result.capped.limit.toLocaleString()} (free = ${FREE_ROW_LIMIT})`
                  : "After trim"
              }
            />
            <Stat
              label="Duplicate SKUs"
              value={String(result.stats.duplicateSkuCount)}
              hint={`Distinct ${skuName} values that appear more than once`}
            />
            <Stat
              label="Duplicate titles"
              value={String(result.stats.duplicateTitleCount)}
              hint={`Distinct ${titleName} values that appear more than once`}
            />
          </div>

          {result.capped.truncated && !unlocked ? (
            <p className="text-sm leading-6 text-[var(--muted)]">
              Free tier cleans the first {FREE_ROW_LIMIT} rows in this browser.
              {result.capped.total - result.capped.processed > 0
                ? ` ${result.capped.total - result.capped.processed} row(s) were skipped.`
                : ""}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--ink)] px-5 text-sm font-medium text-white transition hover:bg-[var(--ink-hover)]"
            >
              Download cleaned CSV
            </button>
            <button
              type="button"
              onClick={handleUnlockStub}
              disabled={unlocked}
              className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--line-strong)] bg-white px-5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--wash)] disabled:cursor-default disabled:opacity-60"
            >
              {unlocked
                ? `Unlocked — ${PAID_ROW_LIMIT.toLocaleString()} rows`
                : "Unlock 10k rows — $9.9/mo (test mode, no charge)"}
            </button>
          </div>

          {creemNote ? (
            <p className="text-sm leading-6 text-[var(--muted)]">{creemNote}</p>
          ) : null}

          {previewRows.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[var(--wash)] text-xs uppercase tracking-wide text-[var(--muted)]">
                  <tr>
                    {result.capped.table.headers.map((h) => (
                      <th key={h} className="px-3 py-2 font-medium">
                        {h || "(blank)"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, ri) => (
                    <tr key={ri} className="border-t border-[var(--line)]">
                      {row.map((cell, ci) => {
                        const isSkuDup =
                          ci === result.cols.skuIndex &&
                          isDuplicateValue(cell, skuDupSet);
                        const isTitleDup =
                          ci === result.cols.titleIndex &&
                          isDuplicateValue(cell, titleDupSet);
                        return (
                          <td
                            key={ci}
                            className={`max-w-[16rem] truncate px-3 py-2 ${
                              isSkuDup || isTitleDup
                                ? "bg-[var(--warn-wash)] text-[var(--ink)]"
                                : "text-[var(--ink)]"
                            }`}
                            title={cell}
                          >
                            {cell || "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.capped.processed > previewRows.length ? (
                <p className="border-t border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)]">
                  Showing {previewRows.length} of {result.capped.processed} cleaned
                  rows. Duplicates highlighted.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[var(--ink)]">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{hint}</p>
    </div>
  );
}
