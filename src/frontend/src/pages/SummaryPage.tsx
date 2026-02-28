import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarIcon, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DailyEntry, SaleItem } from "../backend.d.ts";
import { SummaryCard } from "../components/SummaryCard";
import {
  useEntriesByMonth,
  useEntriesByYear,
  useEntryByDate,
} from "../hooks/useQueries";
import {
  formatDate,
  formatINR,
  getMonthName,
  getTodayStr,
  getYearRange,
} from "../utils/format";

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label: getMonthName(i + 1),
}));

const YEARS = getYearRange();

// Compute totals from a DailyEntry (morning + evening combined)
function computeTotals(entry: DailyEntry) {
  const allPurchases = [
    ...(entry.morning?.purchases ?? []),
    ...(entry.evening?.purchases ?? []),
  ];
  const allExpenses = [
    ...(entry.morning?.expenses ?? []),
    ...(entry.evening?.expenses ?? []),
  ];
  const allSales = [
    ...(entry.morning?.sales ?? []),
    ...(entry.evening?.sales ?? []),
  ];
  const totalPurchase = allPurchases.reduce((s, i) => s + i.amount, 0);
  const totalExpense = allExpenses.reduce((s, i) => s + i.amount, 0);
  const totalSale = allSales.reduce((s, i) => s + i.amount, 0);
  const profitLoss = totalSale - totalPurchase - totalExpense;
  return {
    totalPurchase,
    totalExpense,
    totalSale,
    profitLoss,
    allPurchases,
    allExpenses,
    allSales,
  };
}

