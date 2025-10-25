// modals.js
//
// Centralized modal + form logic:
// - Opening/closing modals with focus trapping and ESC support (WCAG-friendly)
// - Budget / Savings update flows
// - All Transactions modal (search/filter/edit/delete)
// - Add Expense form
//
// All UI refreshes go through safeRenderAndCharts() so a render/chart error
// won't kill the app. We also wrap state mutations + storage in try/catch
// for resilience.

/* eslint-env browser */

import { state, parseLocalDate } from "./state.js";
import { safeRenderAndCharts } from "./safe.js";
import { $, showNotification, updateAllTransactionsTable } from "./ui.js";
import { saveToLocalStorageSafe } from "./storage.js";

/* ------------------------------------------------------------------
   Accessible modal focus management
------------------------------------------------------------------- */

let activeModal = null;
let lastFocusedElementBeforeModal = null;

/**
 * keepFocusInModal
 *
 * Trap keyboard focus in the open modal.
 * Users hitting Tab / Shift+Tab should not "escape" behind it.
 */
function keepFocusInModal(e) {
  if (!activeModal || e.key !== "Tab") return;

  const focusables = activeModal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusables.length) return;

  const firstEl = focusables[0];
  const lastEl = focusables[focusables.length - 1];

  const isShiftTabOnFirst = e.shiftKey && document.activeElement === firstEl;
  const isTabOnLast = !e.shiftKey && document.activeElement === lastEl;

  if (isShiftTabOnFirst) {
    e.preventDefault();
    lastEl.focus();
  } else if (isTabOnLast) {
    e.preventDefault();
    firstEl.focus();
  }
}

/**
 * handleEscToClose
 *
 * Pressing Escape closes the currently active modal.
 */
function handleEscToClose(e) {
  if (e.key !== "Escape" || !activeModal) return;
  closeModal(activeModal.id);
}

/**
 * openModal
 *
 * Show modal + move focus into it.
 */
export function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  activeModal = modal;
  lastFocusedElementBeforeModal = document.activeElement;

  modal.classList.remove("hidden");

  // Focus first interactive control inside the modal
  const focusables = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusables.length > 0) {
    focusables[0].focus();
  }

  document.addEventListener("keydown", keepFocusInModal);
  document.addEventListener("keydown", handleEscToClose);
}

/**
 * closeModal
 *
 * Hide modal, cleanup listeners, restore focus.
 */
export function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.classList.add("hidden");

  document.removeEventListener("keydown", keepFocusInModal);
  document.removeEventListener("keydown", handleEscToClose);

  if (lastFocusedElementBeforeModal) {
    lastFocusedElementBeforeModal.focus();
  }

  activeModal = null;
  lastFocusedElementBeforeModal = null;
}

/* ------------------------------------------------------------------
   Small validation helpers
------------------------------------------------------------------- */

/**
 * validateRequiredField
 * - trims value
 * - not empty
 * returns string or null
 */
function validateRequiredField(inputEl, message) {
  const val = inputEl.value.trim();
  if (!val) {
    showNotification(message);
    inputEl.focus();
    return null;
  }
  return val;
}

/**
 * validateNumberField
 * - parses float
 * - must be > 0
 * returns number or null
 */
function validateNumberField(inputEl, message) {
  const num = parseFloat(inputEl.value);
  const ok = Number.isFinite(num) && num > 0;
  if (!ok) {
    showNotification(message);
    inputEl.focus();
    return null;
  }
  return num;
}

/* ------------------------------------------------------------------
   Budget modal
------------------------------------------------------------------- */

export function openBudgetModal() {
  $("#budget-input").value = state.budget;
  openModal("budget-modal");
}

export function closeBudgetModal() {
  closeModal("budget-modal");
}

export function submitBudget(e) {
  e.preventDefault();

  const inputEl = $("#budget-input");
  const newVal = validateNumberField(
    inputEl,
    "Please enter a valid budget greater than 0."
  );
  if (newVal === null) return;

  try {
    state.budget = newVal;

    // immediate UI update
    $("#budget-amount").textContent = newVal.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });

    // re-render dashboard + charts (safe)
    safeRenderAndCharts();
    updateAllTransactionsTable();

    saveToLocalStorageSafe();
    closeBudgetModal();
    showNotification("Budget updated successfully!");
  } catch (err) {
    console.error("submitBudget failed:", err);
    showNotification("⚠️ Couldn't update budget. Try again.");
  }
}

/* ------------------------------------------------------------------
   Savings modal
------------------------------------------------------------------- */

export function openSavingsModal() {
  $("#savings-input").value = state.savingsGoal;
  openModal("savings-modal");
}

export function closeSavingsModal() {
  closeModal("savings-modal");
}

export function submitSavings(e) {
  e.preventDefault();

  const inputEl = $("#savings-input");
  const newVal = validateNumberField(
    inputEl,
    "Please enter a valid savings goal greater than 0."
  );
  if (newVal === null) return;

  try {
    state.savingsGoal = newVal;

    // immediate UI update
    $("#savings-goal").textContent = newVal.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });

    // re-render dashboard + charts (safe)
    safeRenderAndCharts();
    updateAllTransactionsTable();

    saveToLocalStorageSafe();
    closeSavingsModal();
    showNotification("Savings goal updated successfully!");
  } catch (err) {
    console.error("submitSavings failed:", err);
    showNotification("⚠️ Couldn't update savings goal. Try again.");
  }
}

/* ------------------------------------------------------------------
   All Transactions modal (full table view)
------------------------------------------------------------------- */

