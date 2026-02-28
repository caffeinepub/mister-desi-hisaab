import { Toaster } from "@/components/ui/sonner";
import { Home } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { BulkImportPage } from "./pages/BulkImportPage";
import { DailyEntryPage } from "./pages/DailyEntryPage";
import { ItemsPage } from "./pages/ItemsPage";
import { SummaryPage } from "./pages/SummaryPage";

type Tab = "daily" | "summary" | "items" | "bulk";

export default function App() {
  // NEVER persist to localStorage — always starts on "daily"
  const [activeTab, setActiveTab] = useState<Tab>("daily");
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-40 shadow-md"
        style={{ background: "oklch(0.18 0.06 50)" }}
      >
        {/* Decorative top stripe — saffron + turmeric rhythm */}
        <div
          className="h-1.5 w-full"
          style={{
            background:
              "repeating-linear-gradient(90deg, oklch(0.62 0.18 52) 0px, oklch(0.62 0.18 52) 18px, oklch(0.72 0.16 75) 18px, oklch(0.72 0.16 75) 24px)",
          }}
        />

        <div className="max-w-2xl mx-auto px-4 pt-3 pb-2.5">
          <div className="flex items-center gap-3 mb-3">
            {/* Logo — also acts as a Home button */}
            <button
              type="button"
              onClick={() => setActiveTab("daily")}
              className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border-2 ring-2 ring-white/10 transition-transform active:scale-95 hover:scale-105"
              style={{ borderColor: "oklch(0.72 0.16 75 / 0.4)" }}
              title="Home — Daily Entry"
              aria-label="Go to Home (Daily Entry)"
            >
              <img
                src="/assets/generated/mdh-logo-transparent.dim_80x80.png"
                alt="MDH Logo"
                className="w-full h-full object-cover"
              />
            </button>

            {/* App Title */}
            <div className="flex-1 min-w-0">
              <h1
                className="font-display text-2xl font-bold leading-tight tracking-tight"
                style={{ color: "oklch(0.97 0.025 65)" }}
              >
                Mister Desi Hisaab
              </h1>
              <p
                className="text-xs font-medium tracking-wide"
                style={{ color: "oklch(0.72 0.06 60)" }}
              >
                मिस्टर देसी हिसाब &nbsp;·&nbsp; Daily Business Tracker
              </p>
            </div>

            {/* Home button (house icon) — visible & highlighted when NOT on daily */}
            <AnimatePresence>
              {activeTab !== "daily" && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.18 }}
                  type="button"
                  onClick={() => setActiveTab("daily")}
                  className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
                  style={{
                    background: "oklch(0.62 0.18 52 / 0.18)",
                    color: "oklch(0.82 0.16 65)",
                    border: "1.5px solid oklch(0.62 0.18 52 / 0.4)",
                  }}
                  title="वापस Home पर जाएं"
                  aria-label="Go to Home"
                >
                  <Home className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Today's date badge */}
            <TodayBadge />
          </div>

          {/* Navigation — Entry | Summary | Import */}
          <nav
            className="flex rounded-xl p-1 gap-1"
            role="tablist"
            style={{ background: "oklch(0.13 0.05 50)" }}
          >
            {/* Entry group — Daily */}
            <NavTab
              active={activeTab === "daily"}
              onClick={() => setActiveTab("daily")}
              label="Entry"
              sublabel="आज का"
              emoji="✏️"
            />
            {/* Summary */}
            <NavTab
              active={activeTab === "summary"}
              onClick={() => setActiveTab("summary")}
              label="Summary"
              sublabel="रिपोर्ट"
              emoji="📊"
            />
            {/* Items */}
            <NavTab
              active={activeTab === "items"}
              onClick={() => setActiveTab("items")}
              label="Items"
              sublabel="आइटम"
              emoji="📦"
            />
            {/* Import */}
            <NavTab
              active={activeTab === "bulk"}
              onClick={() => setActiveTab("bulk")}
              label="Import"
              sublabel="Bulk"
              emoji="📥"
            />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === "daily" ? (
            <motion.div
              key="daily"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              <DailyEntryPage />
            </motion.div>
          ) : activeTab === "summary" ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <SummaryPage />
            </motion.div>
          ) : activeTab === "items" ? (
            <motion.div
              key="items"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <ItemsPage />
            </motion.div>
          ) : (
            <motion.div
              key="bulk"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <BulkImportPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-4 mt-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            © {currentYear}. Built with <span className="text-primary">♥</span>{" "}
            using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== "undefined" ? window.location.hostname : "",
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      <Toaster richColors position="top-center" />
    </div>
  );
}

function TodayBadge() {
  const today = new Date();
  const day = today.toLocaleDateString("en-IN", { weekday: "short" });
  const date = today.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  return (
    <div
      className="text-right shrink-0 px-2.5 py-1.5 rounded-lg"
      style={{ background: "oklch(0.13 0.05 50)" }}
    >
      <p
        className="text-xs font-medium"
        style={{ color: "oklch(0.65 0.06 60)" }}
      >
        {day}
      </p>
      <p
        className="text-sm font-bold font-mono-nums"
        style={{ color: "oklch(0.78 0.18 65)" }}
      >
        {date}
      </p>
    </div>
  );
}

function NavTab({
  active,
  onClick,
  label,
  sublabel,
  emoji,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sublabel: string;
  emoji: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-lg text-sm font-semibold transition-all duration-200 ${
        active ? "shadow-sm" : "hover:opacity-80"
      }`}
      style={
        active
          ? {
              background: "oklch(0.62 0.18 52)",
              color: "oklch(0.99 0 0)",
            }
          : {
              color: "oklch(0.65 0.06 60)",
            }
      }
    >
      <span className="text-base leading-none">{emoji}</span>
      <span className="text-xs font-bold leading-tight">{label}</span>
      <span
        className="text-[10px] leading-none font-normal opacity-75"
        style={active ? { color: "oklch(0.95 0.02 60)" } : {}}
      >
        {sublabel}
      </span>
    </button>
  );
}
