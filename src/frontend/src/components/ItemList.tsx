import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CategoryItem, Item } from "../backend.d.ts";

// Items with internal stable IDs for React keys
export interface ItemWithId extends Item {
  _id: string;
}

let _idCounter = 0;
export function createItemWithId(item: Item): ItemWithId {
  return {
    ...item,
    outlet: item.outlet || "Common",
    _id: `item-${++_idCounter}`,
  };
}

// Outlet types
export type OutletName = "Rajaji" | "Old Rao" | "Saroorpur" | "Common";

const OUTLETS: {
  name: OutletName;
  short: string;
  bg: string;
  text: string;
  activeBg: string;
  activeText: string;
}[] = [
  {
    name: "Rajaji",
    short: "R",
    bg: "oklch(0.22 0.04 55)",
    text: "oklch(0.60 0.06 55)",
    activeBg: "oklch(0.62 0.18 52)",
    activeText: "oklch(0.99 0 0)",
  },
  {
    name: "Old Rao",
    short: "O",
    bg: "oklch(0.20 0.04 240)",
    text: "oklch(0.58 0.07 240)",
    activeBg: "oklch(0.58 0.18 240)",
    activeText: "oklch(0.99 0 0)",
  },
  {
    name: "Saroorpur",
    short: "S",
    bg: "oklch(0.20 0.04 300)",
    text: "oklch(0.58 0.07 300)",
    activeBg: "oklch(0.60 0.18 300)",
    activeText: "oklch(0.99 0 0)",
  },
  {
    name: "Common",
    short: "C",
    bg: "oklch(0.22 0.02 55)",
    text: "oklch(0.52 0.03 55)",
    activeBg: "oklch(0.42 0.04 55)",
    activeText: "oklch(0.92 0.02 65)",
  },
];

interface ItemRefs {
  descRef: React.RefObject<HTMLInputElement | null>;
  amountRef: React.RefObject<HTMLInputElement | null>;
}

interface ItemListProps {
  items: ItemWithId[];
  categories: CategoryItem[];
  onChange: (items: ItemWithId[]) => void;
  onAddCategory: (name: string, defaultPrice: number) => Promise<void>;
  onDeleteCategory: (name: string) => Promise<void>;
  onUpdateCategoryPrice?: (name: string, newPrice: number) => Promise<void>;
  label: string;
  color?: "saffron" | "rose";
}

interface ComboboxState {
  openId: string | null;
  inputValues: Record<string, string>;
  // Price input for "save as new category" flow
  newCatPrices: Record<string, string>;
}

