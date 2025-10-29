/* eslint-env browser */

// storage.js
//
// Handles persistent storage and import/export:
// - LocalStorage CRUD
// - JSON import/export with defensive merges
// - Safe fallbacks and user notifications
//
// Works entirely client-side (browser). For projects using
// a /json folder in dev, the downloaded file will still just
// save wherever the browser saves downloads.

import { state, formatCurrency } from "./state.js";
import {
  showNotification,
  syncThemeToDOM,
  updateAllTransactionsTable,
} from "./ui.js";
import { safeRenderAndCharts } from "./safe.js";

/* ------------------------------------------------------------------
   Import data (JSON file → state)
------------------------------------------------------------------- */

/**
 * importDataFromFile(file)
 *
 * Reads a .json file, merges values safely into app state,
 * sorts transactions, refreshes UI/charts, and saves to localStorage.
 */
export async function importDataFromFile(file) {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    // Defensive merge to prevent bad data structures
    if (typeof parsed.budget === "number") state.budget = parsed.budget;
    if (typeof parsed.savingsGoal === "number")
      state.savingsGoal = parsed.savingsGoal;
    if (typeof parsed.income === "number") state.income = parsed.income;

    if (Array.isArray(parsed.expenses)) {
      state.expenses = parsed.expenses.map((e) => ({
        ...e,
        // ensure timestamp even for older backups
        timestamp:
          e.timestamp ??
          (e.date ? new Date(e.date + "T00:00:00").getTime() : Date.now()),
      }));
    }

    // newest first
    state.expenses.sort((a, b) => b.timestamp - a.timestamp);
    state.filteredTransactions = [...state.expenses];

    // re-render after import
    safeRenderAndCharts();
    updateAllTransactionsTable();
    saveToLocalStorageSafe();

    showNotification("✅ Data imported successfully.");
  } catch (err) {
    console.error("Import failed:", err);
    showNotification("⚠️ Import failed — invalid or corrupted JSON file.");
  }
}

/* ------------------------------------------------------------------
   Save state → LocalStorage
------------------------------------------------------------------- */

/**
 * saveToLocalStorageSafe()
 *
 * Persists app state in localStorage.
 * Wrapped in try/catch to handle quota or privacy errors.
 */
export function saveToLocalStorageSafe() {
  try {
    const payload = {
      darkMode: state.darkMode,
      budget: state.budget,
      savingsGoal: state.savingsGoal,
      expenses: state.expenses,
      savings: state.savings,
    };
    localStorage.setItem("budgetTrackerData", JSON.stringify(payload));
  } catch (err) {
    console.error("LocalStorage save failed:", err);
    showNotification(
      "⚠️ Couldn’t save automatically. Export your data to avoid loss."
    );
  }

  // Save dark mode separately for fast boot
  try {
    localStorage.setItem("budgetTrackerDarkMode", state.darkMode);
  } catch (err) {
    console.warn("Could not save dark mode preference:", err);
  }
}

/* ------------------------------------------------------------------
   Load state ← LocalStorage
------------------------------------------------------------------- */

/**
 * loadFromLocalStorage()
 *
 * Restores app state and theme from LocalStorage.
 * Shows onboarding tip on first use.
 */
export function loadFromLocalStorage() {
  // Theme preference
  try {
    const dm = localStorage.getItem("budgetTrackerDarkMode");
    if (dm !== null) state.darkMode = dm === "true";
  } catch (err) {
    console.warn("Theme load failed:", err);
  }

  // Main data
  try {
    const raw = localStorage.getItem("budgetTrackerData");
    if (raw) {
      const data = JSON.parse(raw);
      state.budget = data.budget ?? state.budget;
      state.savingsGoal = data.savingsGoal ?? state.savingsGoal;
      state.expenses = Array.isArray(data.expenses) ? data.expenses : [];
      state.savings = data.savings ?? state.savings;
    }
  } catch (err) {
    console.warn("Data load failed:", err);
    showNotification(
      "⚠️ Could not restore previous data. You may need to re-enter it."
    );
  }

  // Reflect to UI immediately (if elements exist yet)
  const budgetEl = document.getElementById("budget-amount");
  if (budgetEl) {
    budgetEl.textContent = formatCurrency(state.budget);
  }

  const savingsGoalEl = document.getElementById("savings-goal");
  if (savingsGoalEl) {
    savingsGoalEl.textContent = formatCurrency(state.savingsGoal);
  }

  // Apply theme to DOM
  syncThemeToDOM();

  // First-time onboarding message
  try {
    if (!localStorage.getItem("budgetTrackerHasOnboarded")) {
      showNotification(
        "💡 Tip: Add your first expense, then click 'View All' to explore analytics!"
      );
      localStorage.setItem("budgetTrackerHasOnboarded", "true");
    }
  } catch {
    // ignore storage restriction errors
  }
}

/* ------------------------------------------------------------------
   Export state → JSON
------------------------------------------------------------------- */

/**
 * exportDataJSON()
 *
 * Serializes the current app state to a downloadable JSON file.
 * Filename includes today's date, e.g.
 *   budgetTracker-2025-10-26.json
 */
export function exportDataJSON() {
  try {
    const payload = {
      budget: state.budget,
      savingsGoal: state.savingsGoal,
      expenses: state.expenses,
      savings: state.savings,
    };

    // build yyyy-mm-dd
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0"); // months are 0-based
    const dd = String(now.getDate()).padStart(2, "0");

    const fileName = `budgetTracker-${yyyy}-${mm}-${dd}.json`;

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    // trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();

    URL.revokeObjectURL(url);

    showNotification("📤 Data exported successfully!");
  } catch (err) {
    console.error("Export failed:", err);
    showNotification(
      "⚠️ Export failed — try again or check browser permissions."
    );
  }
}
