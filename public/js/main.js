/* eslint-env browser */

// main.js
//
// Application entry point:
// - Initializes charts, theme, and persistent state
// - Attaches all global event listeners
// - Provides error-safe initialization and user import/export
//
// Every module (state, charts, modals, ui, storage) contributes to this flow.

import { state } from "./state.js";
import { importDataFromFile } from "./storage.js";
import { $, $$, renderApp, updateHeaderDateAndYear, syncThemeToDOM } from "./ui.js";
import { safeRenderAndCharts } from "./safe.js";
import {
  loadFromLocalStorage,
  saveToLocalStorageSafe,
  exportDataJSON,
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

/**
 * toggleDarkMode()
 *
 * Toggles dark/light mode with persistence and chart refresh.
 */
function toggleDarkMode() {
  try {
    state.darkMode = !state.darkMode;
    saveToLocalStorageSafe();
    syncThemeToDOM();

    document.body.classList.toggle("app--dark", state.darkMode);
    document.documentElement.classList.toggle("dark", state.darkMode);

    // icon toggles
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
 *
 * Initializes app state, restores data, sets up charts, and
 * attaches global event listeners.
 */
function initApp() {
  try {
    loadFromLocalStorage();
    // Ensure the persisted theme/state is applied to the DOM on startup
    // (sets body/html classes, icon visibility and refreshes charts)
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

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        // 1. Remove the user key
        localStorage.removeItem("user");
        // 2. Redirect to Login page
        window.location.href = "/login";
      });
    }

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
      e.target.value = ""; // reset so import can trigger again
    }
  });

  $("#export-data-btn")?.addEventListener("click", () => {
    try {
      exportDataJSON();
    } catch (err) {
      console.error("exportDataJSON failed:", err);
    }
  });

  // Theme toggle
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
    const id = parseInt(btn.dataset.id, 10);

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
