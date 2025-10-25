/**
 * ui.js
 *
 * All DOM rendering / updating logic lives here:
 *  - Summary cards
 *  - Recent transactions list
 *  - Full transactions table
 *  - Category breakdown
 *  - Header date + footer year
 *  - Toast notifications
 *
 * This file should NEVER mutate app logic/state except for safe derived values
 * (like computing savings %, or setting state.savings for display).
 * App "business data" lives in state.js.
 */

import {
  state,
  formatCurrency,
  parseLocalDate,
  getCategoryName,
} from "./state.js";

/**
 * Tiny DOM helpers
 * $  = first match
 * $$ = all matches -> Array
 */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/**
 * showNotification(message)
 *
 * Renders a temporary toast in the bottom-right corner.
 * Accessibility:
 *  - role="status" + aria-live="polite" so screen readers get the update
 *    without yanking focus.
 */
export function showNotification(message) {
  const el = document.createElement("div");
  el.className =
    "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-500 translate-y-20 opacity-0 z-50";
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  el.textContent = message;

  document.body.appendChild(el);

  // entrance animation
  setTimeout(() => {
    el.classList.remove("translate-y-20", "opacity-0");
  }, 100);

  // exit animation then remove
  setTimeout(() => {
    el.classList.add("translate-y-20", "opacity-0");
    setTimeout(() => el.remove(), 500);
  }, 3000);
}

/**
 * syncThemeToDOM()
 *
 * Syncs current theme from state.darkMode into:
 *  - <body> BEM modifier .app--dark
 *  - <html> .dark (for Tailwind dark: classes)
 *  - toggles sun/moon icons for the toggle button
 */
export function syncThemeToDOM() {
  document.body.classList.toggle("app--dark", state.darkMode);
  document.documentElement.classList.toggle("dark", state.darkMode);

  const moon = document.getElementById("moon-icon");
  const sun = document.getElementById("sun-icon");
  if (moon && sun) {
    moon.classList.toggle("hidden", state.darkMode);
    sun.classList.toggle("hidden", !state.darkMode);
  }
}

/**
 * updateHeaderDateAndYear()
 *
 * - Sets the human-readable current date in the header chip
 * - Sets the footer year
 */
export function updateHeaderDateAndYear() {
  const now = new Date();
  const options = { year: "numeric", month: "long", day: "numeric" };

  const dateTarget = $("#current-date span");
  if (dateTarget) {
    dateTarget.textContent = now.toLocaleDateString(undefined, options);
  }

  const yearTarget = $("#current-year");
  if (yearTarget) {
    yearTarget.textContent = now.getFullYear();
  }
}

/**
 * updateSummaryCards()
 *
 * Updates:
 *  - Total expenses
 *  - Remaining budget + progress bar state/width/color
 *  - Savings progress
 *
 * Also sets state.savings (derived) so other parts of the UI can read it.
 */
export function updateSummaryCards() {
  const expenses = Array.isArray(state.expenses) ? state.expenses : [];

  // total spent this period
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const expensesEl = $("#expenses-amount");
  if (expensesEl) {
    expensesEl.textContent = formatCurrency(totalSpent);
  }

  // remaining budget
  const remaining = Math.max(0, state.budget - totalSpent);

  const remainingEl = $("#remaining-amount");
  if (remainingEl) {
    remainingEl.textContent = formatCurrency(remaining);
  }

  // remaining % of budget
  const pctRemaining =
    state.budget > 0 ? Math.round((remaining / state.budget) * 100) : 0;

  const pctRemainingEl = $("#remaining-percentage");
  if (pctRemainingEl) {
    pctRemainingEl.textContent = pctRemaining;
  }

  // progress bar visuals
  const bar = $("#remaining-progress");
  if (bar) {
    bar.style.width = `${Math.max(0, Math.min(100, pctRemaining))}%`;

    // choose semantic color bucket for remaining%
    const colorClass =
      pctRemaining < 20
        ? "bg-red-500 "
        : pctRemaining < 50
        ? "bg-yellow-500 "
        : "bg-green-500 ";

    bar.className = colorClass + "h-2.5 rounded-full";
  }

  // savings progress:
  // "savings" is basically how much of remaining money could still be saved,
  // capped at savingsGoal so the bar doesn't overflow visually.
  const savedAmount = Math.min(remaining, state.savingsGoal);
  state.savings = savedAmount;

  const savingsPct =
    state.savingsGoal > 0
      ? Math.round((savedAmount / state.savingsGoal) * 100)
      : 0;

  const savingsPctEl = $("#savings-percentage");
  if (savingsPctEl) {
    savingsPctEl.textContent = savingsPct;
  }

  const savingsBar = $("#savings-progress");
  if (savingsBar) {
    savingsBar.style.width = `${Math.max(0, Math.min(100, savingsPct))}%`;
  }
}

