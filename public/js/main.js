import { state } from "./state.js";
import { $, $$, updateHeaderDateAndYear, syncThemeToDOM } from "./ui.js";
import { safeRenderAndCharts } from "./safe.js";
// Merged imports from storage.js
import {
  loadFromLocalStorage,
  saveToLocalStorageSafe,
  exportDataJSON,
  importDataFromFile,
} from "./storage.js";
import { initializeCharts, refreshChartsTheme, changeTimePeriod } from "./charts.js";
import {
  openBudgetModal,
  closeBudgetModal,
  submitBudget,
  openSavingsModal,
  closeSavingsModal,
  submitSavings,
  openAllTransactionsModal,
  closeAllTransactionsModal,
  searchTransactions,
  openEditTransaction,
  closeEditTransactionModal,
  submitEditTransaction,
  openDeleteTransaction,
  closeDeleteConfirmationModal,
  confirmDeleteTransaction,
  handleAddExpense,
} from "./modals.js";

/* ------------------------------------------------------------------
    Theme toggle
------------------------------------------------------------------- */

function toggleDarkMode() {
  try {
    state.darkMode = !state.darkMode;
    saveToLocalStorageSafe();
    syncThemeToDOM();

    document.body.classList.toggle("app--dark", state.darkMode);
    document.documentElement.classList.toggle("dark", state.darkMode);

    $("#moon-icon")?.classList.toggle("hidden", state.darkMode);
    $("#sun-icon")?.classList.toggle("hidden", !state.darkMode);

    refreshChartsTheme();
  } catch (err) {
    console.error("toggleDarkMode failed:", err);
  }
}

/* ------------------------------------------------------------------
    Application bootstrap
------------------------------------------------------------------- */

/**
 * initApp()
 * ⚠️ UPDATED: Now ASYNC to wait for Database Fetch
 */
async function initApp() {
  try {
    // 1. Wait for data from MongoDB before showing anything
    await loadFromLocalStorage();

    // 2. Apply Theme & UI State
    syncThemeToDOM();
    document.body.classList.toggle("app--dark", state.darkMode);
    document.documentElement.classList.toggle("dark", state.darkMode);
    $("#moon-icon")?.classList.toggle("hidden", state.darkMode);
    $("#sun-icon")?.classList.toggle("hidden", !state.darkMode);
    refreshChartsTheme();

    updateHeaderDateAndYear();

    // Default date on add-expense form
    const dateInput = $("#expense-date");
    if (dateInput) dateInput.valueAsDate = new Date();

    // Logout Logic
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("user");
        window.location.href = "/login";
      });
    }

    // 3. Initialize Charts (Now that we have data)
    initializeCharts();
    safeRenderAndCharts();
  } catch (err) {
    console.error("initApp failed:", err);
  }

  /* ------------------------------------------------------------------
    Event Listeners
  ------------------------------------------------------------------- */

  // Data import/export
  $("#import-data-btn")?.addEventListener("click", () => {
    $("#import-file-input")?.click();
  });

  $("#import-file-input")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      importDataFromFile(file);
    } catch (err) {
      console.error("importDataFromFile failed:", err);
    } finally {
      e.target.value = "";
    }
  });

  $("#export-data-btn")?.addEventListener("click", () => {
    try {
      exportDataJSON();
    } catch (err) {
      console.error("exportDataJSON failed:", err);
    }
  });

  $("#theme-toggle")?.addEventListener("click", toggleDarkMode);

  // Add expense form
  $("#expense-form")?.addEventListener("submit", handleAddExpense);

  // --- Budget modal ---
  $("#edit-budget-icon")?.addEventListener("click", openBudgetModal);
  $("#budget-form")?.addEventListener("submit", submitBudget);
  $("#budget-cancel")?.addEventListener("click", closeBudgetModal);

  // --- Savings modal ---
  $("#edit-savings-icon")?.addEventListener("click", openSavingsModal);
  $("#savings-form")?.addEventListener("submit", submitSavings);
  $("#savings-cancel")?.addEventListener("click", closeSavingsModal);

  // --- All transactions modal ---
  $("#view-all-transactions")?.addEventListener("click", openAllTransactionsModal);
  $("#close-transactions")?.addEventListener("click", closeAllTransactionsModal);
  $("#transaction-search")?.addEventListener("input", searchTransactions);

  // --- Table row actions (edit/delete) ---
  $("#all-transactions-body")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".transactions__action-btn");
    if (!btn) return;

    const action = btn.dataset.action;

    // ⚠️ FIXED: MongoDB IDs are strings (e.g. "65a..."), NOT integers!
    // Do NOT use parseInt() here anymore.
    const id = btn.dataset.id;

    if (action === "edit") openEditTransaction(id);
    else if (action === "delete") openDeleteTransaction(id);
  });

  // --- Edit transaction modal ---
  $("#edit-transaction-form")?.addEventListener("submit", submitEditTransaction);
  $("#edit-transaction-cancel")?.addEventListener("click", closeEditTransactionModal);

  // --- Delete confirmation modal ---
  $("#delete-confirm")?.addEventListener("click", confirmDeleteTransaction);
  $("#delete-cancel")?.addEventListener("click", closeDeleteConfirmationModal);

  // --- Chart time period buttons ---
  $$(".time-period-btn").forEach((btn) => {
    btn.addEventListener("click", () =>
      changeTimePeriod(btn.getAttribute("data-period"))
    );
  });
}

// Bootstrap once DOM is ready
document.addEventListener("DOMContentLoaded", initApp);
