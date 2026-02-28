import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CalendarIcon,
  Loader2,
  Lock,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CategoryItem, SaleItem } from "../backend.d.ts";
import {
  ItemList,
  type ItemWithId,
  createItemWithId,
} from "../components/ItemList";
import { SummaryCard } from "../components/SummaryCard";
import {
  useAddExpenseCategoryWithPrice,
  useAddPurchaseCategoryWithPrice,
  useAddSaleCategoryWithPrice,
  useDeleteExpenseCategoryWithPrice,
  useDeletePurchaseCategoryWithPrice,
  useEntryByDate,
  useExpenseCategoriesWithPrice,
  usePurchaseCategoriesWithPrice,
  useSaleCategoriesWithPrice,
  useSaveEntry,
} from "../hooks/useQueries";
import { getTodayStr } from "../utils/format";

// Format today's date in a warm Hindi/Indian style
function getTodayGreeting(): { hindi: string; date: string } {
  const today = new Date();
  const days = [
    "रविवार",
    "सोमवार",
    "मंगलवार",
    "बुधवार",
    "गुरुवार",
    "शुक्रवार",
    "शनिवार",
  ];
  const months = [
    "जनवरी",
    "फरवरी",
    "मार्च",
    "अप्रैल",
    "मई",
    "जून",
    "जुलाई",
    "अगस्त",
    "सितम्बर",
    "अक्टूबर",
    "नवम्बर",
    "दिसम्बर",
  ];
  const day = days[today.getDay()];
  const date = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
  return { hindi: day, date };
}

// ── Sale Items row ────────────────────────────────────────

interface SaleRowState {
  _id: string;
  name: string;
  quantity: string;
  freeQuantity: string;
  rate: number;
  amount: number;
}

function makeSaleRow(): SaleRowState {
  return {
    _id: Math.random().toString(36).slice(2),
    name: "",
    quantity: "",
    freeQuantity: "",
    rate: 0,
    amount: 0,
  };
}

function saleRowFromSaleItem(item: SaleItem): SaleRowState {
  const qty = Number(item.quantity);
  const rate = qty > 0 ? item.amount / qty : 0;
  return {
    _id: Math.random().toString(36).slice(2),
    name: item.name,
    quantity: String(Number(item.quantity)),
    freeQuantity: String(Number(item.freeQuantity)),
    rate,
    amount: item.amount,
  };
}

interface SaleItemsListProps {
  rows: SaleRowState[];
  categories: CategoryItem[];
  onChange: (rows: SaleRowState[]) => void;
  onAddCategory: (name: string, defaultPrice: number) => Promise<void>;
}

