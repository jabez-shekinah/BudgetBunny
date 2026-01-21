/**
 * Global application state.
 * Everything else (charts, UI, storage) reads/writes here.
 */
export const state = {
  // --- UI / Theme ---
  darkMode: false, // mirrors <body class="app--dark">

  // --- Budgeting / Targets ---
  budget: 10000.0, // monthly budget (PHP)
  savingsGoal: 1000.0, // monthly savings target (PHP)
  income: 0, // reserved for future recurring income feature

  // --- Transactions / Savings ---
  expenses: [], // [{ id, description, amount, category, date, timestamp }]
  savings: 0, // derived from remaining budget

  // --- Charts ---
  expenseChart: null, // Chart.js line chart instance
  categoryChart: null, // Chart.js doughnut chart instance
  currentTimePeriod: "week", // "week" | "month" | "year"

  // --- Filters / Views ---
  filteredTransactions: [], // used in All Transactions modal search

  // --- Category styling map (UI colors for pills/icons) ---
  categoryColors: {
    food: { bg: "rgba(99, 102, 241, 0.8)", color: "#6366f1" },
    transportation: { bg: "rgba(59, 130, 246, 0.8)", color: "#3b82f6" },
    entertainment: { bg: "rgba(139, 92, 246, 0.8)", color: "#8b5cf6" },
    utilities: { bg: "rgba(34, 197, 94, 0.8)", color: "#22c55e" },
    shopping: { bg: "rgba(249, 115, 22, 0.8)", color: "#f97316" },
    health: { bg: "rgba(236, 72, 153, 0.8)", color: "#ec4899" },
    other: { bg: "rgba(234, 179, 8, 0.8)", color: "#eab308" },
  },
};

/**
 * Human-friendly names for categories.
 * Keep in sync with the <select> options in the form.
 */
export const CATEGORY_NAMES = {
  food: "Food & Dining",
  transportation: "Transportation",
  entertainment: "Entertainment",
  utilities: "Utilities",
  shopping: "Shopping",
  health: "Health",
  other: "Other",
};

/**
 * Get display name for a category key.
 * Pure helper: does not mutate state.
 * @param {string} key
 * @returns {string}
 */
export const getCategoryName = (key) => CATEGORY_NAMES[key] || "Other";

/**
 * Format a number in PHP currency.
 * Safe for undefined / null via ?? 0.
 * Pure helper.
 * @param {number} n
 * @returns {string} e.g. "₱1,234.00"
 */
export const formatCurrency = (n) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(n ?? 0);

/**
 * Parse "yyyy-mm-dd" into a local Date (no timezone shift).
 * @param {string} yyyyMMdd
 * @returns {Date}
 */
export const parseLocalDate = (yyyyMMdd) => {
  const [y, m, d] = yyyyMMdd.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Generate "nice" axis scale values for charts.
 * Given a max data value, return a suggested max and tick step.
 * Pure helper.
 * @param {number} max
 * @returns {{ suggestedMax: number, stepSize: number }}
 */
export function niceScale(max) {
  if (max <= 0) {
    return { suggestedMax: 100, stepSize: 20 };
  }

  // internal helper: round a number up to 1/2/5/10 * 10^exp
  const niceNum = (x) => {
    const exp = Math.floor(Math.log10(x)); // exponent of x (10^exp)
    const f = x / Math.pow(10, exp); // fractional part 1-10
    const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
    return nf * Math.pow(10, exp);
  };

  const desiredTicks = 6; // ~how many horizontal lines we want
  const step = niceNum(max / desiredTicks);
  const suggestedMax = Math.ceil(max / step) * step;

  return { suggestedMax, stepSize: step };
}
