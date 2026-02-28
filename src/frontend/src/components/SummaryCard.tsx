import {
  Minus,
  Receipt,
  ShoppingCart,
  Store,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { formatINR } from "../utils/format";

interface SummaryCardProps {
  totalPurchase: number;
  totalExpense: number;
  totalSale: number;
  rajajiSale: number;
  oldRaoSale: number;
  saroorpurSale: number;
  profitLoss: number;
}

export function SummaryCard({
  totalPurchase,
  totalExpense,
  totalSale,
  rajajiSale,
  oldRaoSale,
  saroorpurSale,
  profitLoss,
}: SummaryCardProps) {
  const isProfit = profitLoss > 0;
  const isBreakEven = profitLoss === 0;

  // Rich background colors directly encoded for max contrast
  const heroBg = isBreakEven
    ? "oklch(0.28 0.04 65)"
    : isProfit
      ? "oklch(0.30 0.08 145)"
      : "oklch(0.28 0.08 27)";

  const heroTextColor = isBreakEven
    ? "oklch(0.85 0.03 65)"
    : isProfit
      ? "oklch(0.88 0.16 145)"
      : "oklch(0.90 0.14 27)";

  const heroSubColor = isBreakEven
    ? "oklch(0.60 0.03 65)"
    : isProfit
      ? "oklch(0.65 0.10 145)"
      : "oklch(0.65 0.10 27)";

  const iconBg = isBreakEven
    ? "oklch(0.38 0.04 65 / 0.6)"
    : isProfit
      ? "oklch(0.40 0.10 145 / 0.6)"
      : "oklch(0.40 0.10 27 / 0.6)";

  const PLIcon = isBreakEven ? Minus : isProfit ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-xl overflow-hidden"
      style={{
        boxShadow: isProfit
          ? "0 4px 24px -4px oklch(0.55 0.16 145 / 0.35)"
          : isBreakEven
            ? "0 4px 16px -4px oklch(0.20 0.04 60 / 0.30)"
            : "0 4px 24px -4px oklch(0.50 0.20 27 / 0.35)",
      }}
    >
      {/* Hero P/L Banner — the most important number, dominates the card */}
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

      {/* Cost vs Revenue breakdown — clear visual separation */}
      <div
        className="grid grid-cols-3 border-t"
        style={{
          background: "oklch(0.99 0.006 60)",
          borderColor: "oklch(0.86 0.04 65)",
        }}
      >
        <StatCell
          icon={<ShoppingCart className="h-3.5 w-3.5" />}
          label="Purchase"
          value={formatINR(totalPurchase)}
          valueColor="oklch(0.52 0.22 27)"
          labelColor="oklch(0.52 0.04 55)"
        />
        <StatCell
          icon={<Receipt className="h-3.5 w-3.5" />}
          label="Expense"
          value={formatINR(totalExpense)}
          valueColor="oklch(0.52 0.22 27)"
          labelColor="oklch(0.52 0.04 55)"
          bordered
        />
        <StatCell
          icon={<Store className="h-3.5 w-3.5" />}
          label="Total Sale"
          value={formatINR(totalSale)}
          valueColor="oklch(0.48 0.16 145)"
          labelColor="oklch(0.52 0.04 55)"
          bordered
        />
      </div>

      {/* Outlet breakdown */}
      <div
        className="px-4 py-3 border-t grid grid-cols-3 gap-2"
        style={{
          background: "oklch(0.95 0.012 65)",
          borderColor: "oklch(0.86 0.04 65)",
        }}
      >
        <OutletCell label="Rajaji" value={rajajiSale} />
        <OutletCell label="Old Rao" value={oldRaoSale} />
        <OutletCell label="Saroorpur" value={saroorpurSale} />
      </div>
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
      style={{ borderColor: "oklch(0.86 0.04 65)" }}
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

function OutletCell({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-md px-3 py-2 text-center border"
      style={{
        background: "oklch(0.99 0.006 60)",
        borderColor: "oklch(0.86 0.04 65)",
      }}
    >
      <p
        className="text-xs font-medium mb-0.5"
        style={{ color: "oklch(0.52 0.04 55)" }}
      >
        {label}
      </p>
      <p
        className="font-mono-nums font-semibold text-sm"
        style={{ color: "oklch(0.48 0.16 145)" }}
      >
        {formatINR(value)}
      </p>
    </div>
  );
}
