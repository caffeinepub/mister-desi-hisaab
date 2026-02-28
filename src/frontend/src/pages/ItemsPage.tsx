import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Check,
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { CategoryItem } from "../backend.d.ts";
import {
  useAddExpenseCategoryWithPrice,
  useAddPurchaseCategoryWithPrice,
  useAddSaleCategoryWithPrice,
  useDeleteExpenseCategoryWithPrice,
  useDeletePurchaseCategoryWithPrice,
  useDeleteSaleCategoryWithPrice,
  useExpenseCategoriesWithPrice,
  usePurchaseCategoriesWithPrice,
  useSaleCategoriesWithPrice,
  useUpdateExpenseCategoryPrice,
  useUpdatePurchaseCategoryPrice,
  useUpdateSaleCategoryPrice,
} from "../hooks/useQueries";

// ── Inline price editor ──────────────────────────────────

function PriceEditor({
  item,
  onSave,
  color,
}: {
  item: CategoryItem;
  onSave: (newPrice: number) => Promise<void>;
  color: "saffron" | "rose" | "green";
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(item.defaultPrice || ""));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const newPrice = Number.parseFloat(value) || 0;
    setSaving(true);
    try {
      await onSave(newPrice);
      setEditing(false);
      toast.success(`"${item.name}" का rate update हो गया`);
    } catch {
      toast.error("Rate update नहीं हुआ");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(String(item.defaultPrice || ""));
    setEditing(false);
  };

  const accentColor =
    color === "saffron"
      ? "oklch(0.62 0.18 52)"
      : color === "rose"
        ? "oklch(0.55 0.22 27)"
        : "oklch(0.48 0.18 145)";

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground text-xs">₹</span>
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          className="w-24 h-7 text-right font-mono-nums text-xs"
          autoFocus
          min="0"
          step="0.01"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-7 w-7 flex items-center justify-center rounded text-green-400 hover:bg-green-400/10 transition-colors"
          title="Save"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 group rounded px-2 py-0.5 hover:bg-muted/40 transition-colors"
      title="Click to edit price"
    >
      <span
        className="font-mono-nums text-sm font-semibold"
        style={{ color: accentColor }}
      >
        {item.defaultPrice > 0
          ? `₹${item.defaultPrice.toLocaleString("en-IN")}`
          : "₹ —"}
      </span>
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// ── Single item row ──────────────────────────────────────

function ItemRow({
  item,
  color,
  onUpdatePrice,
  onDelete,
}: {
  item: CategoryItem;
  color: "saffron" | "rose" | "green";
  onUpdatePrice: (newPrice: number) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
      toast.success(`"${item.name}" delete हो गया`);
    } catch {
      toast.error("Delete नहीं हुआ");
      setDeleting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.18 }}
    >
      <AnimatePresence mode="wait">
        {confirmDelete ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
            style={{ background: "oklch(0.96 0.03 27)" }}
          >
            <AlertTriangle
              className="h-4 w-4 shrink-0"
              style={{ color: "oklch(0.52 0.22 27)" }}
            />
            <span
              className="flex-1 text-sm font-medium truncate"
              style={{ color: "oklch(0.35 0.18 27)" }}
            >
              "{item.name}" delete करें?
            </span>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 px-3 text-xs shrink-0"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "हाँ"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-3 text-xs shrink-0"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              नहीं
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="normal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-card hover:bg-muted/20 transition-colors group"
          >
            <span className="flex-1 text-sm font-medium text-foreground truncate">
              {item.name}
            </span>
            <PriceEditor item={item} onSave={onUpdatePrice} color={color} />
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
              title="Delete item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Add new item form ────────────────────────────────────

function AddItemForm({
  color,
  onAdd,
  onCancel,
}: {
  color: "saffron" | "rose" | "green";
  onAdd: (name: string, defaultPrice: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const accentColor =
    color === "saffron"
      ? "oklch(0.62 0.18 52)"
      : color === "rose"
        ? "oklch(0.55 0.22 27)"
        : "oklch(0.48 0.18 145)";
  const bgColor =
    color === "saffron"
      ? "oklch(0.20 0.06 50 / 0.4)"
      : color === "rose"
        ? "oklch(0.18 0.06 27 / 0.4)"
        : "oklch(0.18 0.06 145 / 0.4)";

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Item का नाम डालें");
      return;
    }
    const defaultPrice = Number.parseFloat(price) || 0;
    setSaving(true);
    try {
      await onAdd(trimmed, defaultPrice);
      toast.success(`"${trimmed}" add हो गया!`);
      onCancel();
    } catch {
      toast.error("Add नहीं हुआ, दोबारा कोशिश करें");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="mx-1 mb-2 rounded-lg p-3 border"
        style={{
          background: bgColor,
          borderColor: `${accentColor}40`,
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wide mb-2"
          style={{ color: accentColor }}
        >
          नया Item जोड़ें
        </p>
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Item का नाम (e.g. Doodh, Maida...)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                // Move to price
                const priceInput = e.currentTarget
                  .closest(".space-y-2")
                  ?.querySelector('input[type="number"]') as HTMLInputElement;
                priceInput?.focus();
              }
              if (e.key === "Escape") onCancel();
            }}
            className="h-9 text-sm"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm shrink-0">₹</span>
            <Input
              type="number"
              placeholder="Default price (optional)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") onCancel();
              }}
              className="flex-1 h-9 text-sm font-mono-nums"
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-8 text-xs font-semibold gap-1"
              style={{
                background: accentColor,
                color: "oklch(0.99 0 0)",
              }}
              onClick={handleSubmit}
              disabled={saving || !name.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Save करें
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Items section card ───────────────────────────────────

function ItemSection({
  title,
  emoji,
  items,
  isLoading,
  color,
  onAdd,
  onUpdatePrice,
  onDelete,
}: {
  title: string;
  emoji: string;
  items: CategoryItem[];
  isLoading: boolean;
  color: "saffron" | "rose" | "green";
  onAdd: (name: string, defaultPrice: number) => Promise<void>;
  onUpdatePrice: (name: string, newPrice: number) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
}) {
  const [showAddForm, setShowAddForm] = useState(false);

  const accentColor =
    color === "saffron"
      ? "oklch(0.62 0.18 52)"
      : color === "rose"
        ? "oklch(0.55 0.22 27)"
        : "oklch(0.48 0.18 145)";
  const headerBg =
    color === "saffron"
      ? "oklch(0.20 0.07 55 / 0.6)"
      : color === "rose"
        ? "oklch(0.18 0.06 27 / 0.6)"
        : "oklch(0.18 0.07 145 / 0.5)";
  const borderColor =
    color === "saffron"
      ? "oklch(0.35 0.10 55)"
      : color === "rose"
        ? "oklch(0.32 0.10 27)"
        : "oklch(0.35 0.12 145)";

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor }}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: headerBg }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{emoji}</span>
          <div>
            <h3 className="font-bold text-sm" style={{ color: accentColor }}>
              {title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading..." : `${items.length} items`}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5 text-xs font-semibold"
          style={{ color: accentColor }}
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? (
            <>
              <X className="h-3.5 w-3.5" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="p-2 space-y-0.5 min-h-[80px]">
        <AnimatePresence>
          {showAddForm && (
            <AddItemForm
              key="add-form"
              color={color}
              onAdd={onAdd}
              onCancel={() => setShowAddForm(false)}
            />
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2
              className="h-5 w-5 animate-spin"
              style={{ color: accentColor }}
            />
          </div>
        ) : items.length === 0 && !showAddForm ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            <p>अभी कोई item नहीं है</p>
            <p className="text-xs mt-1 opacity-70">
              "Add Item" बटन से नया item जोड़ें
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {items.map((item) => (
              <ItemRow
                key={item.name}
                item={item}
                color={color}
                onUpdatePrice={(newPrice) => onUpdatePrice(item.name, newPrice)}
                onDelete={() => onDelete(item.name)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div
          className="px-4 py-2 border-t flex items-center justify-between"
          style={{ background: headerBg, borderColor }}
        >
          <span className="text-xs text-muted-foreground">
            Price पर click करके edit करें
          </span>
          <span
            className="text-xs font-semibold font-mono-nums"
            style={{ color: accentColor }}
          >
            Avg ₹
            {items.length > 0
              ? Math.round(
                  items
                    .filter((i) => i.defaultPrice > 0)
                    .reduce((s, i) => s + i.defaultPrice, 0) /
                    Math.max(items.filter((i) => i.defaultPrice > 0).length, 1),
                ).toLocaleString("en-IN")
              : 0}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────

export function ItemsPage() {
  const { data: purchaseItems = [], isLoading: purchaseLoading } =
    usePurchaseCategoriesWithPrice();
  const { data: expenseItems = [], isLoading: expenseLoading } =
    useExpenseCategoriesWithPrice();
  const { data: saleItems = [], isLoading: saleLoading } =
    useSaleCategoriesWithPrice();

  const addPurchaseItem = useAddPurchaseCategoryWithPrice();
  const addExpenseItem = useAddExpenseCategoryWithPrice();
  const addSaleItem = useAddSaleCategoryWithPrice();
  const updatePurchasePrice = useUpdatePurchaseCategoryPrice();
  const updateExpensePrice = useUpdateExpenseCategoryPrice();
  const updateSalePrice = useUpdateSaleCategoryPrice();
  const deletePurchaseItem = useDeletePurchaseCategoryWithPrice();
  const deleteExpenseItem = useDeleteExpenseCategoryWithPrice();
  const deleteSaleItem = useDeleteSaleCategoryWithPrice();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-20 space-y-5">
      {/* Page header */}
      <div
        className="rounded-2xl px-5 py-4 border"
        style={{
          background: "oklch(0.10 0.030 25)",
          borderColor: "oklch(0.22 0.05 25)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.20 0.07 25)" }}
          >
            <Package
              className="h-5 w-5"
              style={{ color: "oklch(0.80 0.18 25)" }}
            />
          </div>
          <div>
            <h2
              className="font-display font-bold text-xl leading-tight"
              style={{ color: "oklch(0.96 0.018 72)" }}
            >
              Items Manager
            </h2>
            <p
              className="text-sm font-medium mt-0.5"
              style={{ color: "oklch(0.62 0.06 40)" }}
            >
              आइटम बनाएं, rate set करें, manage करें
            </p>
          </div>
        </div>
      </div>

      {/* Help tip */}
      <div
        className="rounded-xl px-4 py-3 border text-sm"
        style={{
          background: "oklch(0.14 0.04 25 / 0.5)",
          borderColor: "oklch(0.28 0.06 25)",
          color: "oklch(0.68 0.06 40)",
        }}
      >
        <p
          className="font-semibold text-xs uppercase tracking-wide mb-1"
          style={{ color: "oklch(0.55 0.10 35)" }}
        >
          💡 कैसे काम करता है?
        </p>
        <p>
          यहाँ item add करें और उसका <strong>default rate</strong> set करें। Daily
          Entry में जब भी वो item select करें — <strong>rate खुद भर जाएगा</strong>।
          जरूरत पड़ने पर rate बदल भी सकते हैं।
        </p>
      </div>

      {/* Purchase Items */}
      <ItemSection
        title="Purchase Items (खरीदारी)"
        emoji="🛒"
        items={purchaseItems}
        isLoading={purchaseLoading}
        color="saffron"
        onAdd={(name, defaultPrice) =>
          addPurchaseItem.mutateAsync({ name, defaultPrice })
        }
        onUpdatePrice={(name, newPrice) =>
          updatePurchasePrice.mutateAsync({ name, newPrice })
        }
        onDelete={(name) => deletePurchaseItem.mutateAsync(name)}
      />

      {/* Expense Items */}
      <ItemSection
        title="Expense Items (खर्च)"
        emoji="💸"
        items={expenseItems}
        isLoading={expenseLoading}
        color="rose"
        onAdd={(name, defaultPrice) =>
          addExpenseItem.mutateAsync({ name, defaultPrice })
        }
        onUpdatePrice={(name, newPrice) =>
          updateExpensePrice.mutateAsync({ name, newPrice })
        }
        onDelete={(name) => deleteExpenseItem.mutateAsync(name)}
      />

      {/* Sale Items */}
      <ItemSection
        title="Sale Items (बिक्री)"
        emoji="🧾"
        items={saleItems}
        isLoading={saleLoading}
        color="green"
        onAdd={(name, defaultPrice) =>
          addSaleItem.mutateAsync({ name, defaultPrice })
        }
        onUpdatePrice={(name, newPrice) =>
          updateSalePrice.mutateAsync({ name, newPrice })
        }
        onDelete={(name) => deleteSaleItem.mutateAsync(name)}
      />
    </div>
  );
}
