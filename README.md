# Daily Expense & Budget Tracker — README

> A single‑file web app to track daily expenses, visualize spending, and manage a monthly budget with dark mode and persistent storage (via `localStorage`).

---

## Table of Contents

* [Overview](#overview)
* [Live/Local Usage](#livelocal-usage)
* [Key Features](#key-features)
* [Quick Start](#quick-start)
* [How to Use](#how-to-use)
* [UI Guide](#ui-guide)
* [Data & Persistence](#data--persistence)
* [Functions (Developer Reference)](#functions-developer-reference)
* [Tech Stack](#tech-stack)
* [Configuration](#configuration)
* [Accessibility & UX](#accessibility--ux)
* [Limitations & Future Ideas](#limitations--future-ideas)
* [Troubleshooting](#troubleshooting)
* [License](#license)

---

## Overview

This is a lightweight, client‑side **Budget Tracker** built entirely in a single HTML file. It lets you set a monthly budget and savings goal, add/edit/delete expenses, search through transactions, and view charts for expense trends and category breakdowns. All data is stored locally in your browser (no backend required).

---

## Live/Local Usage

You can run it by simply opening the HTML file in any modern browser (Chrome, Edge, Firefox, Safari). No build tools are required.

```text
budget-tracker/
└─ BudgetTrackerWebsiteUpdated.html
```

> Optional: Host it on GitHub Pages, Vercel, or any static file server by uploading the single HTML file.

---

## Key Features

* **Single-file app**: HTML + JS + Tailwind via CDN; Chart.js for graphs.
* **Dark Mode**: Toggleable; preference is saved and auto‑applied on next visit.
* **Monthly Budget & Savings Goal**: Click the amounts to update via modal dialogs.
* **Expense CRUD**: Add, view (recent & full list), edit, delete.
* **Searchable Transactions**: Filter by description, category name, date string, or amount.
* **Charts**:

  * *Expense Overview* (line chart): switch between **Week / Month / Year** views.
  * *Spending by Category* (doughnut chart): auto‑aggregated totals per category.
* **Category Breakdown List**: Compact totals with color indicators matching the chart.
* **Responsive UI**: Mobile‑friendly layout with Tailwind.
* **Persistent Storage**: Uses `localStorage` to remember budget, savings goal, dark mode, and all added transactions.

---

## Quick Start

1. Download or clone the project folder.
2. Double‑click **`BudgetTrackerWebsiteUpdated.html`** to open it in your browser.
3. (Recommended) Enable **Site permissions → Allow local storage/cookies** in your browser settings.

---

## How to Use

1. **Set Budget & Savings Goal**

   * Click the **Total Budget** amount or **Savings Goal** amount → a modal opens.
   * Enter a value (₱) → **Save**.
2. **Add an Expense**

   * Fill out **Description**, **Amount**, **Category**, and **Date** in the **Add New Expense** form.
   * Click **Add Expense** → the entry appears in **Recent Transactions** and is included in charts.
3. **View All Transactions**

   * Click **View All** → a full‑screen modal shows a table of all transactions.
   * Use the **Search** box to filter.
4. **Edit or Delete**

   * In **All Transactions**, click the **pencil** icon to edit; click the **trash** icon to delete.
5. **Change Chart Period**

   * In **Expense Overview**, pick **Week**, **Month**, or **Year** to re‑aggregate totals.
6. **Toggle Dark Mode**

   * Click the **moon/sun** button in the header.

---

## UI Guide

### Header

* **Brand** + **Dark Mode Toggle** + **Current Date**.

### Summary Cards

* **Total Budget**: Click to edit budget.
* **Total Expenses**: Sum of all recorded expenses.
* **Remaining**: Budget minus expenses, with a progress bar and color state:

  * Green (≥ 50%), Yellow (20–49%), Red (< 20%).
* **Savings Goal**: Click to edit goal; shows progress (% of goal achieved). *(Note: current implementation uses a `savings` field but does not auto‑increase it from expenses—see “Limitations”)*.

### Charts

* **Expense Overview (Line)**: Aggregated over selected period (Week/Month/Year).
* **Spending by Category (Doughnut)**: Distribution of totals per category, with matching legend colors.

### Recent Transactions

* Shows the **5 most recent** items (newest first).

### All Transactions (Modal)

* Full table of all entries with **Edit**/**Delete** actions and **Search** field.

### Modals

* **Update Budget**, **Update Savings Goal**, **Edit Transaction**, **Delete Confirmation**, **All Transactions**.

---

## Data & Persistence

All state lives in memory and is saved to **`localStorage`** on each change.

* **Keys Used**

  * `budgetTrackerDarkMode` → `"true" | "false"`
  * `budgetTrackerData` → JSON blob containing the app state below.

* **Stored Shape**

```json
{
  "darkMode": false,
  "budget": 2500.0,
  "savingsGoal": 500.0,
  "expenses": [
    {
      "id": 1715865600000,
      "description": "Chicken sandwich",
      "amount": 120.0,
      "category": "food",
      "date": "2025-09-17",
      "timestamp": 1715865600000
    }
  ],
  "savings": 0
}
```

* **Expense Categories**: `food`, `transportation`, `entertainment`, `utilities`, `shopping`, `health`, `other`.
* **Currency Formatting**: `en-PH` locale, `PHP`.

---

## Functions (Developer Reference)

Below are the core functions and what they do. (They’re defined inline in the script tag.)

### App State & Boot

* `loadFromLocalStorage()` → Hydrates app state and UI from stored data.
* `saveToLocalStorage()` → Persists current state (`budget`, `savingsGoal`, `expenses`, `savings`, `darkMode`).
* `updateCurrentDate()` → Renders today’s localized date in the header.

### Theming

* `toggleDarkMode()` → Toggles dark mode, updates icons, saves preference.
* `updateChartsTheme()` → Applies dark/light colors to axes and legends.

### Charts

* `initializeCharts()` → Creates **line** and **doughnut** Chart.js instances.
* `updateCharts()` → Refresh wrapper for both charts.
* `updateExpenseChart()` → Rebuilds data for line chart from `getExpenseChartData()` and updates the chart.
* `getExpenseChartData()` → Returns `{ labels, data }` arrays depending on period (`week`/`month`/`year`).
* `updateCategoryChart()` → Aggregates totals per category and updates doughnut chart colors/data.
* `changeTimePeriod(period)` → Switches active time period UI and recalculates the line chart.

### Transactions (CRUD + Search)

* `handleAddExpense(e)` → Validates form, pushes a new expense object, sorts by date (newest first), updates UI + storage.
* `updateTransactionsList()` → Renders top 5 recent.
* `openAllTransactionsModal()` / `closeAllTransactionsModal()` → Shows/hides the table modal.
* `updateAllTransactionsTable()` → Populates the table body from `filteredTransactions`.
* `searchTransactions(e)` → Filters by description, category display name, date string, or numeric amount.
* `window.editTransaction(id)` → Fills edit modal with the selected expense data and opens it.
* `saveEditedTransaction(e)` → Updates an existing record, re-sorts, refreshes UI + storage.
* `closeEditTransactionModal()` → Closes modal.
* `window.confirmDeleteTransaction(id)` → Opens delete confirmation for an id.
* `deleteTransaction()` → Removes the record, refreshes UI + storage, then closes modal.
* `closeDeleteConfirmationModal()` → Closes modal.

### Budget & Savings

* `openBudgetModal()` / `closeBudgetModal()` → Modal controls.
* `updateBudget(e)` → Saves new monthly budget and refreshes summary + storage.
* `openSavingsModal()` / `closeSavingsModal()` → Modal controls.
* `updateSavingsGoal(e)` → Saves new goal and refreshes summary + storage.
* *Note:* There is a `savings` field in state; UI tracks **goal progress** but does not auto‑compute savings from expenses.

### Helpers

* `updateUI()` → Orchestrates all UI refresh (cards, lists, breakdown, charts).
* `updateSummaryCards()` → Recomputes totals, remaining %, and savings % with progress bars and colors.
* `updateCategoryBreakdown()` → Renders compact per‑category totals.
* `getCategoryName(key)` → Maps canonical keys to human‑readable labels.
* `formatCurrency(amount)` → `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`.
* `showNotification(message)` → Lightweight toast notification (auto‑dismiss).

### Events (wired on `DOMContentLoaded`)

* Form submit: add expense.
* Click: budget/savings edit, modal open/close, theme toggle, All Transactions open/close.
* Input: search box in All Transactions.
* Click: time period buttons (Week/Month/Year).

---

## Tech Stack

* **Tailwind CSS** via CDN for layout and styling.
* **Chart.js** via CDN for line/doughnut charts.
* **Vanilla JavaScript** for app logic and state management.
* **LocalStorage** for persistence.

CDN scripts are loaded directly in the `<head>`:

```html
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

---

## Configuration

* **Default Values**

  * `budget`: ₱2,500.00
  * `savingsGoal`: ₱500.00
  * `currentTimePeriod`: `"week"`
* **Locale/Currency**: `en-PH` (Philippines) / `PHP`.
* **Colors per Category**: Defined in `state.categoryColors` with matching hex for icons and rgba fills for charts.

---

## Accessibility & UX

* Uses semantic controls, clear color contrast in dark mode, and progressively‑enhanced interactions.
* Forms enforce required fields and minimal numeric values for amount inputs.
* Focus order follows DOM; modals are plain but keyboard focus trapping is not yet implemented.

---

## Limitations & Future Ideas

**Current Limitations**

* Data is **local to one browser/device**; clearing site data or switching devices resets it.
* Currency and locale are fixed to **PHP**.
* **Savings progress** expects manual logic; `savings` doesn’t auto‑increase (e.g., from “Remaining”).
* No **export/import** of transactions (CSV/JSON).
* No **recurring transactions** or **income tracking**.
* Summary subtleties like *“+5% from last month”* in the UI are static placeholders and not computed.

**Potential Enhancements**

* Export/Import (CSV/JSON) and simple cloud sync.
* Income entries and net cashflow view.
* Recurring bills with reminders.
* Improved accessibility (focus trap & ESC to close modals).
* Category management (add/edit custom categories and colors).
* PWA support for offline install.

---

## Troubleshooting

* **My data disappeared** → Ensure the browser didn’t clear site data; `localStorage` is per‑origin. Try not to use privacy/incognito mode if you want persistence.
* **Charts look blank** → Add at least one expense or switch the **Week/Month/Year** toggle. Check console for errors if CDNs failed to load.
* **Wrong currency** → Currently locked to PHP; change in `formatCurrency()` helper if needed.
* **Dark mode not remembered** → Verify `budgetTrackerDarkMode` exists in Application Storage.

### 📄 Requirements Gathering Document

This document outlines the initial phase of the project, detailing stakeholder requirements, functional and non-functional specifications, and the final approval log for the **Budget Tracker** project.

<p align="center">
  <a href="https://docs.google.com/document/d/1etwZgnCslsuRYfLSjMoCElXrALwSjlutLBiek4C9B3A/edit?usp=sharing" target="_blank">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://docs.google.com/document/d/1etwZgnCslsuRYfLSjMoCElXrALwSjlutLBiek4C9B3A/edit?usp=sharing" alt="Requirements Gathering QR Code" width="200"/>
  </a>
</p>

---

### ✏️ Wireframe Justification and Design Decisions

This document provides the rationale behind the project's UI/UX design, justifying the wireframe choices based on **Human-Computer Interaction (HCI)** principles, technical feasibility, and user experience goals.

<p align="center">
  <a href="https://docs.google.com/document/d/1D0Vepv_MbIJjhRpgWafzE2IFRNDJ-oYc3sXP5bd1Wzw/edit?usp=sharing" target="_blank">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://docs.google.com/document/d/1D0Vepv_MbIJjhRpgWafzE2IFRNDJ-oYc3sXP5bd1Wzw/edit?usp=sharing" alt="Wireframe Justification QR Code" width="200"/>
  </a>
</p>

---

### 📅 Project Plan and Gantt Chart

This spreadsheet contains the complete project timeline, including the phased breakdown of activities, task durations, assigned team members, and overall schedule for the **Budget Tracker** project.

<p align="center">
  <a href="https://docs.google.com/spreadsheets/d/1bwFmgUFChvp5VOA9_AfjprGblmZr6pWFwGl-YBRpSB8/edit?usp=sharing" target="_blank">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://docs.google.com/spreadsheets/d/1bwFmgUFChvp5VOA9_AfjprGblmZr6pWFwGl-YBRpSB8/edit?usp=sharing" alt="Project Plan QR Code" width="200"/>
  </a>
</p>