function SaleItemsList({
  rows,
  categories,
  onChange,
  onAddCategory,
}: SaleItemsListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [savingCat, setSavingCat] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const totalSale = rows.reduce((s, r) => s + r.amount, 0);

  const addRow = () => {
    onChange([...rows, makeSaleRow()]);
  };

  const updateRow = useCallback(
    (id: string, updates: Partial<SaleRowState>) => {
      onChange(
        rows.map((r) => {
          if (r._id !== id) return r;
          const merged = { ...r, ...updates };
          // Recalculate amount when qty or rate changes
          const qty = Number.parseFloat(merged.quantity) || 0;
          merged.amount = qty * merged.rate;
          return merged;
        }),
      );
    },
    [rows, onChange],
  );

  const selectCategory = useCallback(
    (id: string, cat: CategoryItem) => {
      onChange(
        rows.map((r) => {
          if (r._id !== id) return r;
          const qty = Number.parseFloat(r.quantity) || 0;
          const rate = cat.defaultPrice;
          return {
            ...r,
            name: cat.name,
            rate,
            amount: qty * rate,
          };
        }),
      );
      setOpenDropdownId(null);
    },
    [rows, onChange],
  );

  const handleSaveAsCategory = async (
    _id: string,
    name: string,
    rate: number,
  ) => {
    if (!name.trim()) return;
    setSavingCat(true);
    try {
      await onAddCategory(name.trim(), rate);
      toast.success(`"${name.trim()}" sale item save हो गया`);
    } catch {
      toast.error("Save नहीं हुआ");
    } finally {
      setSavingCat(false);
      setOpenDropdownId(null);
    }
  };

  return (
    <div
      className="rounded-lg border overflow-hidden shadow-xs"
      style={{ borderColor: "oklch(0.78 0.09 145 / 0.40)" }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 border-b flex items-center justify-between"
        style={{
          background: "oklch(0.92 0.06 145 / 0.15)",
          borderColor: "oklch(0.78 0.09 145 / 0.30)",
        }}
      >
        <h3
          className="font-semibold text-sm tracking-wide uppercase"
          style={{ color: "oklch(0.40 0.16 145)" }}
        >
          🧾 Sale Items (बिक्री)
        </h3>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1"
          style={{ color: "oklch(0.40 0.16 145)" }}
          onClick={addRow}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Row
        </Button>
      </div>

      {/* Column headers */}
      {rows.length > 0 && (
        <div
          className="grid gap-1 px-3 py-1.5 border-b"
          style={{
            gridTemplateColumns: "1fr 60px 60px 80px 32px",
            background: "oklch(0.96 0.010 70)",
            borderColor: "oklch(0.85 0.025 60)",
          }}
        >
          {["Item", "Qty", "Free", "Amount", ""].map((h) => (
            <span
              key={h}
              className="text-[10px] font-bold uppercase tracking-wide text-center"
              style={{ color: "oklch(0.50 0.04 40)" }}
            >
              {h}
            </span>
          ))}
        </div>
      )}

      {/* Rows */}
      <div className="divide-y" style={{ borderColor: "oklch(0.85 0.025 60)" }}>
        {rows.length === 0 ? (
          <div
            className="py-5 text-center text-sm"
            style={{ color: "oklch(0.52 0.04 40)" }}
          >
            "Add Row" से sale item डालें
          </div>
        ) : (
          rows.map((row) => {
            const filteredCats = categories.filter((c) =>
              row.name.trim() === ""
                ? true
                : c.name.toLowerCase().includes(row.name.toLowerCase()),
            );
            const isNewCat =
              row.name.trim() !== "" &&
              !categories.some(
                (c) => c.name.toLowerCase() === row.name.trim().toLowerCase(),
              );
            const isOpen = openDropdownId === row._id;
            const isPendingDelete = confirmDeleteId === row._id;

            if (isPendingDelete) {
              return (
                <div
                  key={row._id}
                  className="flex items-center gap-2 px-3 py-2.5"
                  style={{ background: "oklch(0.96 0.03 27)" }}
                >
                  <AlertTriangle
                    className="h-4 w-4 shrink-0"
                    style={{ color: "oklch(0.46 0.20 27)" }}
                  />
                  <span
                    className="flex-1 text-sm font-medium"
                    style={{ color: "oklch(0.35 0.18 27)" }}
                  >
                    यह row delete करें?
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 px-3 text-xs font-semibold"
                    onClick={() => {
                      onChange(rows.filter((r) => r._id !== row._id));
                      setConfirmDeleteId(null);
                    }}
                  >
                    हाँ
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-3 text-xs font-semibold"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    नहीं
                  </Button>
                </div>
              );
            }

            return (
              <div
                key={row._id}
                className="grid gap-1 px-3 py-2 bg-card hover:bg-muted/20 transition-colors"
                style={{ gridTemplateColumns: "1fr 60px 60px 80px 32px" }}
              >
                {/* Item name with dropdown */}
                <div className="relative">
                  <Input
                    type="text"
                    value={row.name}
                    onChange={(e) => {
                      updateRow(row._id, { name: e.target.value });
                      setOpenDropdownId(row._id);
                    }}
                    onFocus={() => setOpenDropdownId(row._id)}
                    onBlur={() => {
                      // Small delay to allow dropdown clicks
                      setTimeout(() => setOpenDropdownId(null), 150);
                    }}
                    placeholder="Item..."
                    className="h-8 text-xs w-full"
                    autoComplete="off"
                  />
                  {/* Dropdown */}
                  {isOpen && (filteredCats.length > 0 || isNewCat) && (
                    <div
                      className="absolute z-50 top-full left-0 mt-1 w-56 rounded-md border bg-popover shadow-lg overflow-hidden"
                      style={{ borderColor: "oklch(0.85 0.025 60)" }}
                    >
                      {filteredCats.length > 0 && (
                        <div className="max-h-36 overflow-y-auto">
                          {filteredCats.map((cat) => (
                            <button
                              key={cat.name}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                selectCategory(row._id, cat);
                              }}
                              className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-accent transition-colors text-left"
                            >
                              <span className="font-medium truncate">
                                {cat.name}
                              </span>
                              {cat.defaultPrice > 0 && (
                                <span className="font-mono-nums text-muted-foreground ml-2 shrink-0">
                                  ₹{cat.defaultPrice.toLocaleString("en-IN")}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      {isNewCat && (
                        <div
                          className="border-t p-2"
                          style={{ borderColor: "oklch(0.85 0.025 60)" }}
                        >
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSaveAsCategory(row._id, row.name, row.rate);
                            }}
                            disabled={savingCat}
                            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs rounded border transition-colors"
                            style={{
                              color: "oklch(0.40 0.16 145)",
                              borderColor: "oklch(0.78 0.09 145 / 0.40)",
                            }}
                          >
                            <Plus className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {savingCat
                                ? "Saving..."
                                : `Save "${row.name.trim()}" as item`}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Qty */}
                <Input
                  type="number"
                  value={row.quantity}
                  onChange={(e) =>
                    updateRow(row._id, { quantity: e.target.value })
                  }
                  placeholder="0"
                  className="h-8 text-xs text-right font-mono-nums"
                  min="0"
                />

                {/* Free Qty */}
                <Input
                  type="number"
                  value={row.freeQuantity}
                  onChange={(e) =>
                    updateRow(row._id, { freeQuantity: e.target.value })
                  }
                  placeholder="0"
                  className="h-8 text-xs text-right font-mono-nums"
                  min="0"
                />

                {/* Amount (calculated) */}
                <div className="flex items-center justify-end h-8">
                  <span
                    className="font-mono-nums text-xs font-semibold"
                    style={{ color: "oklch(0.44 0.16 145)" }}
                  >
                    ₹{row.amount.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(row._id)}
                  className="h-8 w-8 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer total */}
      {rows.length > 0 && (
        <div
          className="px-4 py-2 border-t flex items-center justify-between"
          style={{
            background: "oklch(0.92 0.06 145 / 0.12)",
            borderColor: "oklch(0.78 0.09 145 / 0.30)",
          }}
        >
          <span
            className="text-xs font-medium"
            style={{ color: "oklch(0.50 0.04 40)" }}
          >
            {rows.length} item{rows.length !== 1 ? "s" : ""}
          </span>
          <span
            className="font-mono-nums font-semibold text-sm"
            style={{ color: "oklch(0.40 0.16 145)" }}
          >
            ₹{totalSale.toLocaleString("en-IN")}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Convert SaleRowState → SaleItem for backend ───────────

function toSaleItems(rows: SaleRowState[]) {
  return rows
    .filter((r) => r.name.trim() !== "")
    .map((r) => ({
      name: r.name,
      quantity: BigInt(Math.round(Number.parseFloat(r.quantity) || 0)),
      freeQuantity: BigInt(Math.round(Number.parseFloat(r.freeQuantity) || 0)),
      amount: r.amount,
    }));
}

// ── Main Page ─────────────────────────────────────────────

type ShiftType = "morning" | "evening";

export function DailyEntryPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [activeShift, setActiveShift] = useState<ShiftType>("morning");

  // Morning shift state
  const [morningPurchases, setMorningPurchases] = useState<ItemWithId[]>([]);
  const [morningExpenses, setMorningExpenses] = useState<ItemWithId[]>([]);
  const [morningSales, setMorningSales] = useState<SaleRowState[]>([]);

  // Evening shift state
  const [eveningPurchases, setEveningPurchases] = useState<ItemWithId[]>([]);
  const [eveningExpenses, setEveningExpenses] = useState<ItemWithId[]>([]);
  const [eveningSales, setEveningSales] = useState<SaleRowState[]>([]);

  const { data: entry, isLoading: entryLoading } = useEntryByDate(selectedDate);
  const { data: purchaseCategories = [] } = usePurchaseCategoriesWithPrice();
  const { data: expenseCategories = [] } = useExpenseCategoriesWithPrice();
  const { data: saleCategories = [] } = useSaleCategoriesWithPrice();

  const saveEntry = useSaveEntry();
  const addPurchaseCat = useAddPurchaseCategoryWithPrice();
  const addExpenseCat = useAddExpenseCategoryWithPrice();
  const addSaleCat = useAddSaleCategoryWithPrice();
  const deletePurchaseCat = useDeletePurchaseCategoryWithPrice();
  const deleteExpenseCat = useDeleteExpenseCategoryWithPrice();

  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const greeting = getTodayGreeting();

  // Load existing entry data when date changes
  useEffect(() => {
    if (entry) {
      setMorningPurchases(
        (entry.morning.purchases ?? []).map(createItemWithId),
      );
      setMorningExpenses((entry.morning.expenses ?? []).map(createItemWithId));
      setMorningSales((entry.morning.sales ?? []).map(saleRowFromSaleItem));
      setEveningPurchases(
        (entry.evening.purchases ?? []).map(createItemWithId),
      );
      setEveningExpenses((entry.evening.expenses ?? []).map(createItemWithId));
      setEveningSales((entry.evening.sales ?? []).map(saleRowFromSaleItem));
    } else if (!entryLoading) {
      setMorningPurchases([]);
      setMorningExpenses([]);
      setMorningSales([]);
      setEveningPurchases([]);
      setEveningExpenses([]);
      setEveningSales([]);
    }
  }, [entry, entryLoading]);

  // Active shift data (what's currently displayed)
  const purchases =
    activeShift === "morning" ? morningPurchases : eveningPurchases;
  const expenses =
    activeShift === "morning" ? morningExpenses : eveningExpenses;
  const saleRows = activeShift === "morning" ? morningSales : eveningSales;
  const setPurchases =
    activeShift === "morning" ? setMorningPurchases : setEveningPurchases;
  const setExpenses =
    activeShift === "morning" ? setMorningExpenses : setEveningExpenses;
  const setSaleRows =
    activeShift === "morning" ? setMorningSales : setEveningSales;

  // Derived calculations
  const totalPurchase = purchases.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpense = expenses.reduce((s, i) => s + (i.amount || 0), 0);
  const totalSale = saleRows.reduce((s, r) => s + r.amount, 0);
  const profitLoss = totalSale - totalPurchase - totalExpense;

  // Combined totals across both shifts
  const allPurchaseTotal =
    morningPurchases.reduce((s, i) => s + (i.amount || 0), 0) +
    eveningPurchases.reduce((s, i) => s + (i.amount || 0), 0);
  const allExpenseTotal =
    morningExpenses.reduce((s, i) => s + (i.amount || 0), 0) +
    eveningExpenses.reduce((s, i) => s + (i.amount || 0), 0);
  const allSaleTotal =
    morningSales.reduce((s, r) => s + r.amount, 0) +
    eveningSales.reduce((s, r) => s + r.amount, 0);
  const allProfitLoss = allSaleTotal - allPurchaseTotal - allExpenseTotal;

  // Convert SaleRowState to SaleItem for display in SummaryCard
  const activeSaleItems = saleRows
    .filter((r) => r.name.trim() !== "")
    .map((r) => ({
      name: r.name,
      quantity: BigInt(Math.round(Number.parseFloat(r.quantity) || 0)),
      freeQuantity: BigInt(Math.round(Number.parseFloat(r.freeQuantity) || 0)),
      amount: r.amount,
    }));

  const handleSave = useCallback(async () => {
    try {
      await saveEntry.mutateAsync({
        date: selectedDate,
        morning: {
          purchases: morningPurchases.map(
            ({ description, amount, outlet }) => ({
              description,
              amount,
              outlet: outlet || "Common",
            }),
          ),
          expenses: morningExpenses.map(({ description, amount, outlet }) => ({
            description,
            amount,
            outlet: outlet || "Common",
          })),
          sales: toSaleItems(morningSales),
        },
        evening: {
          purchases: eveningPurchases.map(
            ({ description, amount, outlet }) => ({
              description,
              amount,
              outlet: outlet || "Common",
            }),
          ),
          expenses: eveningExpenses.map(({ description, amount, outlet }) => ({
            description,
            amount,
            outlet: outlet || "Common",
          })),
          sales: toSaleItems(eveningSales),
        },
      });
      toast.success("हिसाब save हो गया! ✓", {
        description: `${selectedDate} का data सुरक्षित है।`,
      });
    } catch {
      toast.error("Save नहीं हुआ", {
        description: "दोबारा कोशिश करें।",
      });
    }
  }, [
    selectedDate,
    morningPurchases,
    morningExpenses,
    morningSales,
    eveningPurchases,
    eveningExpenses,
    eveningSales,
    saveEntry,
  ]);

  const isToday = selectedDate === getTodayStr();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-28 space-y-4">
      {/* Welcoming Home Header */}
      <div
        className="rounded-2xl px-5 py-4 border"
        style={{
          background: "oklch(0.10 0.030 25)",
          borderColor: "oklch(0.22 0.05 25)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.12em] mb-1"
              style={{ color: "oklch(0.50 0.06 35)" }}
            >
              {isToday ? greeting.hindi : "पुरानी Entry"}
            </p>
            <h2
              className="font-display font-bold text-2xl leading-tight"
              style={{ color: "oklch(0.96 0.018 72)" }}
            >
              {isToday ? "आज का हिसाब" : "पुराना हिसाब"}
            </h2>
            <p
              className="text-sm font-medium mt-0.5"
              style={{ color: "oklch(0.65 0.06 40)" }}
            >
              {isToday ? greeting.date : selectedDate}
            </p>
          </div>
          {/* Combined P/L live badge */}
          {(allSaleTotal > 0 ||
            allPurchaseTotal > 0 ||
            allExpenseTotal > 0) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="shrink-0 text-right"
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-wide mb-1"
                style={{ color: "oklch(0.45 0.04 35)" }}
              >
                कुल P/L
              </p>
              <span
                className="inline-block font-mono-nums font-bold text-lg rounded-xl px-3 py-1"
                style={{
                  background:
                    allProfitLoss > 0
                      ? "oklch(0.25 0.08 145)"
                      : allProfitLoss < 0
                        ? "oklch(0.22 0.08 27)"
                        : "oklch(0.18 0.03 25)",
                  color:
                    allProfitLoss > 0
                      ? "oklch(0.80 0.18 145)"
                      : allProfitLoss < 0
                        ? "oklch(0.80 0.18 27)"
                        : "oklch(0.72 0.04 45)",
                }}
              >
                {allProfitLoss >= 0 ? "+" : "−"}₹
                {Math.abs(allProfitLoss).toLocaleString("en-IN")}
              </span>
            </motion.div>
          )}
        </div>
      </div>

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
        <div className="flex-1">
          <Label
            htmlFor="entry-date"
            className="text-xs text-muted-foreground mb-1 block"
          >
            तारीख बदलें (Change Date)
          </Label>
          <input
            id="entry-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none outline-none text-foreground font-semibold text-sm w-full cursor-pointer"
          />
        </div>
        {entryLoading && (
          <Loader2
            className="h-4 w-4 animate-spin"
            style={{ color: "oklch(0.42 0.22 25)" }}
          />
        )}
      </div>

      {/* Shift Toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveShift("morning")}
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={
            activeShift === "morning"
              ? {
                  background: "oklch(0.42 0.22 25)",
                  color: "oklch(0.97 0.015 72)",
                  boxShadow: "0 4px 16px oklch(0.42 0.22 25 / 0.35)",
                  border: "2px solid oklch(0.42 0.22 25)",
                }
              : {
                  background: "oklch(0.96 0.018 72)",
                  color: "oklch(0.40 0.04 35)",
                  border: "2px solid oklch(0.85 0.025 60)",
                }
          }
        >
          <span className="text-lg">🌅</span>
          <div className="text-left">
            <div className="font-bold leading-tight">Morning</div>
            <div className="text-[11px] opacity-75 leading-tight">
              सुबह की Shift
            </div>
          </div>
          {activeShift === "morning" && (
            <span
              className="ml-auto text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
              style={{
                background: "oklch(0.28 0.12 25)",
                color: "oklch(0.90 0.10 25)",
              }}
            >
              Active
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveShift("evening")}
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={
            activeShift === "evening"
              ? {
                  background: "oklch(0.25 0.10 240)",
                  color: "oklch(0.92 0.06 240)",
                  boxShadow: "0 4px 16px oklch(0.35 0.14 240 / 0.35)",
                  border: "2px solid oklch(0.45 0.18 240)",
                }
              : {
                  background: "oklch(0.96 0.018 72)",
                  color: "oklch(0.40 0.04 35)",
                  border: "2px solid oklch(0.85 0.025 60)",
                }
          }
        >
          <span className="text-lg">🌆</span>
          <div className="text-left">
            <div className="font-bold leading-tight">Evening</div>
            <div className="text-[11px] opacity-75 leading-tight">
              शाम की Shift
            </div>
          </div>
          {activeShift === "evening" && (
            <span
              className="ml-auto text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
              style={{
                background: "oklch(0.18 0.06 240)",
                color: "oklch(0.82 0.10 240)",
              }}
            >
              Active
            </span>
          )}
        </button>
      </div>

      {/* Loading skeleton */}
      {entryLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedDate}-${activeShift}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Shift indicator banner */}
            <div
              className="px-4 py-2.5 rounded-xl flex items-center gap-2 border"
              style={
                activeShift === "morning"
                  ? {
                      background: "oklch(0.42 0.22 25 / 0.08)",
                      borderColor: "oklch(0.42 0.22 25 / 0.25)",
                    }
                  : {
                      background: "oklch(0.35 0.14 240 / 0.08)",
                      borderColor: "oklch(0.45 0.18 240 / 0.25)",
                    }
              }
            >
              <span className="text-base">
                {activeShift === "morning" ? "🌅" : "🌆"}
              </span>
              <div>
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{
                    color:
                      activeShift === "morning"
                        ? "oklch(0.42 0.22 25)"
                        : "oklch(0.55 0.18 240)",
                  }}
                >
                  {activeShift === "morning"
                    ? "Morning Shift — सुबह"
                    : "Evening Shift — शाम"}
                </span>
                <p className="text-[10px] text-muted-foreground">
                  नीचे {activeShift === "morning" ? "सुबह" : "शाम"} की purchases,
                  expenses, और sale भरें
                </p>
              </div>
            </div>

            {/* Purchases */}
            <ItemList
              items={purchases}
              categories={purchaseCategories}
              onChange={setPurchases}
              onAddCategory={(name, defaultPrice) =>
                addPurchaseCat.mutateAsync({ name, defaultPrice })
              }
              onDeleteCategory={(name) => deletePurchaseCat.mutateAsync(name)}
              label="Purchases (खरीदारी)"
              color="saffron"
            />

            {/* Expenses */}
            <ItemList
              items={expenses}
              categories={expenseCategories}
              onChange={setExpenses}
              onAddCategory={(name, defaultPrice) =>
                addExpenseCat.mutateAsync({ name, defaultPrice })
              }
              onDeleteCategory={(name) => deleteExpenseCat.mutateAsync(name)}
              label="Expenses (खर्च)"
              color="rose"
            />

            {/* Sale Items */}
            <SaleItemsList
              rows={saleRows}
              categories={saleCategories}
              onChange={setSaleRows}
              onAddCategory={(name, defaultPrice) =>
                addSaleCat.mutateAsync({ name, defaultPrice })
              }
            />

            {/* Summary for this shift */}
            <SummaryCard
              totalPurchase={totalPurchase}
              totalExpense={totalExpense}
              totalSale={totalSale}
              profitLoss={profitLoss}
              saleItems={activeSaleItems}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Sticky Save Bar — always visible at bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-3"
        style={{
          background:
            "linear-gradient(to top, oklch(0.96 0.018 72) 70%, transparent)",
        }}
      >
        <div className="max-w-2xl mx-auto space-y-2">
          <Button
            ref={saveButtonRef}
            size="lg"
            className="w-full h-14 text-base font-bold gap-2 shadow-lg tracking-wide"
            onClick={handleSave}
            disabled={saveEntry.isPending}
            style={{
              background: saveEntry.isPending
                ? undefined
                : "oklch(0.42 0.22 25)",
              color: "oklch(0.97 0.015 72)",
              boxShadow: "0 4px 20px oklch(0.42 0.22 25 / 0.40)",
            }}
          >
            {saveEntry.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Save हो रहा है...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save करें — {selectedDate}
              </>
            )}
          </Button>
          {/* Reassurance note */}
          <div className="flex items-center justify-center gap-1.5">
            <Lock
              className="h-3 w-3"
              style={{ color: "oklch(0.52 0.08 145)" }}
            />
            <p
              className="text-xs font-medium text-center"
              style={{ color: "oklch(0.48 0.06 145)" }}
            >
              आपका data सुरक्षित रहता है — कोई auto-delete नहीं होता
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