export function ItemList({
  items,
  categories,
  onChange,
  onAddCategory,
  onDeleteCategory,
  label,
  color = "saffron",
}: ItemListProps) {
  const [combobox, setCombobox] = useState<ComboboxState>({
    openId: null,
    inputValues: {},
    newCatPrices: {},
  });
  const [savingCat, setSavingCat] = useState(false);
  const [deletingCat, setDeletingCat] = useState<string | null>(null);

  // Two-step row deletion
  const [confirmDeleteRowId, setConfirmDeleteRowId] = useState<string | null>(
    null,
  );

  // Two-step category deletion
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Ref map: itemId → { descRef, amountRef }
  const refsMap = useRef<Map<string, ItemRefs>>(new Map());

  // Pending focus: after addRow(), focus the new row's desc input
  const pendingFocusRef = useRef<"new-desc" | null>(null);

  // Get or create refs for an item id
  const getOrCreateRefs = useCallback((id: string): ItemRefs => {
    if (!refsMap.current.has(id)) {
      refsMap.current.set(id, {
        descRef: { current: null },
        amountRef: { current: null },
      });
    }
    return refsMap.current.get(id)!;
  }, []);

  // After items.length changes (new row added), focus the new row's desc input
  useEffect(() => {
    if (pendingFocusRef.current === "new-desc" && items.length > 0) {
      const lastItem = items[items.length - 1];
      const refs = refsMap.current.get(lastItem._id);
      if (refs?.descRef.current) {
        refs.descRef.current.focus();
        pendingFocusRef.current = null;
      }
    }
  }, [items.length, items]);

  // Close dropdown and cancel confirmations on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setCombobox((prev) => ({ ...prev, openId: null }));
        setConfirmDeleteRowId(null);
        setConfirmDeleteCat(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const addRow = useCallback(() => {
    pendingFocusRef.current = "new-desc";
    onChange([
      ...items,
      createItemWithId({ description: "", amount: 0, outlet: "Common" }),
    ]);
  }, [items, onChange]);

  // Step 1: Request delete confirmation for a row
  const requestDeleteRow = (id: string) => {
    setConfirmDeleteRowId(id);
    setCombobox((prev) => ({
      ...prev,
      openId: prev.openId === id ? null : prev.openId,
    }));
  };

  // Step 2: Confirmed — actually remove the row
  const confirmDeleteRow = (id: string) => {
    refsMap.current.delete(id);
    onChange(items.filter((item) => item._id !== id));
    setCombobox((prev) => {
      const newInputValues = { ...prev.inputValues };
      delete newInputValues[id];
      const newCatPrices = { ...prev.newCatPrices };
      delete newCatPrices[id];
      return {
        openId: prev.openId === id ? null : prev.openId,
        inputValues: newInputValues,
        newCatPrices,
      };
    });
    setConfirmDeleteRowId(null);
  };

  const cancelDeleteRow = () => {
    setConfirmDeleteRowId(null);
  };

  // When user selects a category from dropdown — auto-fill description AND amount
  const selectCategory = (id: string, cat: CategoryItem) => {
    onChange(
      items.map((item) =>
        item._id === id
          ? {
              ...item,
              description: cat.name,
              amount: cat.defaultPrice > 0 ? cat.defaultPrice : item.amount,
            }
          : item,
      ),
    );
    setCombobox((prev) => ({
      ...prev,
      openId: null,
      inputValues: { ...prev.inputValues, [id]: cat.name },
    }));
  };

  const updateAmount = (id: string, val: string) => {
    const amount = Number.parseFloat(val) || 0;
    onChange(
      items.map((item) => (item._id === id ? { ...item, amount } : item)),
    );
  };

  const updateOutlet = (id: string, outlet: OutletName) => {
    onChange(
      items.map((item) => (item._id === id ? { ...item, outlet } : item)),
    );
  };

  const getInputValue = (item: ItemWithId) =>
    combobox.inputValues[item._id] !== undefined
      ? combobox.inputValues[item._id]
      : item.description;

  const handleInputChange = (id: string, value: string) => {
    setCombobox((prev) => ({
      ...prev,
      openId: id,
      inputValues: { ...prev.inputValues, [id]: value },
    }));
    // Update description in real-time as user types
    onChange(
      items.map((item) =>
        item._id === id ? { ...item, description: value } : item,
      ),
    );
  };

  const handleInputFocus = (id: string) => {
    if (confirmDeleteRowId === id) return;
    setCombobox((prev) => ({ ...prev, openId: id }));
  };

  const handleSaveAsCategory = async (id: string) => {
    const inputVal = getInputValue(
      items.find((i) => i._id === id) ?? {
        _id: id,
        description: "",
        amount: 0,
        outlet: "Common",
      },
    );
    const name = inputVal.trim();
    if (!name) return;
    const priceStr = combobox.newCatPrices[id] ?? "";
    const defaultPrice = Number.parseFloat(priceStr) || 0;
    setSavingCat(true);
    try {
      await onAddCategory(name, defaultPrice);
    } finally {
      setSavingCat(false);
      setCombobox((prev) => ({ ...prev, openId: null }));
    }
  };

  // Step 1: request category deletion
  const requestDeleteCategory = (e: React.MouseEvent, cat: string) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmDeleteCat(cat);
  };

  // Step 2: confirmed — delete the category
  const confirmDeleteCategory = async (e: React.MouseEvent, cat: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletingCat(cat);
    setConfirmDeleteCat(null);
    try {
      await onDeleteCategory(cat);
    } finally {
      setDeletingCat(null);
    }
  };

  const cancelDeleteCategory = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmDeleteCat(null);
  };

  // Enter key: desc → amount of same row
  const handleDescKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      if (e.key === "Enter") {
        e.preventDefault();
        setCombobox((prev) => ({ ...prev, openId: null }));
        const refs = refsMap.current.get(id);
        refs?.amountRef.current?.focus();
      }
      if (e.key === "Escape") {
        setConfirmDeleteRowId(null);
        setConfirmDeleteCat(null);
      }
    },
    [],
  );

  // Enter key: amount → desc of next row (or add new row)
  const handleAmountKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const idx = items.findIndex((i) => i._id === id);
        if (idx < items.length - 1) {
          const nextItem = items[idx + 1];
          const refs = refsMap.current.get(nextItem._id);
          refs?.descRef.current?.focus();
        } else {
          pendingFocusRef.current = "new-desc";
          addRow();
        }
      }
    },
    [items, addRow],
  );

  const accentClass = color === "saffron" ? "text-primary" : "text-destructive";
  const headerBg =
    color === "saffron"
      ? "bg-primary/10 border-primary/20"
      : "bg-destructive/10 border-destructive/20";
  const saveBtnClass =
    color === "saffron"
      ? "text-primary hover:bg-primary/5 border-primary/30"
      : "text-destructive hover:bg-destructive/5 border-destructive/30";

  return (
    <div
      className="rounded-lg border border-border overflow-hidden shadow-xs"
      ref={containerRef}
    >
      {/* Section Header */}
      <div
        className={`px-4 py-2.5 ${headerBg} border-b flex items-center justify-between`}
      >
        <h3
          className={`font-semibold text-sm tracking-wide uppercase ${accentClass}`}
        >
          {label}
        </h3>
        <Button
          size="sm"
          variant="ghost"
          className={`h-7 text-xs gap-1 ${accentClass} hover:bg-primary/10`}
          onClick={addRow}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Row
        </Button>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {items.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-sm">
            No items yet. Click "Add Row" to begin.
          </div>
        ) : (
          items.map((item) => {
            const itemRefs = getOrCreateRefs(item._id);
            const inputVal = getInputValue(item);
            const filteredCats = categories.filter((c) =>
              inputVal.trim() === ""
                ? true
                : c.name.toLowerCase().includes(inputVal.toLowerCase()),
            );
            const isOpen = combobox.openId === item._id;
            const isNewCat =
              inputVal.trim() !== "" &&
              !categories.some(
                (c) => c.name.toLowerCase() === inputVal.trim().toLowerCase(),
              );
            const isPendingDelete = confirmDeleteRowId === item._id;
            const currentOutlet = (item.outlet as OutletName) || "Common";

            return (
              <div key={item._id}>
                {/* Normal row view */}
                {!isPendingDelete ? (
                  <div className="flex flex-col gap-0 px-3 py-2.5 bg-card hover:bg-muted/30 transition-colors">
                    {/* Top row: description + delete */}
                    <div className="flex items-center gap-2">
                      {/* Description combobox */}
                      <div className="relative flex-1 min-w-0">
                        <div className="relative">
                          <Input
                            ref={itemRefs.descRef}
                            type="text"
                            value={inputVal}
                            onChange={(e) =>
                              handleInputChange(item._id, e.target.value)
                            }
                            onFocus={() => handleInputFocus(item._id)}
                            onKeyDown={(e) => handleDescKeyDown(e, item._id)}
                            placeholder="Type or select item..."
                            className="w-full pr-8 text-sm h-8"
                            autoComplete="off"
                          />
                          {inputVal && (
                            <button
                              type="button"
                              onClick={() => {
                                onChange(
                                  items.map((i) =>
                                    i._id === item._id
                                      ? { ...i, description: "" }
                                      : i,
                                  ),
                                );
                                setCombobox((prev) => ({
                                  ...prev,
                                  inputValues: {
                                    ...prev.inputValues,
                                    [item._id]: "",
                                  },
                                }));
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              tabIndex={-1}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Dropdown suggestions */}
                        {isOpen && (
                          <div className="absolute z-50 top-full left-0 mt-1 w-full min-w-[240px] rounded-md border border-border bg-popover shadow-lg overflow-hidden">
                            {filteredCats.length > 0 && (
                              <div className="max-h-44 overflow-y-auto">
                                {filteredCats.map((cat) => {
                                  const isCatPendingDelete =
                                    confirmDeleteCat === cat.name;

                                  return (
                                    <div
                                      key={cat.name}
                                      className="group flex items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                                      onMouseDown={
                                        isCatPendingDelete
                                          ? (e) => e.preventDefault()
                                          : (e) => {
                                              e.preventDefault();
                                              selectCategory(item._id, cat);
                                            }
                                      }
                                    >
                                      {isCatPendingDelete ? (
                                        /* Confirm delete category inline */
                                        <div className="flex items-center gap-2 w-full">
                                          <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                                          <span className="text-xs text-destructive font-medium flex-1">
                                            "{cat.name}" delete करें?
                                          </span>
                                          <button
                                            type="button"
                                            onMouseDown={(e) =>
                                              confirmDeleteCategory(e, cat.name)
                                            }
                                            disabled={deletingCat === cat.name}
                                            className="px-2 py-0.5 text-xs rounded font-semibold text-destructive-foreground bg-destructive hover:bg-destructive/90 transition-colors shrink-0"
                                          >
                                            {deletingCat === cat.name
                                              ? "..."
                                              : "हाँ"}
                                          </button>
                                          <button
                                            type="button"
                                            onMouseDown={cancelDeleteCategory}
                                            className="px-2 py-0.5 text-xs rounded font-semibold text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted transition-colors shrink-0"
                                          >
                                            नहीं
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <span className="flex-1 truncate">
                                            {cat.name}
                                          </span>
                                          {cat.defaultPrice > 0 && (
                                            <span className="text-muted-foreground ml-2 text-xs font-mono-nums shrink-0">
                                              ₹
                                              {cat.defaultPrice.toLocaleString(
                                                "en-IN",
                                              )}
                                            </span>
                                          )}
                                          <button
                                            type="button"
                                            onMouseDown={(e) =>
                                              requestDeleteCategory(e, cat.name)
                                            }
                                            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                                            title="Delete category"
                                            disabled={deletingCat === cat.name}
                                          >
                                            {deletingCat === cat.name ? (
                                              <span className="text-xs">…</span>
                                            ) : (
                                              <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {filteredCats.length === 0 &&
                              inputVal.trim() === "" && (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  No saved items yet
                                </div>
                              )}

                            {filteredCats.length === 0 &&
                              inputVal.trim() !== "" && (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  No matches found
                                </div>
                              )}

                            {/* Save as new item — with inline price input */}
                            {isNewCat && (
                              <div className="border-t border-border p-2 space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 flex-1">
                                    <span className="text-muted-foreground text-xs shrink-0">
                                      ₹
                                    </span>
                                    <input
                                      type="number"
                                      placeholder="Default price (optional)"
                                      value={
                                        combobox.newCatPrices[item._id] ?? ""
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setCombobox((prev) => ({
                                          ...prev,
                                          newCatPrices: {
                                            ...prev.newCatPrices,
                                            [item._id]: val,
                                          },
                                        }));
                                      }}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      className="w-full bg-muted/30 border border-border rounded px-2 py-1 text-xs font-mono-nums outline-none focus:ring-1 focus:ring-primary/40"
                                      min="0"
                                      step="0.01"
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSaveAsCategory(item._id);
                                  }}
                                  disabled={savingCat}
                                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded ${saveBtnClass} border transition-colors`}
                                >
                                  <Plus className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate text-left">
                                    {savingCat
                                      ? "Saving..."
                                      : (() => {
                                          const priceVal = Number.parseFloat(
                                            combobox.newCatPrices[item._id] ??
                                              "",
                                          );
                                          const priceStr =
                                            priceVal > 0
                                              ? ` — ₹${priceVal.toLocaleString("en-IN")}`
                                              : "";
                                          return `Save "${inputVal.trim()}"${priceStr} as item`;
                                        })()}
                                  </span>
                                </button>
                              </div>
                            )}

                            {inputVal.trim() !== "" && !isNewCat && (
                              <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                                Already saved as an item
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Delete Row — step 1: show trash icon */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => requestDeleteRow(item._id)}
                        title="Delete this row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Bottom row: outlet pills + amount */}
                    <div className="flex items-center gap-2 mt-1.5">
                      {/* Outlet Pills */}
                      <div className="flex items-center gap-1 flex-1">
                        {OUTLETS.map((outlet) => {
                          const isSelected = currentOutlet === outlet.name;
                          return (
                            <button
                              key={outlet.name}
                              type="button"
                              onClick={() =>
                                updateOutlet(item._id, outlet.name)
                              }
                              title={outlet.name}
                              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all duration-150 leading-tight whitespace-nowrap"
                              style={{
                                background: isSelected
                                  ? outlet.activeBg
                                  : outlet.bg,
                                color: isSelected
                                  ? outlet.activeText
                                  : outlet.text,
                                boxShadow: isSelected
                                  ? `0 0 0 1.5px ${outlet.activeBg}`
                                  : "none",
                                transform: isSelected
                                  ? "scale(1.08)"
                                  : "scale(1)",
                              }}
                            >
                              {outlet.short}
                            </button>
                          );
                        })}
                        {/* Show current outlet name compactly */}
                        <span
                          className="text-[10px] font-medium ml-0.5"
                          style={{ color: "oklch(0.50 0.04 55)" }}
                        >
                          {currentOutlet}
                        </span>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-muted-foreground text-sm">₹</span>
                        <Input
                          ref={itemRefs.amountRef}
                          type="number"
                          value={item.amount || ""}
                          onChange={(e) =>
                            updateAmount(item._id, e.target.value)
                          }
                          onKeyDown={(e) => handleAmountKeyDown(e, item._id)}
                          placeholder="0"
                          className="w-24 text-right font-mono-nums text-sm h-8"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Step 2: Confirm delete row */
                  <div
                    className="flex items-center gap-2 px-3 py-3 transition-colors"
                    style={{ background: "oklch(0.96 0.03 27)" }}
                  >
                    <AlertTriangle
                      className="h-4 w-4 shrink-0"
                      style={{ color: "oklch(0.52 0.22 27)" }}
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
                      onClick={() => confirmDeleteRow(item._id)}
                    >
                      हाँ, Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-xs font-semibold"
                      onClick={cancelDeleteRow}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer total */}
      {items.length > 0 && (
        <div
          className={`px-4 py-2 ${headerBg} border-t flex items-center justify-between`}
        >
          <span className="text-xs text-muted-foreground font-medium">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
          <span
            className={`font-mono-nums font-semibold text-sm ${accentClass}`}
          >
            ₹
            {items
              .reduce((s, i) => s + (i.amount || 0), 0)
              .toLocaleString("en-IN")}
          </span>
        </div>
      )}
    </div>
  );
}
