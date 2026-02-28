/**
 * Format a number as Indian Rupees with proper Indian number formatting
 * e.g. 100000 → ₹1,00,000
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a date string (YYYY-MM-DD) to a human-readable Indian format
 * e.g. "2024-01-15" → "15 Jan 2024"
 */
export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayStr(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Get month name from month number (1-12)
 */
export function getMonthName(month: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month - 1] ?? "";
}

/**
 * Get short month name from month number (1-12)
 */
export function getShortMonthName(month: number): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[month - 1] ?? "";
}

/**
 * Range of years for selector
 */
export function getYearRange(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 2020; y--) {
    years.push(y);
  }
  return years;
}
