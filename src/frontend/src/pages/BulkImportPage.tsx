import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Loader2, Plus, Save, Trash2, Upload } from "lucide-react";
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { useSaveEntries } from "../hooks/useQueries";
import { formatINR } from "../utils/format";

// ── Types ─────────────────────────────────────────────────

interface BulkRow {
  id: string;
  date: string;
  rajajiSale: string;
  oldRaoSale: string;
  saroorpurSale: string;
  totalPurchase: string;
  totalExpense: string;
}

function makeEmptyRow(): BulkRow {
  return {
    id: Math.random().toString(36).slice(2),
    date: "",
    rajajiSale: "",
    oldRaoSale: "",
    saroorpurSale: "",
    totalPurchase: "",
    totalExpense: "",
  };
}

function makeEmptyRows(count: number): BulkRow[] {
  return Array.from({ length: count }, makeEmptyRow);
}

function parseNum(v: string): number {
  const n = Number.parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
}

function computePL(row: BulkRow): number {
  const sale =
    parseNum(row.rajajiSale) +
    parseNum(row.oldRaoSale) +
    parseNum(row.saroorpurSale);
  return sale - parseNum(row.totalPurchase) - parseNum(row.totalExpense);
}

// ── CSV helpers ───────────────────────────────────────────

const CSV_HEADERS = [
  "Date",
  "Rajaji Sale",
  "Old Rao Sale",
  "Saroorpur Sale",
  "Total Purchase",
  "Total Expense",
];

function downloadTemplate() {
  const content = `${CSV_HEADERS.join(",")}\n`;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mister-desi-hisaab-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): BulkRow[] {
  const lines = text.trim().split("\n");
  // skip header line if present (starts with "Date")
  const dataLines = lines[0]?.trim().toLowerCase().startsWith("date")
    ? lines.slice(1)
    : lines;

  return dataLines
    .map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      return {
        id: Math.random().toString(36).slice(2),
        date: cols[0] ?? "",
        rajajiSale: cols[1] ?? "",
        oldRaoSale: cols[2] ?? "",
        saroorpurSale: cols[3] ?? "",
        totalPurchase: cols[4] ?? "",
        totalExpense: cols[5] ?? "",
      };
    })
    .filter((r) => r.date.trim() !== "");
}

// ── Component ─────────────────────────────────────────────

import { useState } from "react";

