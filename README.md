# BudgetBunny: Daily Expense & Budget Tracker

> A robust, full-stack web application for tracking personal finances. Originally a static site, this project has evolved into a dynamic **MERN Stack** (MongoDB, Express, Node.js) application featuring secure user authentication, cloud data persistence, real-time analytics, and automated testing.

**Live Demo:** [https://budgetbunny-43ju.onrender.com](https://budgetbunny-43ju.onrender.com)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [UI Guide](#ui-guide)
- [Architecture & Code Structure](#architecture--code-structure)
- [Automated Testing](#automated-testing)
- [Functions (Developer Reference)](#functions-developer-reference)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [How to Use](#how-to-use)
- [Project Documentation](#project-documentation)

---

## Overview

**BudgetBunny** solves the limitation of device-restricted storage by moving from `localStorage` to a secure cloud database, allowing you to access your data from any device.

It allows users to:

- **Register & Login** securely to access private data from any device.
- **Track Expenses** with cloud persistence (MongoDB Atlas).
- **Attach Receipts** by uploading images directly to Firebase Storage.
- **Visualize Spending** via interactive charts.
- **Migrate Data** using a smart Bulk Import tool that uploads local JSON files to the cloud.

---

## Key Features

### Cloud Infrastructure

- **MongoDB Atlas:** All financial records are stored in a scalable, cloud-based NoSQL database — replacing the previous `localStorage` approach and enabling access from any device.
- **Firebase Storage:** A dedicated cloud bucket hosts and serves receipt images (`.jpg`, `.png`) attached to transactions.
- **Smart Cloud Cleanup:** Auto-deletion logic purges old or orphaned receipt images from the Firebase bucket whenever an expense is updated or deleted, preventing digital clutter.

### Security & Authentication

- **Google OAuth 2.0:** Secure, passwordless "Sign in with Google" using Passport.js and Google Identity Services — no extra passwords for users to manage.
- **Role-Based Access Control (RBAC):** Middleware that identifies whether a user is a standard `User` or an `Admin`, protecting specific routes from unauthorized access.
- **API Security:** Hardened HTTP headers using **Helmet.js** and server-side input sanitization via **express-validator**.
- **Centralized Error Handling:** Prevents server crashes and hides sensitive stack traces from the client in production.

### Automated Quality Assurance

- **Unit Testing (Jest):** Tests that validate Mongoose models (`User` and `Expense`) to ensure they never accept malformed or missing data.
- **Integration Testing (Supertest):** Tests that simulate unauthorized requests to verify all protected routes correctly block access (401/403) and return correct security headers.

### Dashboard & Analytics

- **Dynamic Charts:** Real-time updates using **Chart.js**.
- **Global Search:** Filter transactions by date, category, or amount.
- **Dark Mode:** Persisted theme preferences across sessions.

### Advanced Logic

- **Bulk JSON Importer:** A migration tool that reads a local `localStorage` JSON export and bulk-uploads all records to the cloud database in one operation.

---

## Tech Stack

| Component          | Technology                 | Description                          |
| ------------------ | -------------------------- | ------------------------------------ |
| **Frontend**       | Vanilla JS (ES6)           | Modular, lightweight client logic    |
| **Styling**        | Tailwind CSS               | Utility-first responsive design      |
| **Backend**        | Node.js + Express          | RESTful API server                   |
| **Database**       | MongoDB + Mongoose         | NoSQL schema-based data storage      |
| **Cloud Storage**  | Firebase Admin SDK         | Secure receipt image hosting         |
| **Authentication** | Passport.js                | OAuth 2.0 session management         |
| **Security**       | Helmet & Express-Validator | Header protection and sanitization   |
| **Visualization**  | Chart.js                   | Interactive data rendering           |
| **Testing**        | Jest & Supertest           | Automated unit & integration testing |

---

## Project Structure

```plaintext
BudgetBunny/
├─ models/
│  ├─ User.js          # Mongoose Schema (Includes OAuth & RBAC roles)
│  └─ Expense.js       # Mongoose Schema (Includes Firebase URLs)
├─ public/             # Client-Side Code
│  ├─ js/
│  │  ├─ main.js       # App entry point
│  │  ├─ storage.js    # API Bridge (Fetch calls)
│  │  ├─ state.js      # Client-side state management
│  │  ├─ ui.js         # DOM updates
│  │  ├─ modals.js     # Form/Modal handling
│  │  └─ charts.js     # Chart.js configurations
│  └─ index.html       # Main interface
├─ tests/              # Automated Testing Suite
│  ├─ models.test.js   # Unit tests for data validation
│  └─ expense.test.js  # Integration/Security tests
├─ .env                # Environment Secrets (IGNORED)
├─ firebase-key.json   # Firebase Admin Key (NOT COMMITTED)
├─ server.js           # Express Server & API Routes
├─ package.json        # Dependencies & Scripts
└─ README.md           # Project Documentation
```

---

## UI Guide

| Section                    | Description                                                    |
| -------------------------- | -------------------------------------------------------------- |
| **Header**                 | Displays app name, theme toggle, and current date              |
| **Summary Cards**          | Budget, total expenses, remaining amount, and savings progress |
| **Charts**                 | Expense Overview (line) and Spending by Category (doughnut)    |
| **Recent Transactions**    | Displays 5 most recent expenses                                |
| **All Transactions Modal** | Full CRUD table with search functionality                      |
| **Notifications**          | Toast alerts for success or errors (ARIA live)                 |

---

## Architecture & Code Structure

The project follows an **MVC (Model-View-Controller)** adapted pattern. The backend (Node/Express) handles data and business logic, while the frontend (Vanilla JS) handles the UI.

| File Location          | Purpose                                                                             |
| :--------------------- | :---------------------------------------------------------------------------------- |
| **Backend**            |                                                                                     |
| `server.js`            | Express server entry point. Handles API routes, DB connection, and Auth.            |
| `models/User.js`       | Mongoose schema defining the User structure, including OAuth fields and RBAC roles. |
| `models/Expense.js`    | Mongoose schema defining the Expense structure, including Firebase receipt URLs.    |
| `tests/`               | Contains all Jest and Supertest test files.                                         |
| **Frontend**           |                                                                                     |
| `public/js/main.js`    | App entry point. Handles `async` initialization and global event listeners.         |
| `public/js/storage.js` | **API Bridge.** Contains `fetch` calls to the backend (GET, POST, PUT, DELETE).     |
| `public/js/state.js`   | Manages temporary client-side state (filtered lists, current view).                 |
| `public/js/ui.js`      | Pure UI logic. Updates the DOM and handles notifications.                           |
| `public/js/modals.js`  | Manages form submissions and modal visibility.                                      |
| `public/js/charts.js`  | Configures and updates Chart.js visualizations.                                     |

---

## Automated Testing

BudgetBunny features a dual-layer testing suite to ensure code quality and security.

**Unit Testing (Jest):** Ensures that the `User` and `Expense` models correctly enforce required fields and data types, so no malformed data ever reaches the database.

**Integration Testing (Supertest):** Verifies that protected API routes correctly handle RBAC — blocking unauthorized requests (401/403) and returning the correct security headers.

To run the test suite locally:

```bash
npm test
```

---

## Functions (Developer Reference)

Key functions managing data flow between the client and the database.

| Function                   | Description                                                                                    |
| :------------------------- | :--------------------------------------------------------------------------------------------- |
| **Data & API**             |                                                                                                |
| `addExpenseToDB(data)`     | **Async.** Sends a `POST` request to save a new expense to MongoDB.                            |
| `deleteExpenseFromDB(id)`  | **Async.** Sends a `DELETE` request to remove an expense and trigger Firebase receipt cleanup. |
| `importDataFromFile(file)` | **Async.** Reads a JSON file and performs a **bulk upload** of expenses to the database.       |
| `loadFromLocalStorage()`   | **Async.** Loads the user session and **fetches** live data from the API.                      |
| `saveToLocalStorageSafe()` | **Sync.** Strictly saves _user preferences_ (theme, budget goals) locally.                     |
| **Visualization**          |                                                                                                |
| `safeRenderAndCharts()`    | Wrapper that safely re-draws the dashboard and charts with new data.                           |
| `renderApp()`              | Updates the DOM elements (tables, summary cards) based on current state.                       |
| `syncThemeToDOM()`         | Applies the Dark/Light mode class to the `<body>`.                                             |

---

## Installation & Setup

### Prerequisites

- Node.js installed.
- A MongoDB Atlas account.
- A Firebase project with a Storage bucket and a service account key (`firebase-key.json`).

### Setup Instructions

1. **Clone the Repository**

```bash
git clone https://github.com/polochamps/BudgetBunny.git
cd BudgetBunny
```

2. **Install Dependencies**

```bash
npm install
```

3. **Configure Environment**

Create a `.env` file in the root directory:

```env
MONGO_URI=your_mongodb_atlas_uri
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_CALLBACK_URL=your_callback_url
SESSION_SECRET=your_secret_string
```

Place your Firebase service account key at the project root as `firebase-key.json`. **Do not commit this file.**

4. **Run the Server**

```bash
npm start
```

The server will start on `http://localhost:3000`.

---

## API Documentation

| Method                          | Endpoint                | Description                                                                          |
| ------------------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| **Authentication**              |                         |                                                                                      |
| GET                             | `/auth/google`          | Initiates the Google OAuth 2.0 login flow.                                           |
| GET                             | `/auth/google/callback` | OAuth callback route to establish the user session.                                  |
| GET                             | `/auth/current_user`    | Returns the currently authenticated user's profile data.                             |
| GET                             | `/auth/logout`          | Destroys the session and logs the user out.                                          |
| **Expenses (Protected Routes)** |                         |                                                                                      |
| GET                             | `/api/expenses/:userId` | Fetch all expenses for a specific user.                                              |
| POST                            | `/api/expenses`         | Save a new expense and upload receipt to Firebase.                                   |
| PUT                             | `/api/expenses/:id`     | Update an expense. Automatically replaces the old Firebase receipt with the new one. |
| DELETE                          | `/api/expenses/:id`     | Remove an expense and purge its associated Firebase receipt.                         |

---

## How to Use

1. **Register** — Create an account using email/password or **Sign in with Google**.
2. **Explore the Dashboard** — Set your monthly budget to get started.
3. **Add Expense** — Use the sidebar form to log a transaction. Optionally attach a receipt image. Saves instantly to the cloud.
4. **Export / Import Data**
   - **Export:** Click **Export Data** to download a JSON backup named `budgetTracker-YYYY-MM-DD.json`.
   - **Import:** Click **Import Data** to bulk-upload a previous export to your cloud account.
5. **Analyze** — Switch chart views to see monthly or yearly spending trends by category.

---

## Project Documentation

### Requirements Gathering Document

This document outlines the initial phase of the project, detailing stakeholder requirements, functional and non-functional specifications, and the final approval log.

<p align="center"><a href="https://docs.google.com/document/d/1etwZgnCslsuRYfLSjMoCElXrALwSjlutLBiek4C9B3A/edit?usp=sharing" target="_blank"><img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://docs.google.com/document/d/1etwZgnCslsuRYfLSjMoCElXrALwSjlutLBiek4C9B3A/edit?usp=sharing" alt="Requirements QR" width="150"/></a></p>

---

### Wireframe Justification and Design Decisions

Rationale behind the project's UI/UX design, justifying wireframe choices based on **HCI** principles, technical feasibility, and user experience goals.

<p align="center"><a href="https://docs.google.com/document/d/1D0Vepv_MbIJjhRpgWafzE2IFRNDJ-oYc3sXP5bd1Wzw/edit?usp=sharing" target="_blank"><img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://docs.google.com/document/d/1D0Vepv_MbIJjhRpgWafzE2IFRNDJ-oYc3sXP5bd1Wzw/edit?usp=sharing" alt="Wireframe QR" width="150"/></a></p>

---

### Project Plan and Gantt Chart

Complete project timeline including phased breakdown of activities, task durations, assigned team members, and overall schedule.

<p align="center"><a href="https://docs.google.com/spreadsheets/d/1bwFmgUFChvp5VOA9_AfjprGblmZr6pWFwGl-YBRpSB8/edit?usp=sharing" target="_blank"><img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://docs.google.com/spreadsheets/d/1bwFmgUFChvp5VOA9_AfjprGblmZr6pWFwGl-YBRpSB8/edit?usp=sharing" alt="Project Plan QR" width="150"/></a></p>
