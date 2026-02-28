import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Loader2, Plus, Save, Trash2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useSaveEntries } from "../hooks/useQueries";
import { formatINR } from "../utils/format";

// ── Types ─────────────────────────────────────────────────

interface BulkRow {
  id: string;
  date: string;
  shift: "morning" | "evening";
  totalSale: string;
  totalPurchase: string;
  totalExpense: string;
}

function makeEmptyRow(): BulkRow {
  return {
    id: Math.random().toString(36).slice(2),
    date: "",
    shift: "morning",
    totalSale: "",
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
  return (
    parseNum(row.totalSale) -
    parseNum(row.totalPurchase) -
    parseNum(row.totalExpense)
  );
}

// ── CSV helpers ───────────────────────────────────────────

const CSV_HEADERS = [
  "Date",
  "Shift (morning/evening)",
  "Total Sale",
  "Total Purchase",
  "Total Expense",
];

function downloadTemplate() {
  const sampleRows = [
    "2024-01-15,morning,5000,2000,500",
    "2024-01-15,evening,4500,1500,300",
  ];
  const content = `${CSV_HEADERS.join(",")}\n${sampleRows.join("\n")}\n`;
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
  const dataLines = lines[0]?.trim().toLowerCase().startsWith("date")
    ? lines.slice(1)
    : lines;

  return dataLines
    .map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const shiftRaw = (cols[1] ?? "").toLowerCase();
      const shift: "morning" | "evening" =
        shiftRaw === "evening" ? "evening" : "morning";
      return {
        id: Math.random().toString(36).slice(2),
        date: cols[0] ?? "",
        shift,
        totalSale: cols[2] ?? "",
        totalPurchase: cols[3] ?? "",
        totalExpense: cols[4] ?? "",
      };
    })
    .filter((r) => r.date.trim() !== "");
}

// ── Component ─────────────────────────────────────────────