export function BulkImportPage() {
  const [rows, setRows] = useState<BulkRow[]>(() => makeEmptyRows(5));
  const saveEntries = useSaveEntries();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update a single field in a row
  const updateRow = useCallback(
    (id: string, field: keyof Omit<BulkRow, "id">, value: string) => {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
      );
    },
    [],
  );

  const deleteRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addRows = useCallback((count: number) => {
    setRows((prev) => [...prev, ...makeEmptyRows(count)]);
  }, []);

  // Keyboard: Tab on last cell of a row → first cell of next row
  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      rowIndex: number,
      fieldIndex: number,
      totalFields: number,
    ) => {
      if (e.key === "Tab" && !e.shiftKey && fieldIndex === totalFields - 1) {
        e.preventDefault();
        // Focus the date cell of the next row
        const nextRowEl = document.querySelector<HTMLInputElement>(
          `[data-row="${rowIndex + 1}"][data-field="0"]`,
        );
        if (nextRowEl) {
          nextRowEl.focus();
        } else {
          // Add a new row and focus it after state update
          setRows((prev) => {
            const newRow = makeEmptyRow();
            setTimeout(() => {
              const el = document.querySelector<HTMLInputElement>(
                `[data-row="${prev.length}"][data-field="0"]`,
              );
              el?.focus();
            }, 50);
            return [...prev, newRow];
          });
        }
      }
    },
    [],
  );

  // Save all valid rows
  const handleSaveAll = useCallback(async () => {
    const validRows = rows.filter((r) => r.date.trim() !== "");
    if (validRows.length === 0) {
      toast.error("कोई भी row में Date नहीं है — पहले Date डालें");
      return;
    }

    const entries = validRows.map((r) => ({
      date: r.date,
      rajajiSale: parseNum(r.rajajiSale),
      oldRaoSale: parseNum(r.oldRaoSale),
      saroorpurSale: parseNum(r.saroorpurSale),
      purchases:
        parseNum(r.totalPurchase) > 0
          ? [
              {
                description: "Bulk Import",
                amount: parseNum(r.totalPurchase),
                outlet: "Common",
              },
            ]
          : [],
      expenses:
        parseNum(r.totalExpense) > 0
          ? [
              {
                description: "Bulk Import",
                amount: parseNum(r.totalExpense),
                outlet: "Common",
              },
            ]
          : [],
    }));

    try {
      await saveEntries.mutateAsync(entries);
      toast.success(`${entries.length} दिन का हिसाब save हो गया! ✓`, {
        description: `${validRows.length} entries saved successfully.`,
      });
    } catch {
      toast.error("Save failed — दोबारा कोशिश करें");
    }
  }, [rows, saveEntries]);

  // CSV upload
  const handleCSVUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          toast.error("CSV में कोई data नहीं मिला");
          return;
        }
        setRows((prev) => {
          // If only empty rows exist, replace them
          const hasData = prev.some((r) => r.date.trim() !== "");
          return hasData ? [...prev, ...parsed] : parsed;
        });
        toast.success(`${parsed.length} rows CSV से load हुए`);
      };
      reader.readAsText(file);
      // Reset so the same file can be uploaded again
      e.target.value = "";
    },
    [],
  );

  const FIELDS: Array<keyof Omit<BulkRow, "id">> = [
    "date",
    "rajajiSale",
    "oldRaoSale",
    "saroorpurSale",
    "totalPurchase",
    "totalExpense",
  ];

  return (
    <div className="max-w-full mx-auto px-4 py-6 space-y-4">
      {/* Header Section */}
      <div
        className="rounded-xl px-4 py-3.5 border"
        style={{
          background: "oklch(0.20 0.06 50)",
          borderColor: "oklch(0.30 0.07 50)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              className="font-display font-bold text-lg leading-tight"
              style={{ color: "oklch(0.95 0.025 65)" }}
            >
              📥 Bulk Entry
            </h2>
            <p
              className="text-xs mt-0.5 font-medium"
              style={{ color: "oklch(0.65 0.07 60)" }}
            >
              पिछले डेटा की Bulk Entry — हर row एक दिन का हिसाब
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "oklch(0.55 0.05 60)" }}
            >
              Date डालें, फिर Tab से आगे बढ़ें
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-8"
              onClick={downloadTemplate}
              style={{
                borderColor: "oklch(0.35 0.07 50)",
                color: "oklch(0.75 0.07 60)",
                background: "transparent",
              }}
            >
              <Download className="h-3.5 w-3.5" />
              Template CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-8"
              onClick={() => fileInputRef.current?.click()}
              style={{
                borderColor: "oklch(0.35 0.07 50)",
                color: "oklch(0.75 0.07 60)",
                background: "transparent",
              }}
            >
              <Upload className="h-3.5 w-3.5" />
              CSV Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleCSVUpload}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden shadow-sm"
        style={{ borderColor: "oklch(0.28 0.06 50)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "oklch(0.18 0.06 50)" }}>
                <th
                  className="sticky left-0 z-10 px-2 py-2.5 text-left font-bold text-xs uppercase tracking-wider whitespace-nowrap min-w-[120px]"
                  style={{
                    color: "oklch(0.72 0.08 60)",
                    background: "oklch(0.18 0.06 50)",
                    borderBottom: "1px solid oklch(0.28 0.06 50)",
                    borderRight: "1px solid oklch(0.28 0.06 50)",
                  }}
                >
                  <span>तारीख</span>
                  <br />
                  <span
                    className="font-normal normal-case text-[10px]"
                    style={{ color: "oklch(0.48 0.04 55)" }}
                  >
                    Date
                  </span>
                </th>
                {[
                  { h: "बिक्री", s: "Rajaji" },
                  { h: "बिक्री", s: "Old Rao" },
                  { h: "बिक्री", s: "Saroorpur" },
                  { h: "खरीद", s: "Purchase" },
                  { h: "खर्च", s: "Expense" },
                  { h: "मुनाफा", s: "P/L (auto)" },
                ].map(({ h, s }) => (
                  <th
                    key={s}
                    className="px-2 py-2.5 text-right font-bold text-xs uppercase tracking-wider whitespace-nowrap min-w-[100px]"
                    style={{
                      color: "oklch(0.72 0.08 60)",
                      borderBottom: "1px solid oklch(0.28 0.06 50)",
                    }}
                  >
                    <span>{h}</span>
                    <br />
                    <span
                      className="font-normal normal-case text-[10px]"
                      style={{ color: "oklch(0.48 0.04 55)" }}
                    >
                      {s}
                    </span>
                  </th>
                ))}
                <th
                  className="px-2 py-2.5 text-center font-bold text-xs uppercase tracking-wider w-9"
                  style={{
                    color: "oklch(0.72 0.08 60)",
                    borderBottom: "1px solid oklch(0.28 0.06 50)",
                  }}
                >
                  ×
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                const pl = computePL(row);
                const hasDate = row.date.trim() !== "";
                const plColor =
                  pl > 0
                    ? "oklch(0.45 0.18 145)"
                    : pl < 0
                      ? "oklch(0.52 0.22 27)"
                      : "oklch(0.55 0.04 60)";

                return (
                  <tr
                    key={row.id}
                    style={{
                      background:
                        rowIndex % 2 === 0
                          ? "oklch(0.15 0.05 50)"
                          : "oklch(0.17 0.055 50)",
                      borderBottom: "1px solid oklch(0.24 0.05 50)",
                    }}
                  >
                    {/* Date */}
                    <td
                      className="sticky left-0 z-10 px-1 py-1"
                      style={{
                        background:
                          rowIndex % 2 === 0
                            ? "oklch(0.15 0.05 50)"
                            : "oklch(0.17 0.055 50)",
                        borderRight: "1px solid oklch(0.28 0.06 50)",
                      }}
                    >
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) =>
                          updateRow(row.id, "date", e.target.value)
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(e, rowIndex, 0, FIELDS.length)
                        }
                        data-row={rowIndex}
                        data-field="0"
                        className="w-full bg-transparent border rounded px-1.5 py-1 text-xs font-medium outline-none focus:ring-1 cursor-pointer"
                        style={{
                          color: "oklch(0.90 0.025 65)",
                          borderColor: "oklch(0.32 0.07 50)",
                          colorScheme: "dark",
                        }}
                      />
                    </td>

                    {/* Rajaji Sale */}
                    <td className="px-1 py-1">
                      <NumInput
                        value={row.rajajiSale}
                        onChange={(v) => updateRow(row.id, "rajajiSale", v)}
                        onKeyDown={(e) =>
                          handleKeyDown(e, rowIndex, 1, FIELDS.length)
                        }
                        dataRow={rowIndex}
                        dataField={1}
                        disabled={!hasDate}
                        color="oklch(0.58 0.14 145)"
                      />
                    </td>

                    {/* Old Rao Sale */}
                    <td className="px-1 py-1">
                      <NumInput
                        value={row.oldRaoSale}
                        onChange={(v) => updateRow(row.id, "oldRaoSale", v)}
                        onKeyDown={(e) =>
                          handleKeyDown(e, rowIndex, 2, FIELDS.length)
                        }
                        dataRow={rowIndex}
                        dataField={2}
                        disabled={!hasDate}
                        color="oklch(0.58 0.14 145)"
                      />
                    </td>

                    {/* Saroorpur Sale */}
                    <td className="px-1 py-1">
                      <NumInput
                        value={row.saroorpurSale}
                        onChange={(v) => updateRow(row.id, "saroorpurSale", v)}
                        onKeyDown={(e) =>
                          handleKeyDown(e, rowIndex, 3, FIELDS.length)
                        }
                        dataRow={rowIndex}
                        dataField={3}
                        disabled={!hasDate}
                        color="oklch(0.58 0.14 145)"
                      />
                    </td>

                    {/* Total Purchase */}
                    <td className="px-1 py-1">
                      <NumInput
                        value={row.totalPurchase}
                        onChange={(v) => updateRow(row.id, "totalPurchase", v)}
                        onKeyDown={(e) =>
                          handleKeyDown(e, rowIndex, 4, FIELDS.length)
                        }
                        dataRow={rowIndex}
                        dataField={4}
                        disabled={!hasDate}
                        color="oklch(0.70 0.12 27)"
                      />
                    </td>

                    {/* Total Expense */}
                    <td className="px-1 py-1">
                      <NumInput
                        value={row.totalExpense}
                        onChange={(v) => updateRow(row.id, "totalExpense", v)}
                        onKeyDown={(e) =>
                          handleKeyDown(e, rowIndex, 5, FIELDS.length)
                        }
                        dataRow={rowIndex}
                        dataField={5}
                        disabled={!hasDate}
                        color="oklch(0.70 0.12 27)"
                      />
                    </td>

                    {/* P/L (auto) */}
                    <td className="px-2 py-1 text-right">
                      {hasDate ? (
                        <span
                          className="font-mono-nums font-bold text-xs whitespace-nowrap"
                          style={{ color: plColor }}
                        >
                          {pl >= 0 ? "+" : "−"}
                          {formatINR(Math.abs(pl))}
                        </span>
                      ) : (
                        <span
                          className="text-xs"
                          style={{ color: "oklch(0.38 0.04 55)" }}
                        >
                          —
                        </span>
                      )}
                    </td>

                    {/* Delete */}
                    <td className="px-1 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => deleteRow(row.id)}
                        className="p-1 rounded opacity-40 hover:opacity-100 transition-opacity"
                        style={{ color: "oklch(0.62 0.18 27)" }}
                        aria-label="Delete row"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 items-center justify-between pt-1">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-9"
            onClick={() => addRows(1)}
            style={{
              borderColor: "oklch(0.35 0.07 50)",
              color: "oklch(0.75 0.07 60)",
              background: "transparent",
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Row जोड़ें
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-9"
            onClick={() => addRows(10)}
            style={{
              borderColor: "oklch(0.35 0.07 50)",
              color: "oklch(0.75 0.07 60)",
              background: "transparent",
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            10 Rows जोड़ें
          </Button>
        </div>

        <Button
          size="default"
          className="gap-2 font-semibold h-10 px-6"
          onClick={handleSaveAll}
          disabled={saveEntries.isPending}
          style={{
            background: "oklch(0.62 0.18 52)",
            color: "oklch(0.99 0 0)",
          }}
        >
          {saveEntries.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Save हो रहा है...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              सब Save करें
            </>
          )}
        </Button>
      </div>

      {/* Row count info */}
      <p
        className="text-xs text-center pb-2"
        style={{ color: "oklch(0.45 0.04 55)" }}
      >
        {rows.filter((r) => r.date.trim() !== "").length} / {rows.length} rows में
        Date भरा है
      </p>
    </div>
  );
}

// ── Numeric Input Cell ────────────────────────────────────

function NumInput({
  value,
  onChange,
  onKeyDown,
  dataRow,
  dataField,
  disabled,
  color,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  dataRow: number;
  dataField: number;
  disabled?: boolean;
  color: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      data-row={dataRow}
      data-field={dataField}
      disabled={disabled}
      placeholder={disabled ? "" : "0"}
      min="0"
      step="1"
      className="w-full bg-transparent border rounded px-1.5 py-1 text-xs text-right font-mono-nums outline-none focus:ring-1 disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        color,
        borderColor: "oklch(0.28 0.06 50)",
        caretColor: color,
      }}
    />
  );
}
