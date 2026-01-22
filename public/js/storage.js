/* public/js/storage.js */

import { state, formatCurrency } from "./state.js";
import { showNotification, syncThemeToDOM, updateAllTransactionsTable } from "./ui.js";
import { safeRenderAndCharts } from "./safe.js";

const API_BASE = "/api/expenses";

/* ------------------------------------------------------------------
   API HELPERS (The Bridge to MongoDB)
------------------------------------------------------------------- */

/**
 * Get the current User ID from the logged-in session
 */
function getCurrentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user && user.id ? user.id : null;
  } catch (err) {
    return null;
  }
}

/**
 * Storage.addExpense (CREATE)
 * Sends a new expense to the server
 */
export async function addExpenseToDB(expenseData) {
  const userId = getCurrentUserId();
  if (!userId) {
    showNotification("⚠️ You must be logged in to save expenses.");
    return null;
  }

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...expenseData, userId }),
    });

    if (!res.ok) throw new Error("Server rejected the expense");

    return await res.json(); // Returns the saved expense (with _id)
  } catch (err) {
    console.error("API Error:", err);
    showNotification("⚠️ Failed to save expense to server.");
    return null;
  }
}

/**
 * Storage.deleteExpense (DELETE)
 * Tells server to remove an expense by ID
 */
export async function deleteExpenseFromDB(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    return true;
  } catch (err) {
    console.error("API Error:", err);
    showNotification("⚠️ Failed to delete expense.");
    return false;
  }
}

/* ------------------------------------------------------------------
   Load Data (The Switch from LocalStorage to API)
------------------------------------------------------------------- */

/**
 * loadFromLocalStorage() -> Now acts as "Load Initial Data"
 * 1. Loads Theme (from LocalStorage)
 * 2. Loads User Info (from LocalStorage)
 * 3. Fetches Expenses (from MongoDB API)
 */
export async function loadFromLocalStorage() {
  // 1. Load Theme (Keep this local!)
  try {
    const dm = localStorage.getItem("budgetTrackerDarkMode");
    if (dm !== null) state.darkMode = dm === "true";
  } catch (err) {
    console.warn("Theme load failed:", err);
  }

  // 2. Load User Session
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    // In the future, we will fetch budget/savings from the DB too.
    // For now, we use defaults or what's in local storage for settings.
    const raw = localStorage.getItem("budgetTrackerData");
    if (raw) {
      const data = JSON.parse(raw);
      state.budget = data.budget ?? state.budget;
      state.savingsGoal = data.savingsGoal ?? state.savingsGoal;
    }
  }

  // 3. FETCH EXPENSES FROM API (The Big Change)
  if (user && user.id) {
    try {
      const res = await fetch(`${API_BASE}/${user.id}`);
      if (res.ok) {
        const serverExpenses = await res.json();

        // Normalize data for the frontend
        state.expenses = serverExpenses.map((e) => ({
          id: e._id, // Map MongoDB '_id' to frontend 'id'
          description: e.description,
          amount: e.amount,
          category: e.category,
          date: new Date(e.date).toISOString().split("T")[0], // format YYYY-MM-DD
          timestamp: new Date(e.date).getTime(),
        }));
      }
    } catch (err) {
      console.error("Failed to load expenses from server:", err);
      showNotification("⚠️ Could not connect to database.");
    }
  }

  // 4. Update UI
  const budgetEl = document.getElementById("budget-amount");
  if (budgetEl) budgetEl.textContent = formatCurrency(state.budget);

  const savingsGoalEl = document.getElementById("savings-goal");
  if (savingsGoalEl) savingsGoalEl.textContent = formatCurrency(state.savingsGoal);

  syncThemeToDOM();
  // Safe render will update charts with the new API data
  safeRenderAndCharts();
  updateAllTransactionsTable();
}

/* ------------------------------------------------------------------
   Save Data
------------------------------------------------------------------- */

/**
 * saveToLocalStorageSafe()
 * Now ONLY saves Settings/Theme.
 * Expenses are saved automatically to DB via addExpenseToDB().
 */
export function saveToLocalStorageSafe() {
  try {
    // We only save preferences locally now, not the expense list
    const payload = {
      darkMode: state.darkMode,
      budget: state.budget,
      savingsGoal: state.savingsGoal,
      // We DO NOT save 'expenses' here anymore! They live in the cloud.
    };
    localStorage.setItem("budgetTrackerData", JSON.stringify(payload));
    localStorage.setItem("budgetTrackerDarkMode", state.darkMode);
  } catch (err) {
    console.warn("Settings save failed:", err);
  }
}

/* ------------------------------------------------------------------
   Export Data (Keep as Utility)
------------------------------------------------------------------- */

export function exportDataJSON() {
  try {
    const payload = {
      budget: state.budget,
      savingsGoal: state.savingsGoal,
      expenses: state.expenses,
    };

    const now = new Date();
    const fileName = `budgetBunny-${now.toISOString().split("T")[0]}.json`;

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    showNotification("📤 Data exported successfully!");
  } catch (err) {
    console.error("Export failed:", err);
    showNotification("⚠️ Export failed.");
  }
}

/* ------------------------------------------------------------------
   Import Data (Disabled for Milestone 2)
   Re-enabling this requires bulk-upload API logic.
------------------------------------------------------------------- */
export async function importDataFromFile(file) {
  showNotification("⚠️ Import is temporarily disabled while we upgrade the database.");
}
