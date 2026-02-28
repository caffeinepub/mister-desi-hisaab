import {
  Minus,
  Receipt,
  ShoppingCart,
  Store,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import type { SaleItem } from "../backend.d.ts";
import { formatINR } from "../utils/format";

interface SummaryCardProps {
  totalPurchase: number;
  totalExpense: number;
  totalSale: number;
  profitLoss: number;
  saleItems?: SaleItem[];
}

export function SummaryCard({
  totalPurchase,
  totalExpense,
  totalSale,
  profitLoss,
  saleItems,
}: SummaryCardProps) {
  const isProfit = profitLoss > 0;
  const isBreakEven = profitLoss === 0;

  const heroBg = isBreakEven
    ? "oklch(0.15 0.025 25)"
    : isProfit
      ? "oklch(0.22 0.07 145)"
      : "oklch(0.22 0.07 27)";

  const heroTextColor = isBreakEven
    ? "oklch(0.85 0.018 72)"
    : isProfit
      ? "oklch(0.85 0.18 145)"
      : "oklch(0.88 0.16 27)";

  const heroSubColor = isBreakEven
    ? "oklch(0.55 0.03 45)"
    : isProfit
      ? "oklch(0.60 0.10 145)"
      : "oklch(0.62 0.10 27)";

  const iconBg = isBreakEven
    ? "oklch(0.25 0.04 25 / 0.6)"
    : isProfit
      ? "oklch(0.35 0.10 145 / 0.6)"
      : "oklch(0.35 0.10 27 / 0.6)";

  const PLIcon = isBreakEven ? Minus : isProfit ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-xl overflow-hidden"
      style={{
        boxShadow: isProfit
          ? "0 4px 24px -4px oklch(0.52 0.18 145 / 0.35)"
          : isBreakEven
            ? "0 4px 16px -4px oklch(0.12 0.025 25 / 0.30)"
            : "0 4px 24px -4px oklch(0.46 0.20 27 / 0.35)",
        border: "1px solid oklch(0.82 0.025 60)",
      }}
    >
      {/* Hero P/L Banner */}
      <div
        className="px-5 py-5 flex items-center justify-between"
        style={{ background: heroBg }}
      >
        <div>
          <p
            className="text-xs font-bold uppercase tracking-[0.18em] mb-1"
            style={{ color: heroSubColor }}
          >
            Daily {isBreakEven ? "Break-even" : isProfit ? "Profit" : "Loss"}
          </p>
          <p
            className="font-display font-bold leading-none tracking-tight"
            style={{
              fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
              color: heroTextColor,
            }}
          >
            {isProfit ? "+" : isBreakEven ? "" : "−"}
            {formatINR(Math.abs(profitLoss))}
          </p>
          <p className="text-xs mt-1.5" style={{ color: heroSubColor }}>
            Sale&nbsp;{formatINR(totalSale)} &minus; Cost&nbsp;
            {formatINR(totalPurchase + totalExpense)}
          </p>
        </div>
        <div
          className="rounded-full p-3.5 shrink-0"
          style={{ background: iconBg }}
        >
          <PLIcon className="h-8 w-8" style={{ color: heroTextColor }} />
        </div>
      </div>

      {/* Cost vs Revenue breakdown */}
      <div
        className="grid grid-cols-3 border-t"
        style={{
          background: "oklch(0.98 0.010 70)",
          borderColor: "oklch(0.85 0.025 60)",
        }}
      >
        <StatCell
          icon={<ShoppingCart className="h-3.5 w-3.5" />}
          label="Purchase"
          value={formatINR(totalPurchase)}
          valueColor="oklch(0.46 0.20 27)"
          labelColor="oklch(0.48 0.04 40)"
        />
        <StatCell
          icon={<Receipt className="h-3.5 w-3.5" />}
          label="Expense"
          value={formatINR(totalExpense)}
          valueColor="oklch(0.46 0.20 27)"
          labelColor="oklch(0.48 0.04 40)"
          bordered
        />
        <StatCell
          icon={<Store className="h-3.5 w-3.5" />}
          label="Total Sale"
          value={formatINR(totalSale)}
          valueColor="oklch(0.44 0.16 145)"
          labelColor="oklch(0.48 0.04 40)"
          bordered
        />
      </div>

      {/* Sale items breakdown — shown when we have item-level detail */}
      {saleItems && saleItems.length > 0 && (
        <div
          className="px-4 py-3 border-t"
          style={{
            background: "oklch(0.95 0.014 72)",
            borderColor: "oklch(0.85 0.025 60)",
          }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: "oklch(0.44 0.06 40)" }}
          >
            Sale Items Breakdown
          </p>
          <div className="space-y-1">
            {saleItems.map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: stable within render
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground truncate flex-1">
                  {item.name}
                  {Number(item.freeQuantity) > 0 && (
                    <span
                      className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: "oklch(0.88 0.06 145)",
                        color: "oklch(0.40 0.14 145)",
                      }}
                    >
                      +{Number(item.freeQuantity)} free
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className="text-[10px] font-mono-nums"
                    style={{ color: "oklch(0.52 0.05 40)" }}
                  >
                    ×{Number(item.quantity)}
                  </span>
                  <span
                    className="font-mono-nums text-xs font-semibold"
                    style={{ color: "oklch(0.44 0.16 145)" }}
                  >
                    {formatINR(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StatCell({
  icon,
  label,
  value,
  valueColor,
  labelColor,
  bordered,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor: string;
  labelColor: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={`px-4 py-3 ${bordered ? "border-l" : ""}`}
      style={{ borderColor: "oklch(0.85 0.025 60)" }}
    >
      <div
        className="flex items-center gap-1 mb-1"
        style={{ color: labelColor }}
      >
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p
        className="font-mono-nums font-bold text-sm"
        style={{ color: valueColor }}
      >
        {value}
      </p>
    </div>
  );
}