// PL badge — pill with background for clear at-a-glance reading
function PLBadge({ value, large }: { value: number; large?: boolean }) {
  const isProfit = value > 0;
  const isBreakEven = value === 0;
  const textSize = large ? "text-base" : "text-xs";
  const iconSize = large ? "h-4 w-4" : "h-3 w-3";
  const py = large ? "py-1 px-3" : "py-0.5 px-2";

  const bgColor = isBreakEven
    ? "oklch(0.90 0.02 65)"
    : isProfit
      ? "oklch(0.92 0.06 145)"
      : "oklch(0.94 0.05 27)";
  const textColor = isBreakEven
    ? "oklch(0.40 0.04 55)"
    : isProfit
      ? "oklch(0.40 0.14 145)"
      : "oklch(0.46 0.20 27)";

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono-nums font-bold ${textSize} rounded-full ${py} whitespace-nowrap`}
      style={{ background: bgColor, color: textColor }}
    >
      {isBreakEven ? null : isProfit ? (
        <TrendingUp className={iconSize} />
      ) : (
        <TrendingDown className={iconSize} />
      )}
      {isProfit ? "+" : isBreakEven ? "±" : "−"}
      {formatINR(Math.abs(value))}
    </span>
  );
}

// ── Day Summary ──────────────────────────────────────────

function DaySummary() {
  const [date, setDate] = useState(getTodayStr());
  const { data: entry, isLoading } = useEntryByDate(date);

  const totals = entry
    ? {
        totalPurchase: entry.totalPurchase,
        totalExpense: entry.totalExpense,
        totalSale: entry.totalSale,
        profitLoss: entry.profitLoss,
      }
    : null;

  // Combined sale items from both shifts
  const allSaleItems = entry
    ? [...(entry.morning?.sales ?? []), ...(entry.evening?.sales ?? [])]
    : [];

  const morningHasData =
    entry &&
    ((entry.morning?.purchases ?? []).length > 0 ||
      (entry.morning?.expenses ?? []).length > 0 ||
      (entry.morning?.sales ?? []).length > 0);

  const eveningHasData =
    entry &&
    ((entry.evening?.purchases ?? []).length > 0 ||
      (entry.evening?.expenses ?? []).length > 0 ||
      (entry.evening?.sales ?? []).length > 0);

  return (
    <div className="space-y-5 pt-4">
      {/* Date Picker */}
      <div
        className="flex items-center gap-3 border rounded-xl px-4 py-3 shadow-xs"
        style={{
          background: "oklch(0.98 0.010 70)",
          borderColor: "oklch(0.85 0.025 60)",
        }}
      >
        <CalendarIcon
          className="h-5 w-5 shrink-0"
          style={{ color: "oklch(0.42 0.22 25)" }}
        />
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Select Date
          </Label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent border-none outline-none text-foreground font-semibold text-sm cursor-pointer"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      ) : !entry ? (
        <EmptyState message={`No entry found for ${formatDate(date)}`} />
      ) : (
        <motion.div
          key={date}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-5"
        >
          {/* Overall Summary Card */}
          <SummaryCard
            totalPurchase={totals!.totalPurchase}
            totalExpense={totals!.totalExpense}
            totalSale={totals!.totalSale}
            profitLoss={totals!.profitLoss}
            saleItems={allSaleItems}
          />

          {/* Morning Shift Block */}
          {morningHasData && (
            <div className="space-y-3">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: "oklch(0.42 0.22 25 / 0.08)",
                  borderLeft: "3px solid oklch(0.42 0.22 25)",
                }}
              >
                <span className="text-base">🌅</span>
                <span
                  className="text-sm font-bold"
                  style={{ color: "oklch(0.42 0.22 25)" }}
                >
                  Morning Shift — सुबह
                </span>
              </div>
              {(entry.morning?.purchases ?? []).length > 0 && (
                <ItemsTable
                  title="Purchases (खरीदारी)"
                  items={entry.morning.purchases}
                />
              )}
              {(entry.morning?.expenses ?? []).length > 0 && (
                <ItemsTable
                  title="Expenses (खर्च)"
                  items={entry.morning.expenses}
                  isExpense
                />
              )}
              {(entry.morning?.sales ?? []).length > 0 && (
                <SaleItemsTable
                  title="Sale Items (बिक्री)"
                  items={entry.morning.sales}
                />
              )}
            </div>
          )}

          {/* Evening Shift Block */}
          {eveningHasData && (
            <div className="space-y-3">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: "oklch(0.35 0.14 240 / 0.08)",
                  borderLeft: "3px solid oklch(0.45 0.18 240)",
                }}
              >
                <span className="text-base">🌆</span>
                <span
                  className="text-sm font-bold"
                  style={{ color: "oklch(0.45 0.18 240)" }}
                >
                  Evening Shift — शाम
                </span>
              </div>
              {(entry.evening?.purchases ?? []).length > 0 && (
                <ItemsTable
                  title="Purchases (खरीदारी)"
                  items={entry.evening.purchases}
                />
              )}
              {(entry.evening?.expenses ?? []).length > 0 && (
                <ItemsTable
                  title="Expenses (खर्च)"
                  items={entry.evening.expenses}
                  isExpense
                />
              )}
              {(entry.evening?.sales ?? []).length > 0 && (
                <SaleItemsTable
                  title="Sale Items (बिक्री)"
                  items={entry.evening.sales}
                />
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// Outlet badge config
const OUTLET_BADGE: Record<
  string,
  { bg: string; text: string; short: string }
> = {
  Rajaji: {
    bg: "oklch(0.92 0.06 52)",
    text: "oklch(0.42 0.16 52)",
    short: "R",
  },
  "Old Rao": {
    bg: "oklch(0.90 0.05 240)",
    text: "oklch(0.38 0.14 240)",
    short: "O",
  },
  Saroorpur: {
    bg: "oklch(0.92 0.06 300)",
    text: "oklch(0.40 0.16 300)",
    short: "S",
  },
  Common: {
    bg: "oklch(0.92 0.02 55)",
    text: "oklch(0.42 0.04 55)",
    short: "C",
  },
};

function OutletBadge({ outlet }: { outlet?: string }) {
  const key = outlet && OUTLET_BADGE[outlet] ? outlet : "Common";
  const cfg = OUTLET_BADGE[key];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {cfg.short} <span className="font-medium">{key}</span>
    </span>
  );
}

function OutletBreakdown({
  items,
  label,
}: {
  items: Array<{ description: string; amount: number; outlet?: string }>;
  label: string;
}) {
  // Group by outlet
  const groups: Record<string, number> = {};
  for (const item of items) {
    const key = item.outlet || "Common";
    groups[key] = (groups[key] || 0) + item.amount;
  }
  const entries = Object.entries(groups).filter(([, v]) => v > 0);
  if (entries.length <= 1) return null; // Only show when multiple outlets exist

  return (
    <div
      className="rounded-lg px-3 py-2.5 border"
      style={{
        background: "oklch(0.97 0.015 65)",
        borderColor: "oklch(0.88 0.04 65)",
      }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-widest mb-2"
        style={{ color: "oklch(0.46 0.06 55)" }}
      >
        {label} — Outlet Breakdown
      </p>
      <div className="flex flex-wrap gap-2">
        {entries.map(([outletName, total]) => {
          const cfg = OUTLET_BADGE[outletName] ?? OUTLET_BADGE.Common;
          return (
            <div
              key={outletName}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
              style={{ background: cfg.bg }}
            >
              <span className="text-xs font-bold" style={{ color: cfg.text }}>
                {outletName}
              </span>
              <span
                className="font-mono-nums font-bold text-xs"
                style={{ color: cfg.text }}
              >
                {formatINR(total)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SaleItemsTable({
  title,
  items,
}: {
  title: string;
  items: SaleItem[];
}) {
  const total = items.reduce((s, i) => s + i.amount, 0);
  return (
    <div
      className="rounded-lg border overflow-hidden shadow-xs"
      style={{ borderColor: "oklch(0.78 0.09 145 / 0.40)" }}
    >
      <div
        className="px-4 py-2.5 border-b flex items-center justify-between"
        style={{
          background: "oklch(0.92 0.06 145 / 0.15)",
          borderColor: "oklch(0.78 0.09 145 / 0.30)",
        }}
      >
        <h4
          className="text-xs font-bold uppercase tracking-[0.12em]"
          style={{ color: "oklch(0.40 0.14 145)" }}
        >
          {title}
        </h4>
        <span
          className="font-mono-nums font-bold text-sm"
          style={{ color: "oklch(0.40 0.14 145)" }}
        >
          {formatINR(total)}
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow style={{ background: "oklch(0.96 0.010 70)" }}>
            <TableHead
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: "oklch(0.40 0.04 40)" }}
            >
              Item
            </TableHead>
            <TableHead
              className="text-right text-xs font-bold uppercase tracking-wide"
              style={{ color: "oklch(0.40 0.04 40)" }}
            >
              Qty
            </TableHead>
            <TableHead
              className="text-right text-xs font-bold uppercase tracking-wide"
              style={{ color: "oklch(0.40 0.04 40)" }}
            >
              Free
            </TableHead>
            <TableHead
              className="text-right text-xs font-bold uppercase tracking-wide"
              style={{ color: "oklch(0.40 0.04 40)" }}
            >
              Amount
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: items don't have stable IDs from backend
            <TableRow key={i} className="ledger-row">
              <TableCell className="font-medium text-sm">
                {item.name || "—"}
              </TableCell>
              <TableCell
                className="text-right font-mono-nums text-sm"
                style={{ color: "oklch(0.40 0.04 40)" }}
              >
                {Number(item.quantity)}
              </TableCell>
              <TableCell
                className="text-right font-mono-nums text-sm"
                style={{ color: "oklch(0.44 0.14 145)" }}
              >
                {Number(item.freeQuantity) > 0
                  ? `+${Number(item.freeQuantity)}`
                  : "—"}
              </TableCell>
              <TableCell
                className="text-right font-mono-nums text-sm"
                style={{ color: "oklch(0.40 0.14 145)" }}
              >
                {formatINR(item.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ItemsTable({
  title,
  items,
  isExpense,
}: {
  title: string;
  items: Array<{ description: string; amount: number; outlet?: string }>;
  isExpense?: boolean;
}) {
  const total = items.reduce((s, i) => s + i.amount, 0);
  const valueColor = "oklch(0.52 0.22 27)"; // destructive tone
  return (
    <div className="space-y-2">
      <div
        className="rounded-lg border overflow-hidden shadow-xs"
        style={{ borderColor: "oklch(0.86 0.04 65)" }}
      >
        {/* Table title bar */}
        <div
          className="px-4 py-2.5 border-b flex items-center justify-between"
          style={{
            background: isExpense
              ? "oklch(0.95 0.035 27)"
              : "oklch(0.95 0.03 60)",
            borderColor: "oklch(0.86 0.04 65)",
          }}
        >
          <h4
            className="text-xs font-bold uppercase tracking-[0.12em]"
            style={{ color: "oklch(0.46 0.10 50)" }}
          >
            {title}
          </h4>
          <span
            className="font-mono-nums font-bold text-sm"
            style={{ color: valueColor }}
          >
            {formatINR(total)}
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow style={{ background: "oklch(0.97 0.012 65)" }}>
              <TableHead
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: "oklch(0.40 0.04 55)" }}
              >
                Description
              </TableHead>
              <TableHead
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: "oklch(0.40 0.04 55)" }}
              >
                Outlet
              </TableHead>
              <TableHead
                className="text-right text-xs font-bold uppercase tracking-wide"
                style={{ color: "oklch(0.40 0.04 55)" }}
              >
                Amount
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: items don't have stable IDs from backend
              <TableRow key={i} className="ledger-row">
                <TableCell className="font-medium text-sm">
                  {item.description || "—"}
                </TableCell>
                <TableCell>
                  <OutletBadge outlet={item.outlet} />
                </TableCell>
                <TableCell
                  className="text-right font-mono-nums text-sm"
                  style={{ color: valueColor }}
                >
                  {formatINR(item.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Outlet breakdown below table */}
      <OutletBreakdown
        items={items}
        label={isExpense ? "Expenses" : "Purchases"}
      />
    </div>
  );
}

// ── Month Summary ────────────────────────────────────────

function MonthSummary() {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(
    String(now.getMonth() + 1).padStart(2, "0"),
  );

  const { data: entries = [], isLoading } = useEntriesByMonth(year, month);

  const rows = entries.map((e) => ({ ...e, ...computeTotals(e) }));

  const grandTotal = rows.reduce(
    (acc, r) => ({
      totalPurchase: acc.totalPurchase + r.totalPurchase,
      totalExpense: acc.totalExpense + r.totalExpense,
      totalSale: acc.totalSale + r.totalSale,
      profitLoss: acc.profitLoss + r.profitLoss,
    }),
    { totalPurchase: 0, totalExpense: 0, totalSale: 0, profitLoss: 0 },
  );

  return (
    <div className="space-y-4 pt-4">
      {/* Selectors */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground mb-1.5 block">
            Month
          </Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-28">
          <Label className="text-xs text-muted-foreground mb-1.5 block">
            Year
          </Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Month header — shows period + net P/L prominently */}
      <div
        className="flex items-center justify-between rounded-xl px-4 py-3 border"
        style={{
          background: "oklch(0.20 0.06 50)",
          borderColor: "oklch(0.30 0.06 50)",
        }}
      >
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-0.5"
            style={{ color: "oklch(0.55 0.05 60)" }}
          >
            Period
          </p>
          <p
            className="font-display font-bold text-lg leading-tight"
            style={{ color: "oklch(0.95 0.02 65)" }}
          >
            {getMonthName(Number(month))} {year}
          </p>
        </div>
        <div className="text-right">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: "oklch(0.55 0.05 60)" }}
          >
            Net P/L
          </p>
          <PLBadge value={grandTotal.profitLoss} large />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : rows.length === 0 ? (
        <EmptyState
          message={`No entries for ${getMonthName(Number(month))} ${year}`}
        />
      ) : (
        <div
          className="rounded-lg border overflow-hidden shadow-xs"
          style={{ borderColor: "oklch(0.86 0.04 65)" }}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ background: "oklch(0.20 0.06 50)" }}>
                  <TableHead
                    className="whitespace-nowrap text-xs font-bold uppercase tracking-wide"
                    style={{ color: "oklch(0.70 0.05 60)" }}
                  >
                    Date
                  </TableHead>
                  <TableHead
                    className="text-right whitespace-nowrap text-xs font-bold uppercase tracking-wide"
                    style={{ color: "oklch(0.70 0.05 60)" }}
                  >
                    Purchase
                  </TableHead>
                  <TableHead
                    className="text-right whitespace-nowrap text-xs font-bold uppercase tracking-wide"
                    style={{ color: "oklch(0.70 0.05 60)" }}
                  >
                    Expense
                  </TableHead>
                  <TableHead
                    className="text-right whitespace-nowrap text-xs font-bold uppercase tracking-wide"
                    style={{ color: "oklch(0.70 0.05 60)" }}
                  >
                    Sale
                  </TableHead>
                  <TableHead
                    className="text-right whitespace-nowrap text-xs font-bold uppercase tracking-wide"
                    style={{ color: "oklch(0.70 0.05 60)" }}
                  >
                    P/L
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.date} className="ledger-row">
                    <TableCell className="font-semibold whitespace-nowrap text-sm">
                      {formatDate(row.date)}
                    </TableCell>
                    <TableCell
                      className="text-right font-mono-nums text-sm"
                      style={{ color: "oklch(0.52 0.22 27)" }}
                    >
                      {formatINR(row.totalPurchase)}
                    </TableCell>
                    <TableCell
                      className="text-right font-mono-nums text-sm"
                      style={{ color: "oklch(0.52 0.22 27)" }}
                    >
                      {formatINR(row.totalExpense)}
                    </TableCell>
                    <TableCell
                      className="text-right font-mono-nums text-sm"
                      style={{ color: "oklch(0.48 0.16 145)" }}
                    >
                      {formatINR(row.totalSale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <PLBadge value={row.profitLoss} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Elevated totals footer — visually distinct from data rows */}
          <div
            className="border-t-2 px-4 py-3"
            style={{
              borderColor: "oklch(0.72 0.16 75)",
              background: "oklch(0.22 0.06 50)",
            }}
          >
            <div className="grid grid-cols-4 gap-2">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "oklch(0.55 0.05 60)" }}
                >
                  Purchase
                </p>
                <p
                  className="font-mono-nums font-bold text-sm"
                  style={{ color: "oklch(0.85 0.12 27)" }}
                >
                  {formatINR(grandTotal.totalPurchase)}
                </p>
              </div>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "oklch(0.55 0.05 60)" }}
                >
                  Expense
                </p>
                <p
                  className="font-mono-nums font-bold text-sm"
                  style={{ color: "oklch(0.85 0.12 27)" }}
                >
                  {formatINR(grandTotal.totalExpense)}
                </p>
              </div>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "oklch(0.55 0.05 60)" }}
                >
                  Sale
                </p>
                <p
                  className="font-mono-nums font-bold text-sm"
                  style={{ color: "oklch(0.82 0.16 145)" }}
                >
                  {formatINR(grandTotal.totalSale)}
                </p>
              </div>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "oklch(0.55 0.05 60)" }}
                >
                  Net P/L
                </p>
                <PLBadge value={grandTotal.profitLoss} large />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Year Summary ─────────────────────────────────────────

function YearSummary() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const { data: entries = [], isLoading } = useEntriesByYear(year);

  // Aggregate by month
  const monthMap: Record<
    string,
    {
      totalPurchase: number;
      totalExpense: number;
      totalSale: number;
      profitLoss: number;
    }
  > = {};
  for (const e of entries) {
    const monthNum = e.date.slice(5, 7);
    const t = computeTotals(e);
    if (!monthMap[monthNum]) {
      monthMap[monthNum] = {
        totalPurchase: 0,
        totalExpense: 0,
        totalSale: 0,
        profitLoss: 0,
      };
    }
    monthMap[monthNum].totalPurchase += t.totalPurchase;
    monthMap[monthNum].totalExpense += t.totalExpense;
    monthMap[monthNum].totalSale += t.totalSale;
    monthMap[monthNum].profitLoss += t.profitLoss;
  }

  const rows = Object.entries(monthMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthNum, totals]) => ({
      monthNum,
      monthName: getMonthName(Number(monthNum)),
      ...totals,
    }));

  const grandTotal = rows.reduce(
    (acc, r) => ({
      totalPurchase: acc.totalPurchase + r.totalPurchase,
      totalExpense: acc.totalExpense + r.totalExpense,
      totalSale: acc.totalSale + r.totalSale,
      profitLoss: acc.profitLoss + r.profitLoss,
    }),
    { totalPurchase: 0, totalExpense: 0, totalSale: 0, profitLoss: 0 },
  );

  return (
    <div className="space-y-4 pt-4">
      {/* Year Selector */}
      <div className="flex items-end gap-4">
        <div className="w-32">
          <Label className="text-xs text-muted-foreground mb-1.5 block">
            Year
          </Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {entries.length > 0 && (
          <div className="flex items-center gap-2 pb-0.5">
            <Badge variant="outline" className="text-xs">
              {entries.length} entries
            </Badge>
            <PLBadge value={grandTotal.profitLoss} large />
          </div>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : rows.length === 0 ? (
        <EmptyState message={`No entries for year ${year}`} />
      ) : (
        <div
          className="rounded-lg border overflow-hidden shadow-xs"
          style={{ borderColor: "oklch(0.86 0.04 65)" }}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ background: "oklch(0.20 0.06 50)" }}>
                  <TableHead
                    className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: "oklch(0.70 0.05 60)" }}
                  >
                    Month
                  </TableHead>
                  <TableHead
                    className="text-right whitespace-nowrap text-xs font-bold uppercase tracking-wide"
                    style={{ color: "oklch(0.70 0.05 60)" }}
                  >
                    Purchase
                  </TableHead>
                  <TableHead
                    className="text-right whitespace-nowrap text-xs font-bold uppercase tracking-wide"
                    style={{ color: "oklch(0.70 0.05 60)" }}
                  >
                    Expense
                  </TableHead>
                  <TableHead
                    className="text-right whitespace-nowrap text-xs font-bold uppercase tracking-wide"
                    style={{ color: "oklch(0.70 0.05 60)" }}
                  >
                    Sale
                  </TableHead>
                  <TableHead
                    className="text-right whitespace-nowrap text-xs font-bold uppercase tracking-wide"
                    style={{ color: "oklch(0.70 0.05 60)" }}
                  >
                    P/L
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.monthNum} className="ledger-row">
                    <TableCell className="font-semibold">
                      {row.monthName}
                    </TableCell>
                    <TableCell
                      className="text-right font-mono-nums text-sm"
                      style={{ color: "oklch(0.52 0.22 27)" }}
                    >
                      {formatINR(row.totalPurchase)}
                    </TableCell>
                    <TableCell
                      className="text-right font-mono-nums text-sm"
                      style={{ color: "oklch(0.52 0.22 27)" }}
                    >
                      {formatINR(row.totalExpense)}
                    </TableCell>
                    <TableCell
                      className="text-right font-mono-nums text-sm"
                      style={{ color: "oklch(0.48 0.16 145)" }}
                    >
                      {formatINR(row.totalSale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <PLBadge value={row.profitLoss} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Elevated year totals footer */}
          <div
            className="border-t-2 px-4 py-3"
            style={{
              borderColor: "oklch(0.72 0.16 75)",
              background: "oklch(0.22 0.06 50)",
            }}
          >
            <div className="grid grid-cols-4 gap-2">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "oklch(0.55 0.05 60)" }}
                >
                  Purchase
                </p>
                <p
                  className="font-mono-nums font-bold text-sm"
                  style={{ color: "oklch(0.85 0.12 27)" }}
                >
                  {formatINR(grandTotal.totalPurchase)}
                </p>
              </div>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "oklch(0.55 0.05 60)" }}
                >
                  Expense
                </p>
                <p
                  className="font-mono-nums font-bold text-sm"
                  style={{ color: "oklch(0.85 0.12 27)" }}
                >
                  {formatINR(grandTotal.totalExpense)}
                </p>
              </div>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "oklch(0.55 0.05 60)" }}
                >
                  Sale
                </p>
                <p
                  className="font-mono-nums font-bold text-sm"
                  style={{ color: "oklch(0.82 0.16 145)" }}
                >
                  {formatINR(grandTotal.totalSale)}
                </p>
              </div>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "oklch(0.55 0.05 60)" }}
                >
                  Net P/L
                </p>
                <PLBadge value={grandTotal.profitLoss} large />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-border bg-card/50">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
        <span className="text-2xl">📊</span>
      </div>
      <p className="text-muted-foreground text-sm font-medium">{message}</p>
      <p className="text-muted-foreground/60 text-xs mt-1">
        Add an entry in the Daily Entry tab
      </p>
    </div>
  );
}

// ── Swipe Carousel Tab Bar ────────────────────────────────

const TABS = [
  { id: "day", emoji: "📅", label: "Day" },
  { id: "month", emoji: "📆", label: "Month" },
  { id: "year", emoji: "🗓", label: "Year" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Main Page ────────────────────────────────────────────

export function SummaryPage() {
  const [activeTab, setActiveTab] = useState<TabId>("day");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Map tab id → panel index
  const tabIndex: Record<TabId, number> = { day: 0, month: 1, year: 2 };

  // Scroll to panel when clicking a tab
  const scrollToTab = useCallback((tab: TabId) => {
    const container = scrollRef.current;
    if (!container) return;
    const idx = tabIndex[tab];
    container.scrollTo({
      left: idx * container.clientWidth,
      behavior: "smooth",
    });
    setActiveTab(tab);
  }, []);

  // Update active tab indicator when user swipes manually
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const idx = Math.round(container.scrollLeft / container.clientWidth);
    const tab = TABS[idx]?.id;
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [activeTab]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Tab bar */}
      <div
        className="flex gap-2 mb-4 p-1 rounded-xl"
        style={{ background: "oklch(0.92 0.025 65)" }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => scrollToTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={
                isActive
                  ? {
                      background: "oklch(0.25 0.07 50)",
                      color: "oklch(0.95 0.03 65)",
                      boxShadow: "0 1px 4px oklch(0 0 0 / 0.20)",
                    }
                  : {
                      background: "transparent",
                      color: "oklch(0.45 0.06 55)",
                    }
              }
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Horizontal scroll carousel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
        // hide webkit scrollbar via className trick — use inline style for scrollbar-width
        className="[&::-webkit-scrollbar]:hidden"
      >
        {/* Day panel */}
        <div
          style={{
            flex: "0 0 100%",
            width: "100%",
            scrollSnapAlign: "start",
            minWidth: 0,
          }}
        >
          <DaySummary />
        </div>

        {/* Month panel */}
        <div
          style={{
            flex: "0 0 100%",
            width: "100%",
            scrollSnapAlign: "start",
            minWidth: 0,
          }}
        >
          <MonthSummary />
        </div>

        {/* Year panel */}
        <div
          style={{
            flex: "0 0 100%",
            width: "100%",
            scrollSnapAlign: "start",
            minWidth: 0,
          }}
        >
          <YearSummary />
        </div>
      </div>
    </div>
  );
}