/**
 * updateRecentTransactions()
 *
 * Updates the "Recent Transactions" list (the small card on dashboard).
 * Shows up to 5 most recent expenses.
 */
export function updateRecentTransactions() {
  const container = $("#transactions-container");
  if (!container) return;

  const expenses = Array.isArray(state.expenses) ? state.expenses : [];

  if (!expenses.length) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        <p>No transactions yet. Add your first expense!</p>
      </div>`;
    return;
  }

  container.innerHTML = "";

  expenses.slice(0, 5).forEach((exp) => {
    const color =
      state.categoryColors[exp.category] || state.categoryColors.other;

    const expenseDate = parseLocalDate(exp.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const row = document.createElement("div");
    row.className =
      "transactions__row flex items-center justify-between p-3 rounded-lg";

    row.innerHTML = `
      <div class="flex items-center">
        <div
          class="transactions__icon p-2 rounded-lg mr-4"
          style="background-color: ${color.bg.replace("0.8", "0.2")}"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="${color.color}"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <div class="transactions__desc">
          <p class="font-medium">${exp.description}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">${expenseDate}</p>
        </div>
      </div>
      <p class="transactions__amount font-semibold text-red-500">
        -${formatCurrency(exp.amount)}
      </p>
    `;

    container.appendChild(row);
  });
}

/**
 * updateCategoryBreakdown()
 *
 * Updates the "Spending by Category" breakdown list on the right-hand card.
 */
export function updateCategoryBreakdown() {
  const container = $("#category-breakdown");
  if (!container) return;

  const expenses = Array.isArray(state.expenses) ? state.expenses : [];

  if (!expenses.length) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-4 text-gray-500 dark:text-gray-400">
        <p>No expenses yet to show categories</p>
      </div>`;
    return;
  }

  // total spent per category
  const totals = {};
  expenses.forEach((e) => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });

  container.innerHTML = "";

  Object.entries(totals).forEach(([cat, amt]) => {
    const color = state.categoryColors[cat] || state.categoryColors.other;

    const item = document.createElement("div");
    item.className = "flex items-center justify-between";

    item.innerHTML = `
      <div class="flex items-center">
        <div
          class="w-3 h-3 rounded-full mr-2"
          style="background-color: ${color.color}"
          aria-hidden="true"
        ></div>
        <span class="text-sm">${getCategoryName(cat)}</span>
      </div>
      <span class="text-sm font-medium">${formatCurrency(amt)}</span>
    `;

    container.appendChild(item);
  });
}

/**
 * updateAllTransactionsTable()
 *
 * Rebuilds the big table in the "All Transactions" modal.
 */
export function updateAllTransactionsTable() {
  const body = $("#all-transactions-body");
  const empty = $("#no-transactions-message");
  if (!body || !empty) return;

  const txns = Array.isArray(state.filteredTransactions)
    ? state.filteredTransactions
    : [];

  body.innerHTML = "";

  if (!txns.length) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  txns.forEach((exp) => {
    const color =
      state.categoryColors[exp.category] || state.categoryColors.other;

    const expenseDate = parseLocalDate(exp.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // each row in the table
    const tr = document.createElement("tr");
    tr.className = "transactions__row-table";

    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm">${expenseDate}</td>

      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        ${exp.description}
      </td>

      <td class="px-6 py-4 whitespace-nowrap">
        <span
          class="px-2 py-1 text-xs font-medium rounded-full"
          style="background-color:${color.bg.replace("0.8", "0.2")}; color:${
      color.color
    }"
        >
          ${getCategoryName(exp.category)}
        </span>
      </td>

      <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-500">
        -${formatCurrency(exp.amount)}
      </td>

      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          class="transactions__action-btn text-indigo-600 hover:text-indigo-900 mr-3"
          data-action="edit"
          data-id="${exp.id}"
          aria-label="Edit transaction ${exp.description}"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>

        <button
          class="transactions__action-btn text-red-600 hover:text-red-900"
          data-action="delete"
          data-id="${exp.id}"
          aria-label="Delete transaction ${exp.description}"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </td>
    `;

    body.appendChild(tr);
  });
}

/**
 * renderApp()
 *
 * Master "refresh UI" call for:
 *  - summary cards (totals, remaining, savings progress)
 *  - recent transactions list
 *  - category breakdown
 *
 * NOTE: Charts are handled in charts.js via updateCharts().
 * NOTE: This does NOT rebuild the big transactions table (that only happens
 *       when the All Transactions modal is opened / filtered).
 */
export function renderApp() {
  updateSummaryCards();
  updateRecentTransactions();
  updateCategoryBreakdown();
  // charts are updated elsewhere
}
