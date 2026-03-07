import { state, parseLocalDate } from "./state.js";
import { safeRenderAndCharts } from "./safe.js";
import { $, showNotification, updateAllTransactionsTable } from "./ui.js";
import {
  saveToLocalStorageSafe,
  addExpenseToDB,
  deleteExpenseFromDB,
} from "./storage.js";

/* ------------------------------------------------------------------
    Accessible modal focus management
------------------------------------------------------------------- */

let activeModal = null;
let lastFocusedElementBeforeModal = null;

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

function handleEscToClose(e) {
  if (e.key !== "Escape" || !activeModal) return;
  closeModal(activeModal.id);
}

export function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  activeModal = modal;
  lastFocusedElementBeforeModal = document.activeElement;

  modal.classList.remove("hidden");

  const focusables = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusables.length > 0) {
    focusables[0].focus();
  }

  document.addEventListener("keydown", keepFocusInModal);
  document.addEventListener("keydown", handleEscToClose);
}

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
    Validation Helpers
------------------------------------------------------------------- */

function validateRequiredField(inputEl, message) {
  const val = inputEl.value.trim();
  if (!val) {
    showNotification(message);
    inputEl.focus();
    return null;
  }
  return val;
}

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
    Budget & Savings (Still LocalStorage for now)
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
  const newVal = validateNumberField(inputEl, "Enter valid budget > 0");
  if (newVal === null) return;

  state.budget = newVal;
  $("#budget-amount").textContent = newVal.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
  });

  safeRenderAndCharts();
  saveToLocalStorageSafe(); // Saves only settings
  closeBudgetModal();
  showNotification("Budget updated!");
}

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
  const newVal = validateNumberField(inputEl, "Enter valid goal > 0");
  if (newVal === null) return;

  state.savingsGoal = newVal;
  $("#savings-goal").textContent = newVal.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
  });

  safeRenderAndCharts();
  saveToLocalStorageSafe();
  closeSavingsModal();
  showNotification("Savings goal updated!");
}

/* ------------------------------------------------------------------
    All Transactions Modal
------------------------------------------------------------------- */

export function openAllTransactionsModal() {
  $("#transaction-search").value = "";
  state.filteredTransactions = [...state.expenses];
  updateAllTransactionsTable();
  openModal("all-transactions-modal");
}

export function closeAllTransactionsModal() {
  closeModal("all-transactions-modal");
}

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
    Edit Transaction (Currently Local-Only until PUT is implemented)
------------------------------------------------------------------- */

export function openEditTransaction(id) {
  // id is the string _id from MongoDB
  const exp = state.expenses.find((x) => x.id === id);
  if (!exp) return;

  $("#edit-transaction-id").value = exp.id;
  $("#edit-description").value = exp.description;
  $("#edit-amount").value = exp.amount;
  $("#edit-category").value = exp.category;
  $("#edit-date").value = exp.date;

  // NEW: Reset the file label when opening the modal
  const fileLabel = $("#edit-file-label");
  if (fileLabel) fileLabel.textContent = "No file chosen";

  // Clear any previously selected file from the hidden input
  const fileInput = $("#edit-receipt");
  if (fileInput) fileInput.value = "";

  openModal("edit-transaction-modal");
}

export function closeEditTransactionModal() {
  closeModal("edit-transaction-modal");
}

