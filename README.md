#  Daily Expense & Budget Tracker

> A modular, client-side web application for tracking daily expenses, visualizing spending, and managing monthly budgets — with JSON import/export, dark mode, and persistent local storage.

---

## Table of Contents

- [Daily Expense \& Budget Tracker](#-daily-expense--budget-tracker)
  - [Table of Contents](#-table-of-contents)
  - [Overview](#-overview)
  - [Live/Local Usage](#️-livelocal-usage)
  - [Key Features](#️-key-features)
    - [Core Functionality](#core-functionality)
    - [Data Handling](#data-handling)
    - [UX Enhancements](#ux-enhancements)
  - [Quick Start](#-quick-start)
  - [How to Use](#-how-to-use)
    - [1. Set Budget \& Savings Goal](#1-set-budget--savings-goal)
    - [2. Add an Expense](#2-add-an-expense)
    - [3. View All Transactions](#3-view-all-transactions)
    - [4. Export / Import Data](#4-export--import-data)
    - [5. Change Chart View](#5-change-chart-view)
    - [6. Toggle Dark Mode](#6-toggle-dark-mode)
  - [UI Guide](#-ui-guide)
  - [Architecture \& Code Structure](#-architecture--code-structure)
  - [Functions (Developer Reference)](#-functions-developer-reference)
  - [Tech Stack](#-tech-stack)
  - [Project Documentation](#-project-documentation)
    - [Requirements Gathering Document](#-requirements-gathering-document)
    - [Wireframe Justification and Design Decisions](#️-wireframe-justification-and-design-decisions)
    - [Project Plan and Gantt Chart](#-project-plan-and-gantt-chart)

---

## Overview

The **Budget Tracker** is a modular single-page web app built using **Tailwind CSS** and **Vanilla JavaScript**.  
It helps users:

- Manage a monthly **budget** and **savings goal**
- Log, edit, and delete daily **expenses**
- Visualize spending with **Chart.js**
- Export or import all data as **JSON backups**
- Switch between **dark and light themes**
- Store data persistently via **localStorage**

All logic runs entirely in the browser — **no backend or database required**.

---

## Live/Local Usage

Simply open the HTML file in your browser — no build tools needed.

```plaintext
BudgetTrackerWebsite/
├─ .vscode/
│  └─ settings.json
├─ images/
├─ json/
│  ├─ .eslintrc.json
│  └─ .prettierrc.json
├─ scripts/
│  ├─ charts.js
│  ├─ main.js
│  ├─ modals.js
│  ├─ safe.js
│  ├─ state.js
│  ├─ storage.js
│  └─ ui.js
├─ styles/
│  └─ style.css
├─ index.html
└─ README.md
```

Optionally, host the app using GitHub Pages, Vercel, or Netlify for live access.

---

## Key Features

### Core Functionality

-  **Expense CRUD:** Add, edit, delete, and search transactions
-  **Budget & Savings Goals:** Visual progress with color-coded bars
-  **Charts:** Line (expense trends) and doughnut (category breakdown)
-  **Dark Mode:** Persists between sessions
-  **Data Persistence:** Saved automatically in `localStorage`

### Data Handling

-  **Export:** Download a backup as `budgetTracker-YYYY-MM-DD.json`
-  **Import:** Restore previous data from a JSON file
-  **Safe Storage:** Includes error handling and defensive merges

### UX Enhancements

-  Toast notifications for feedback
-  Responsive design for all screen sizes
-  Clean modular code for scalability

---

##  Quick Start

1. **Download or clone** this project.
2. **Open** `index.html` in a browser.
3. Start adding expenses — your data will automatically be saved locally.

---

## 📖 How to Use

### 1. Set Budget & Savings Goal

Click the **Total Budget** or **Savings Goal** amount to open a modal.
Enter a new value and click **Save**.

### 2. Add an Expense

Fill out the **Description**, **Amount**, **Category**, and **Date** fields, then click **Add Expense**.
The new entry will appear in **Recent Transactions** and update all charts.

### 3. View All Transactions

Click **View All** to open a full table view.
Use the **Search** bar to filter by description, category, amount, or date.
Click the **✏️ pencil icon** to edit or the **🗑️ trash icon** to delete a transaction.

### 4. Export / Import Data

- **Export:** Click **Export Data** to download a JSON backup file named `budgetTracker-YYYY-MM-DD.json`.
- **Import:** Click **Import Data** to upload a previous backup and restore your budget, savings, and transactions.

### 5. Change Chart View

Switch between **Week**, **Month**, and **Year** in the **Expense Overview** chart to visualize your spending trends.

### 6. Toggle Dark Mode

Click the **🌙 moon/sun ☀️** icon in the header to switch between light and dark themes.
Your theme preference is saved automatically.

---

##  UI Guide

| Section                    | Description                                                    |
| -------------------------- | -------------------------------------------------------------- |
| **Header**                 | Displays app name, theme toggle, and current date              |
| **Summary Cards**          | Budget, total expenses, remaining amount, and savings progress |
| **Charts**                 | Expense Overview (line) and Spending by Category (doughnut)    |
| **Recent Transactions**    | Displays 5 most recent expenses                                |
| **All Transactions Modal** | Full CRUD table with search functionality                      |
| **Notifications**          | Toast alerts for success or errors (ARIA live)                 |

---

##  Architecture & Code Structure

This app follows a modular ES6 structure for readability and scalability.

| File                    | Purpose                             |
| ----------------------- | ----------------------------------- |
| `scripts/state.js`      | Central state and helper functions  |
| `scripts/ui.js`         | UI rendering and notification logic |
| `scripts/charts.js`     | Chart.js setup and updates          |
| `scripts/safe.js`       | Safe rendering wrapper              |
| `scripts/storage.js`    | LocalStorage CRUD, import/export    |
| `scripts/modals.js`     | Modal dialog management             |
| `scripts/main.js`       | Event listeners and initialization  |
| `styles/style.css`      | Custom styling                      |
| `json/.eslintrc.json`   | ESLint configuration                |
| `json/.prettierrc.json` | Prettier configuration              |

---

##  Functions (Developer Reference)

| Function                    | Description                        |
| --------------------------- | ---------------------------------- |
| `renderApp()`               | Refreshes all UI sections          |
| `safeRenderAndCharts()`     | Safely re-renders UI and charts    |
| `initializeCharts()`        | Creates Chart.js instances         |
| `updateCharts()`            | Updates both charts                |
| `importDataFromFile(file)`  | Imports JSON backup defensively    |
| `exportDataJSON()`          | Exports current data as dated JSON |
| `saveToLocalStorageSafe()`  | Persists state securely            |
| `syncThemeToDOM()`          | Syncs dark/light theme             |
| `showNotification(message)` | Displays toast feedback            |

---

##  Tech Stack

- **Tailwind CSS (CDN)** – Utility-first styling
- **Chart.js (CDN)** – Interactive charts
- **Vanilla JavaScript (ES6 Modules)** – Core logic
- **LocalStorage** – Data persistence

---

##  Project Documentation

---

###  Requirements Gathering Document

This document outlines the initial phase of the project, detailing stakeholder requirements, functional and non-functional specifications, and the final approval log for the **Budget Tracker** project.

<p align="center"><a href="https://docs.google.com/document/d/1etwZgnCslsuRYfLSjMoCElXrALwSjlutLBiek4C9B3A/edit?usp=sharing" target="_blank" style="outline:none;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://docs.google.com/document/d/1etwZgnCslsuRYfLSjMoCElXrALwSjlutLBiek4C9B3A/edit?usp=sharing" alt="Requirements Gathering QR Code" width="200" style="border:0;"/></a></p>

---

###  Wireframe Justification and Design Decisions

This document provides the rationale behind the project's UI/UX design, justifying the wireframe choices based on **Human-Computer Interaction (HCI)** principles, technical feasibility, and user experience goals.

<p align="center"><a href="https://docs.google.com/document/d/1D0Vepv_MbIJjhRpgWafzE2IFRNDJ-oYc3sXP5bd1Wzw/edit?usp=sharing" target="_blank" style="outline:none;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://docs.google.com/document/d/1D0Vepv_MbIJjhRpgWafzE2IFRNDJ-oYc3sXP5bd1Wzw/edit?usp=sharing" alt="Wireframe Justification QR Code" width="200" style="border:0;"/></a></p

---

###  Project Plan and Gantt Chart

This spreadsheet contains the complete project timeline, including the phased breakdown of activities, task durations, assigned team members, and overall schedule for the **Budget Tracker** project.

<p align="center"><a href="https://docs.google.com/spreadsheets/d/1bwFmgUFChvp5VOA9_AfjprGblmZr6pWFwGl-YBRpSB8/edit?usp=sharing" target="_blank" style="outline:none;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://docs.google.com/spreadsheets/d/1bwFmgUFChvp5VOA9_AfjprGblmZr6pWFwGl-YBRpSB8/edit?usp=sharing" alt="Project Plan QR Code" width="200" style="border:0;"/></a></p>

## 