export function BulkImportPage() {
  const [rows, setRows] = useState<BulkRow[]>(() => makeEmptyRows(5));
  const saveEntries = useSaveEntries();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Keyboard: Tab on last cell → next row first cell
  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      rowIndex: number,
      fieldIndex: number,
      totalFields: number,
    ) => {
      if (e.key === "Tab" && !e.shiftKey && fieldIndex === totalFields - 1) {
        e.preventDefault();
        const nextRowEl = document.querySelector<HTMLInputElement>(
          `[data-row="${rowIndex + 1}"][data-field="0"]`,
        );
        if (nextRowEl) {
          nextRowEl.focus();
        } else {
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

  // Group rows by date, merge morning and evening
  const handleSaveAll = useCallback(async () => {
    const validRows = rows.filter((r) => r.date.trim() !== "");
    if (validRows.length === 0) {
      toast.error("कोई भी row में Date नहीं है — पहले Date डालें");
      return;
    }

    // Group by date
    const dateMap: Record<
      string,
      { morning: BulkRow | null; evening: BulkRow | null }
    > = {};
    for (const r of validRows) {
      if (!dateMap[r.date]) dateMap[r.date] = { morning: null, evening: null };
      dateMap[r.date][r.shift] = r;
    }

    const entries = Object.entries(dateMap).map(([date, shifts]) => {
      const buildShift = (row: BulkRow | null) => {
        if (!row) return { purchases: [], expenses: [], sales: [] };
        return {
          purchases:
            parseNum(row.totalPurchase) > 0
              ? [
                  {
                    description: "Bulk Import",
                    amount: parseNum(row.totalPurchase),
                    outlet: "Common",
                  },
                ]
              : [],
          expenses:
            parseNum(row.totalExpense) > 0
              ? [
                  {
                    description: "Bulk Import",
                    amount: parseNum(row.totalExpense),
                    outlet: "Common",
                  },
                ]
              : [],
          sales:
            parseNum(row.totalSale) > 0
              ? [
                  {
                    name: "Bulk Import",
                    quantity: BigInt(1),
                    freeQuantity: BigInt(0),
                    amount: parseNum(row.totalSale),
                  },
                ]
              : [],
        };
      };

      return {
        date,
        morning: buildShift(shifts.morning),
        evening: buildShift(shifts.evening),
      };
    });

    try {
      await saveEntries.mutateAsync(entries);
      toast.success(`${entries.length} दिन का हिसाब save हो गया! ✓`, {
        description: `${validRows.length} rows saved successfully.`,
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
          const hasData = prev.some((r) => r.date.trim() !== "");
          return hasData ? [...prev, ...parsed] : parsed;
        });
        toast.success(`${parsed.length} rows CSV से load हुए`);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [],
  );

  const FIELDS: Array<keyof Omit<BulkRow, "id">> = [
    "date",
    "shift",
    "totalSale",
    "totalPurchase",
    "totalExpense",
  ];

  return (
    <div className="max-w-full mx-auto px-4 py-6 space-y-4">
      {/* Header Section */}
      <div
        className="rounded-xl px-4 py-3.5 border"
        style={{
          background: "oklch(0.10 0.030 25)",
          borderColor: "oklch(0.22 0.05 25)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              className="font-display font-bold text-lg leading-tight"
              style={{ color: "oklch(0.96 0.018 72)" }}
            >
              📥 Bulk Entry
            </h2>
            <p
              className="text-xs mt-0.5 font-medium"
              style={{ color: "oklch(0.60 0.06 40)" }}
            >
              पिछले डेटा की Bulk Entry — हर row एक shift का हिसाब
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "oklch(0.48 0.04 35)" }}
            >
              Date + Shift डालें, फिर Tab से आगे बढ़ें
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-8"
              onClick={downloadTemplate}
              style={{
                borderColor: "oklch(0.30 0.05 25)",
                color: "oklch(0.70 0.06 40)",
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
                borderColor: "oklch(0.30 0.05 25)",
                color: "oklch(0.70 0.06 40)",
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
        style={{ borderColor: "oklch(0.22 0.05 25)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "oklch(0.13 0.040 25)" }}>
                <th
                  className="sticky left-0 z-10 px-2 py-2.5 text-left font-bold text-xs uppercase tracking-wider whitespace-nowrap min-w-[120px]"
                  style={{
                    color: "oklch(0.70 0.06 40)",
                    background: "oklch(0.13 0.040 25)",
                    borderBottom: "1px solid oklch(0.22 0.05 25)",
                    borderRight: "1px solid oklch(0.22 0.05 25)",
                  }}
                >
                  <span>तारीख</span>
                  <br />
                  <span
                    className="font-normal normal-case text-[10px]"
                    style={{ color: "oklch(0.45 0.03 35)" }}
                  >
                    Date
                  </span>
                </th>
                {[
                  { h: "Shift", s: "Morning/Eve" },
                  { h: "बिक्री", s: "Total Sale" },
                  { h: "खरीद", s: "Purchase" },
                  { h: "खर्च", s: "Expense" },
                  { h: "मुनाफा", s: "P/L (auto)" },
                ].map(({ h, s }) => (
                  <th
                    key={s}
                    className="px-2 py-2.5 text-right font-bold text-xs uppercase tracking-wider whitespace-nowrap min-w-[100px]"
                    style={{
                      color: "oklch(0.70 0.06 40)",
                      borderBottom: "1px solid oklch(0.22 0.05 25)",
                    }}
                  >
                    <span>{h}</span>
                    <br />
                    <span
                      className="font-normal normal-case text-[10px]"
                      style={{ color: "oklch(0.45 0.03 35)" }}
                    >
                      {s}
                    </span>
                  </th>
                ))}
                <th
                  className="px-2 py-2.5 text-center font-bold text-xs uppercase tracking-wider w-9"
                  style={{
                    color: "oklch(0.70 0.06 40)",
                    borderBottom: "1px solid oklch(0.22 0.05 25)",
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
                    ? "oklch(0.44 0.16 145)"
                    : pl < 0
                      ? "oklch(0.46 0.20 27)"
                      : "oklch(0.50 0.04 40)";

                return (
                  <tr
                    key={row.id}
                    style={{
                      background:
                        rowIndex % 2 === 0
                          ? "oklch(0.97 0.010 70)"
                          : "oklch(0.94 0.015 70)",
                      borderBottom: "1px solid oklch(0.85 0.025 60)",
                    }}
                  >
                    {/* Date */}
                    <td
                      className="sticky left-0 z-10 px-1 py-1"
                      style={{
                        background:
                          rowIndex % 2 === 0
                            ? "oklch(0.97 0.010 70)"
                            : "oklch(0.94 0.015 70)",
                        borderRight: "1px solid oklch(0.85 0.025 60)",
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
                          color: "oklch(0.18 0.03 25)",
                          borderColor: "oklch(0.82 0.025 60)",
                        }}
                      />
                    </td>

                    {/* Shift toggle */}
                    <td className="px-1 py-1 text-center">
                      <select
                        value={row.shift}
                        onChange={(e) =>
                          updateRow(row.id, "shift", e.target.value)
                        }
                        disabled={!hasDate}
                        className="w-full bg-transparent border rounded px-1.5 py-1 text-xs outline-none focus:ring-1 disabled:opacity-30 cursor-pointer"
                        style={{
                          color:
                            row.shift === "morning"
                              ? "oklch(0.42 0.22 25)"
                              : "oklch(0.45 0.18 240)",
                          borderColor: "oklch(0.82 0.025 60)",
                        }}
                      >
                        <option value="morning">🌅 Morning</option>
                        <option value="evening">🌆 Evening</option>
                      </select>
                    </td>

                    {/* Total Sale */}
                    <td className="px-1 py-1">
                      <NumInput
                        value={row.totalSale}
                        onChange={(v) => updateRow(row.id, "totalSale", v)}
                        onKeyDown={(e) =>
                          handleKeyDown(e, rowIndex, 2, FIELDS.length)
                        }
                        dataRow={rowIndex}
                        dataField={2}
                        disabled={!hasDate}
                        color="oklch(0.44 0.16 145)"
                      />
                    </td>

                    {/* Total Purchase */}
                    <td className="px-1 py-1">
                      <NumInput
                        value={row.totalPurchase}
                        onChange={(v) => updateRow(row.id, "totalPurchase", v)}
                        onKeyDown={(e) =>
                          handleKeyDown(e, rowIndex, 3, FIELDS.length)
                        }
                        dataRow={rowIndex}
                        dataField={3}
                        disabled={!hasDate}
                        color="oklch(0.46 0.20 27)"
                      />
                    </td>

                    {/* Total Expense */}
                    <td className="px-1 py-1">
                      <NumInput
                        value={row.totalExpense}
                        onChange={(v) => updateRow(row.id, "totalExpense", v)}
                        onKeyDown={(e) =>
                          handleKeyDown(e, rowIndex, 4, FIELDS.length)
                        }
                        dataRow={rowIndex}
                        dataField={4}
                        disabled={!hasDate}
                        color="oklch(0.46 0.20 27)"
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
                          style={{ color: "oklch(0.60 0.03 40)" }}
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
                        style={{ color: "oklch(0.46 0.20 27)" }}
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
              borderColor: "oklch(0.28 0.05 25)",
              color: "oklch(0.65 0.06 40)",
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
              borderColor: "oklch(0.28 0.05 25)",
              color: "oklch(0.65 0.06 40)",
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
            background: "oklch(0.42 0.22 25)",
            color: "oklch(0.97 0.015 72)",
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
        style={{ color: "oklch(0.50 0.04 40)" }}
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
        borderColor: "oklch(0.82 0.025 60)",
        caretColor: color,
      }}
    />
  );
}