export async function submitEditTransaction(e) {
  e.preventDefault();

  const id = $("#edit-transaction-id").value;
  const idx = state.expenses.findIndex((x) => x.id === id);
  if (idx === -1) return;

  const descEl = $("#edit-description");
  const description = validateRequiredField(descEl, "Description cannot be empty.");
  if (description === null) return;

  const amtEl = $("#edit-amount");
  const amount = validateNumberField(amtEl, "Amount must be > 0.");
  if (amount === null) return;

  const catEl = $("#edit-category");
  const category = validateRequiredField(catEl, "Choose a category.");
  if (category === null) return;

  const dateEl = $("#edit-date");
  const date = validateRequiredField(dateEl, "Select a valid date.");
  if (date === null) return;

  // NEW: Grab the edit file input
  const receiptEl = $("#edit-receipt");
  const submitBtn = e.target.querySelector("button[type='submit']");

  // UI Loading State
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Updating...";
  submitBtn.disabled = true;

  try {
    let newReceiptUrl = null;

    // 1. If a NEW file was selected during the edit, upload it to Firebase first
    if (receiptEl && receiptEl.files.length > 0) {
      const formData = new FormData();
      formData.append("receipt", receiptEl.files[0]);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Image upload failed");

      const uploadData = await uploadRes.json();
      newReceiptUrl = uploadData.imageUrl;
    }

    // 2. Call the PUT API to update MongoDB
    const res = await fetch(`/api/expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        amount,
        category,
        date,
        receiptUrl: newReceiptUrl, // Backend keeps old URL if this is null
      }),
    });

    if (!res.ok) throw new Error("Update failed on server");
    const updatedExpense = await res.json();

    // 3. Update Global State with the data returned from the server
    state.expenses[idx] = {
      ...state.expenses[idx],
      description: updatedExpense.description,
      amount: updatedExpense.amount,
      category: updatedExpense.category,
      date: updatedExpense.date.split("T")[0],
      receiptUrl: updatedExpense.receiptUrl, // Correctly updated or preserved
      timestamp: parseLocalDate(date).getTime(),
    };

    // 4. Sort and Refresh UI
    state.expenses.sort((a, b) => b.timestamp - a.timestamp);
    state.filteredTransactions = [...state.expenses];

    safeRenderAndCharts();
    updateAllTransactionsTable();
    closeEditTransactionModal();
    showNotification("Transaction updated successfully!");
  } catch (err) {
    console.error("Update failed", err);
    showNotification("⚠️ Error: " + err.message);
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

/* ------------------------------------------------------------------
    Delete Transaction (CONNECTED TO DB)
------------------------------------------------------------------- */

export function openDeleteTransaction(id) {
  $("#delete-transaction-id").value = id;
  openModal("delete-confirmation-modal");
}

export function closeDeleteConfirmationModal() {
  closeModal("delete-confirmation-modal");
}

export async function confirmDeleteTransaction() {
  // 1. Get the ID (String)
  const id = $("#delete-transaction-id").value;
  const btn = $("#delete-confirm");

  // UI Loading State
  const originalText = btn.textContent;
  btn.textContent = "Deleting...";
  btn.disabled = true;

  try {
    // 2. Call API
    const success = await deleteExpenseFromDB(id);

    if (success) {
      // 3. Remove from State
      state.expenses = state.expenses.filter((x) => x.id !== id);
      state.filteredTransactions = [...state.expenses];

      safeRenderAndCharts();
      updateAllTransactionsTable();
      showNotification("Transaction deleted!");
      closeDeleteConfirmationModal();
    }
  } catch (err) {
    console.error("Delete failed", err);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

/* ------------------------------------------------------------------
    Add New Expense (CONNECTED TO DB)
------------------------------------------------------------------- */

export async function handleAddExpense(e) {
  e.preventDefault();

  const descEl = $("#expense-description");
  const amountEl = $("#expense-amount");
  const catEl = $("#expense-category");
  const dateEl = $("#expense-date");
  // NEW: Grab the receipt file input
  const receiptEl = $("#receipt");
  const submitBtn = e.target.querySelector("button[type='submit']");

  const description = validateRequiredField(descEl, "Description required");
  if (!description) return;

  const amount = validateNumberField(amountEl, "Amount must be > 0");
  if (!amount) return;

  const category = validateRequiredField(catEl, "Category required");
  if (!category) return;

  const date = validateRequiredField(dateEl, "Date required");
  if (!date) return;

  // UI Loading State
  const originalText = submitBtn.textContent;
  // NEW: Update text so the user knows an image is uploading
  submitBtn.textContent = "Uploading & Saving...";
  submitBtn.disabled = true;

  try {
    let receiptUrl = null;

    // NEW: 1. Upload the image to Firebase via our backend IF a file was selected
    if (receiptEl && receiptEl.files.length > 0) {
      const formData = new FormData();
      formData.append("receipt", receiptEl.files[0]);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData, // The browser automatically sets the correct multipart/form-data headers!
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload receipt image");
      }

      const uploadData = await uploadRes.json();
      receiptUrl = uploadData.imageUrl; // Grab the public Firebase URL
    }

    // 2. Send to MongoDB
    const newExpense = await addExpenseToDB({
      description,
      amount,
      category,
      date,
      receiptUrl, // NEW: Pass the Firebase URL to your database save function!
    });

    if (newExpense) {
      // 3. Add to State (Map Mongo _id to frontend id)
      state.expenses.push({
        id: newExpense._id,
        description: newExpense.description,
        amount: newExpense.amount,
        category: newExpense.category,
        date: newExpense.date.split("T")[0],
        timestamp: parseLocalDate(date).getTime(),
        receiptUrl: newExpense.receiptUrl, // NEW: Add it to the local UI state
      });

      // 4. Sort & Render
      state.expenses.sort((a, b) => b.timestamp - a.timestamp);
      state.filteredTransactions = [...state.expenses];

      safeRenderAndCharts();
      updateAllTransactionsTable();

      // 5. Reset Form
      $("#expense-form").reset();
      $("#expense-date").valueAsDate = new Date();

      showNotification("Expense saved to database!");
    }
  } catch (err) {
    console.error("Add failed", err);
    // NEW: Alert the user if the image upload fails
    alert("Error saving expense: " + err.message);
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}