export function openAllTransactionsModal() {
  $("#transaction-search").value = "";

  // start with full list
  state.filteredTransactions = [...state.expenses];

  updateAllTransactionsTable();
  openModal("all-transactions-modal");
}

export function closeAllTransactionsModal() {
  closeModal("all-transactions-modal");
}

/**
 * searchTransactions
 *
 * Live filter for the All Transactions modal table.
 */
export function searchTransactions(e) {
  const q = e.target.value.toLowerCase();

  state.filteredTransactions = q
    ? state.expenses.filter(
        (exp) =>
          exp.description.toLowerCase().includes(q) ||
          exp.date.includes(q) ||
          String(exp.amount).includes(q)
      )
    : [...state.expenses];

  updateAllTransactionsTable();
}

/* ------------------------------------------------------------------
   Edit Transaction modal
------------------------------------------------------------------- */

export function openEditTransaction(id) {
  const exp = state.expenses.find((x) => x.id === id);
  if (!exp) return;

  $("#edit-transaction-id").value = exp.id;
  $("#edit-description").value = exp.description;
  $("#edit-amount").value = exp.amount;
  $("#edit-category").value = exp.category;
  $("#edit-date").value = exp.date;

  openModal("edit-transaction-modal");
}

export function closeEditTransactionModal() {
  closeModal("edit-transaction-modal");
}

/**
 * submitEditTransaction
 *
 * Save edits back into state, keep newest-first sort,
 * refresh UI/charts safely, persist to localStorage.
 */
export function submitEditTransaction(e) {
  e.preventDefault();

  const id = parseInt($("#edit-transaction-id").value, 10);
  const idx = state.expenses.findIndex((x) => x.id === id);
  if (idx === -1) return;

  // validate fields
  const descEl = $("#edit-description");
  const description = validateRequiredField(
    descEl,
    "Description cannot be empty."
  );
  if (description === null) return;

  const amtEl = $("#edit-amount");
  const amount = validateNumberField(amtEl, "Amount must be greater than 0.");
  if (amount === null) return;

  const catEl = $("#edit-category");
  const category = validateRequiredField(catEl, "Please choose a category.");
  if (category === null) return;

  const dateEl = $("#edit-date");
  const date = validateRequiredField(dateEl, "Please select a valid date.");
  if (date === null) return;

  try {
    state.expenses[idx] = {
      ...state.expenses[idx],
      description,
      amount,
      category,
      date,
      timestamp: parseLocalDate(date).getTime(), // sortable
    };

    // newest first
    state.expenses.sort((a, b) => b.timestamp - a.timestamp);
    state.filteredTransactions = [...state.expenses];

    // Refresh UI and charts safely
    safeRenderAndCharts();
    updateAllTransactionsTable();

    saveToLocalStorageSafe();
    showNotification("Transaction updated successfully!");
    closeEditTransactionModal();
  } catch (err) {
    console.error("submitEditTransaction failed:", err);
    showNotification("⚠️ Couldn't update transaction. Try again.");
  }
}

/* ------------------------------------------------------------------
   Delete Transaction confirmation modal
------------------------------------------------------------------- */

export function openDeleteTransaction(id) {
  $("#delete-transaction-id").value = id;
  openModal("delete-confirmation-modal");
}

export function closeDeleteConfirmationModal() {
  closeModal("delete-confirmation-modal");
}

/**
 * confirmDeleteTransaction
 *
 * Remove a transaction and refresh.
 */
export function confirmDeleteTransaction() {
  const id = parseInt($("#delete-transaction-id").value, 10);

  try {
    state.expenses = state.expenses.filter((x) => x.id !== id);
    state.filteredTransactions = [...state.expenses];

    safeRenderAndCharts();
    updateAllTransactionsTable();

    saveToLocalStorageSafe();
    showNotification("Transaction deleted successfully!");
    closeDeleteConfirmationModal();
  } catch (err) {
    console.error("confirmDeleteTransaction failed:", err);
    showNotification("⚠️ Couldn't delete transaction. Try again.");
  }
}

/* ------------------------------------------------------------------
   Add New Expense form (sidebar)
------------------------------------------------------------------- */

/**
 * handleAddExpense
 *
 * Add a brand new expense from the sidebar form.
 * Includes validation, ordering, persistence, and UI refresh.
 */
export function handleAddExpense(e) {
  e.preventDefault();

  const descEl = $("#expense-description");
  const amountEl = $("#expense-amount");
  const catEl = $("#expense-category");
  const dateEl = $("#expense-date");

  const description = validateRequiredField(
    descEl,
    "Please enter a description for this expense."
  );
  if (description === null) return;

  const amount = validateNumberField(
    amountEl,
    "Amount must be greater than 0."
  );
  if (amount === null) return;

  const category = validateRequiredField(catEl, "Please choose a category.");
  if (category === null) return;

  const date = validateRequiredField(dateEl, "Please select a valid date.");
  if (date === null) return;

  try {
    // add to state
    state.expenses.push({
      id: Date.now(),
      description,
      amount,
      category,
      date,
      timestamp: parseLocalDate(date).getTime(),
    });

    // newest first
    state.expenses.sort((a, b) => b.timestamp - a.timestamp);
    state.filteredTransactions = [...state.expenses];

    // redraw UI + charts
    safeRenderAndCharts();
    updateAllTransactionsTable();

    // persist
    saveToLocalStorageSafe();

    // reset form + default date to today
    $("#expense-form").reset();
    $("#expense-date").valueAsDate = new Date();

    showNotification("Expense added successfully!");
  } catch (err) {
    console.error("handleAddExpense failed:", err);
    showNotification("⚠️ Couldn't add expense. Try again.");
  }
}
