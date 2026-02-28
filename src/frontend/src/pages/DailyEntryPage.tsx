import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Loader2, Lock, Save } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ItemList,
  type ItemWithId,
  createItemWithId,
} from "../components/ItemList";
import { SummaryCard } from "../components/SummaryCard";
import {
  useAddExpenseCategoryWithPrice,
  useAddPurchaseCategoryWithPrice,
  useDeleteExpenseCategoryWithPrice,
  useDeletePurchaseCategoryWithPrice,
  useEntryByDate,
  useExpenseCategoriesWithPrice,
  usePurchaseCategoriesWithPrice,
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

export function DailyEntryPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [purchases, setPurchases] = useState<ItemWithId[]>([]);
  const [expenses, setExpenses] = useState<ItemWithId[]>([]);
  const [rajajiSale, setRajajiSale] = useState<number>(0);
  const [oldRaoSale, setOldRaoSale] = useState<number>(0);
  const [saroorpurSale, setSaroorpurSale] = useState<number>(0);

  const { data: entry, isLoading: entryLoading } = useEntryByDate(selectedDate);
  const { data: purchaseCategories = [] } = usePurchaseCategoriesWithPrice();
  const { data: expenseCategories = [] } = useExpenseCategoriesWithPrice();
  const saveEntry = useSaveEntry();
  const addPurchaseCat = useAddPurchaseCategoryWithPrice();
  const addExpenseCat = useAddExpenseCategoryWithPrice();
  const deletePurchaseCat = useDeletePurchaseCategoryWithPrice();
  const deleteExpenseCat = useDeleteExpenseCategoryWithPrice();

  // Refs for sale inputs and save button
  const rajajiRef = useRef<HTMLInputElement>(null);
  const oldRaoRef = useRef<HTMLInputElement>(null);
  const saroorpurRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  const greeting = getTodayGreeting();

  // Load existing entry data when date changes
  useEffect(() => {
    if (entry) {
      setPurchases((entry.purchases ?? []).map(createItemWithId));
      setExpenses((entry.expenses ?? []).map(createItemWithId));
      setRajajiSale(entry.rajajiSale ?? 0);
      setOldRaoSale(entry.oldRaoSale ?? 0);
      setSaroorpurSale(entry.saroorpurSale ?? 0);
    } else if (!entryLoading) {
      setPurchases([]);
      setExpenses([]);
      setRajajiSale(0);
      setOldRaoSale(0);
      setSaroorpurSale(0);
    }
  }, [entry, entryLoading]);

  // Derived calculations (computed from state, no effects needed)
  const totalPurchase = purchases.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpense = expenses.reduce((s, i) => s + (i.amount || 0), 0);
  const totalSale = rajajiSale + oldRaoSale + saroorpurSale;
  const profitLoss = totalSale - totalPurchase - totalExpense;

  const handleSave = useCallback(async () => {
    try {
      await saveEntry.mutateAsync({
        date: selectedDate,
        purchases: purchases.map(({ description, amount, outlet }) => ({
          description,
          amount,
          outlet: outlet || "Common",
        })),
        expenses: expenses.map(({ description, amount, outlet }) => ({
          description,
          amount,
          outlet: outlet || "Common",
        })),
        rajajiSale,
        oldRaoSale,
        saroorpurSale,
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
    purchases,
    expenses,
    rajajiSale,
    oldRaoSale,
    saroorpurSale,
    saveEntry,
  ]);

  const saleInputClass =
    "font-mono-nums text-right text-base font-semibold h-10 text-primary";

  const isToday = selectedDate === getTodayStr();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-28 space-y-5">
      {/* Welcoming Home Header */}
      <div
        className="rounded-2xl px-5 py-4 border"
        style={{
          background: "oklch(0.20 0.06 50)",
          borderColor: "oklch(0.30 0.07 50)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.12em] mb-1"
              style={{ color: "oklch(0.62 0.08 60)" }}
            >
              {isToday ? greeting.hindi : "पुरानी Entry"}
            </p>
            <h2
              className="font-display font-bold text-2xl leading-tight"
              style={{ color: "oklch(0.97 0.025 65)" }}
            >
              {isToday ? "आज का हिसाब" : "पुराना हिसाब"}
            </h2>
            <p
              className="text-sm font-medium mt-0.5"
              style={{ color: "oklch(0.72 0.08 60)" }}
            >
              {isToday ? greeting.date : selectedDate}
            </p>
          </div>
          {/* Profit/Loss live badge */}
          {(totalSale > 0 || totalPurchase > 0 || totalExpense > 0) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="shrink-0 text-right"
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-wide mb-1"
                style={{ color: "oklch(0.55 0.05 60)" }}
              >
                अभी का
              </p>
              <span
                className="inline-block font-mono-nums font-bold text-lg rounded-xl px-3 py-1"
                style={{
                  background:
                    profitLoss > 0
                      ? "oklch(0.30 0.09 145)"
                      : profitLoss < 0
                        ? "oklch(0.28 0.09 27)"
                        : "oklch(0.26 0.05 55)",
                  color:
                    profitLoss > 0
                      ? "oklch(0.82 0.18 145)"
                      : profitLoss < 0
                        ? "oklch(0.82 0.18 27)"
                        : "oklch(0.75 0.05 55)",
                }}
              >
                {profitLoss >= 0 ? "+" : "−"}₹
                {Math.abs(profitLoss).toLocaleString("en-IN")}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Date Picker */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 shadow-xs">
        <CalendarIcon className="h-5 w-5 text-primary shrink-0" />
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
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        )}
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
            key={selectedDate}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
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

            {/* Sales Section */}
            <div className="rounded-lg border border-border overflow-hidden shadow-xs">
              <div className="px-4 py-2.5 bg-profit/10 border-b border-profit/20 flex items-center">
                <h3 className="font-semibold text-sm tracking-wide uppercase profit-text">
                  Sales (बिक्री)
                </h3>
              </div>
              <div className="divide-y divide-border">
                <SaleRow
                  label="Rajaji Sale"
                  value={rajajiSale}
                  onChange={setRajajiSale}
                  inputClass={saleInputClass}
                  inputRef={rajajiRef}
                  onEnter={() => oldRaoRef.current?.focus()}
                />
                <SaleRow
                  label="Old Rao Sale"
                  value={oldRaoSale}
                  onChange={setOldRaoSale}
                  inputClass={saleInputClass}
                  inputRef={oldRaoRef}
                  onEnter={() => saroorpurRef.current?.focus()}
                />
                <SaleRow
                  label="Saroorpur Sale"
                  value={saroorpurSale}
                  onChange={setSaroorpurSale}
                  inputClass={saleInputClass}
                  inputRef={saroorpurRef}
                  onEnter={() => saveButtonRef.current?.focus()}
                />
              </div>
              <div className="px-4 py-2 bg-profit/10 border-t border-profit/20 flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  3 outlets
                </span>
                <span className="font-mono-nums font-semibold text-sm profit-text">
                  ₹{totalSale.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Summary */}
            <SummaryCard
              totalPurchase={totalPurchase}
              totalExpense={totalExpense}
              totalSale={totalSale}
              rajajiSale={rajajiSale}
              oldRaoSale={oldRaoSale}
              saroorpurSale={saroorpurSale}
              profitLoss={profitLoss}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Sticky Save Bar — always visible at bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-3"
        style={{
          background:
            "linear-gradient(to top, oklch(0.13 0.05 50) 70%, transparent)",
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
                : "oklch(0.55 0.18 145)",
              color: "oklch(0.99 0 0)",
              boxShadow: "0 4px 20px oklch(0.55 0.18 145 / 0.35)",
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
              style={{ color: "oklch(0.62 0.08 145)" }}
            />
            <p
              className="text-xs font-medium text-center"
              style={{ color: "oklch(0.58 0.06 145)" }}
            >
              आपका data सुरक्षित रहता है — कोई auto-delete नहीं होता
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SaleRow({
  label,
  value,
  onChange,
  inputClass,
  inputRef,
  onEnter,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  inputClass?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onEnter?: () => void;
}) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onEnter) {
        e.preventDefault();
        onEnter();
      }
    },
    [onEnter],
  );

  return (
    <div className="flex items-center px-4 py-3 bg-card hover:bg-muted/20 transition-colors">
      <span className="flex-1 text-sm font-medium text-foreground">
        {label}
      </span>
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground text-sm">₹</span>
        <Input
          ref={inputRef}
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number.parseFloat(e.target.value) || 0)}
          onKeyDown={handleKeyDown}
          placeholder="0"
          className={`w-36 ${inputClass ?? ""}`}
          min="0"
          step="0.01"
        />
      </div>
    </div>
  );
}
