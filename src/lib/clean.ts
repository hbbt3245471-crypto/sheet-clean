import type { CsvTable } from "./csv";

export const FREE_ROW_LIMIT = 100;
export const PAID_ROW_LIMIT = 10_000;

const SKU_ALIASES = [
  "sku",
  "product_sku",
  "variant_sku",
  "item_sku",
  "skucode",
  "sku_code",
  "stock_keeping_unit",
  "product sku",
];

const TITLE_ALIASES = [
  "title",
  "name",
  "product_title",
  "product_name",
  "item_name",
  "item_title",
  "product title",
  "product name",
];

function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function findColumn(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normHeader);
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx !== -1) return idx;
  }
  for (let i = 0; i < normalized.length; i += 1) {
    if (aliases.some((a) => normalized[i].includes(a))) return i;
  }
  return -1;
}

export function detectColumns(headers: string[]): {
  skuIndex: number;
  titleIndex: number;
} {
  let skuIndex = findColumn(headers, SKU_ALIASES);
  let titleIndex = findColumn(headers, TITLE_ALIASES);

  if (skuIndex === -1 && headers.length > 0) skuIndex = 0;
  if (titleIndex === -1) {
    titleIndex = headers.length > 1 && skuIndex !== 1 ? 1 : skuIndex === 0 ? 1 : 0;
    if (titleIndex >= headers.length) titleIndex = -1;
  }
  if (titleIndex === skuIndex && headers.length > 1) {
    titleIndex = skuIndex === 0 ? 1 : 0;
  }

  return { skuIndex, titleIndex };
}

function tidyCell(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

export function trimTable(table: CsvTable): CsvTable {
  return {
    headers: table.headers.map(tidyCell),
    rows: table.rows.map((row) => row.map(tidyCell)),
  };
}

export type DuplicateStats = {
  duplicateSkuCount: number;
  duplicateTitleCount: number;
  duplicateSkuValues: string[];
  duplicateTitleValues: string[];
};

function countDuplicates(values: string[]): { count: number; values: string[] } {
  const freq = new Map<string, number>();
  for (const raw of values) {
    const key = raw.toLowerCase();
    if (!key) continue;
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  const dups: string[] = [];
  for (const [key, n] of freq) {
    if (n > 1) dups.push(key);
  }
  return { count: dups.length, values: dups };
}

export function analyzeDuplicates(
  table: CsvTable,
  skuIndex: number,
  titleIndex: number,
): DuplicateStats {
  const skus = skuIndex >= 0 ? table.rows.map((r) => r[skuIndex] ?? "") : [];
  const titles = titleIndex >= 0 ? table.rows.map((r) => r[titleIndex] ?? "") : [];
  const skuDup = countDuplicates(skus);
  const titleDup = countDuplicates(titles);
  return {
    duplicateSkuCount: skuDup.count,
    duplicateTitleCount: titleDup.count,
    duplicateSkuValues: skuDup.values,
    duplicateTitleValues: titleDup.values,
  };
}

export function applyRowCap(table: CsvTable, unlocked: boolean): {
  table: CsvTable;
  processed: number;
  total: number;
  truncated: boolean;
  limit: number;
} {
  const limit = unlocked ? PAID_ROW_LIMIT : FREE_ROW_LIMIT;
  const total = table.rows.length;
  const processed = Math.min(total, limit);
  return {
    table: { headers: table.headers, rows: table.rows.slice(0, processed) },
    processed,
    total,
    truncated: total > limit,
    limit,
  };
}

export function isDuplicateValue(
  value: string,
  dupSet: Set<string>,
): boolean {
  const key = value.toLowerCase();
  return key.length > 0 && dupSet.has(key);
}
