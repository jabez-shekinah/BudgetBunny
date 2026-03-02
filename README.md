#  Daily Expense & Budget Tracker

> A robust, full-stack web application for tracking personal finances. Originally a static site, this project has evolved into a dynamic **MERN Stack** (MongoDB, Express, Node.js) application featuring secure user authentication, cloud data persistence, and real-time analytics.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [UI Guide](#ui-guide)
- [Architecture & Code Structure](#architecture--code-structure)
- [Functions (Developer Reference)](#functions-developer-reference)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [How to Use](#how-to-use)
- [Project Documentation](#project-documentation)

---

## Overview

**BudgetBunny** solves the limitation of device-restricted storage by moving from localStorage to a secure cloud database, allowing you to access your data from any device. 

It allows users to:

- **Register & Login** securely to access private data from any device.
- **Track Expenses** with cloud persistence (MongoDB Atlas).
- **Visualize Spending** via interactive charts.
- **Migrate Data** using a smart Bulk Import tool that uploads local JSON files to the cloud.

---

## Key Features

### Security & Authentication
- **User Registration/Login:** Session-based authentication using Express.
- **Data Isolation:** Users can only view and manage their own expenses.
- **Password Hashing:** (Planned/Ready for implementation).

### Cloud & Database
- **MongoDB Atlas Integration:** All expenses are stored in a scalable cloud database.
- **CRUD Operations:** Create, Read, and Delete expenses directly from the server.
- **Bulk Import/Migration:** Upload a JSON file to batch-process and save expenses to the database instantly.

### Dashboard & Analytics
- **Dynamic Charts:** Real-time updates using Chart.js.
- **Global Search:** Filter transactions by date, category, or amount.
- **Dark Mode:** Persisted theme preferences.

---

##  Tech Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | Vanilla JS (ES6) | Modular, lightweight client logic |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Backend** | Node.js + Express | RESTful API server |
| **Database** | MongoDB + Mongoose | NoSQL schema-based data storage |
| **Visualization** | Chart.js | Interactive data rendering |

---

## Project Structure

```plaintext
BudgetBunny/
├─ models/
│  ├─ User.js          # Mongoose Schema for Users
│  └─ Expense.js       # Mongoose Schema for Expenses
├─ public/             # Client-Side Code
│  ├─ js/
│  │  ├─ main.js       # Entry point (Async/Await)
│  │  ├─ storage.js    # API Bridge (Fetch Calls)
│  │  └─ ...
│  ├─ styles/
│  └─ index.html
├─ .env                # Secrets (MONGO_URI)
├─ server.js           # Express App & API Routes
├─ package.json        # Dependencies
└─ README.md
```


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

## Architecture & Code Structure

The project uses a **MVC (Model-View-Controller)** adapted pattern. The Backend (Node/Express) handles data logic, while the Frontend (Vanilla JS) handles the UI.

| File Location           | Purpose |
| :---                    | :--- |
| **Backend** | |
| `server.js`             | Express server entry point. Handles API routes, DB connection, and serving static files. |
| `models/User.js`        | Mongoose schema defining the User structure. |
| `models/Expense.js`     | Mongoose schema defining the Expense structure. |
| **Frontend** | |
| `public/js/main.js`     | App entry point. Handles `async` initialization and global event listeners. |
| `public/js/storage.js`  | **API Bridge.** Contains `fetch` calls to talk to the backend (GET, POST, DELETE). |
| `public/js/state.js`    | Manages temporary client-side state (filtered lists, current view). |
| `public/js/ui.js`       | pure UI logic. Updates the DOM and handles notifications. |
| `public/js/modals.js`   | Manages form submissions and modal visibility. |
| `public/js/charts.js`   | Configures and updates Chart.js visualizations. |

---

## Functions (Developer Reference)

Key functions used to manage data flow between the Client and the Database.

| Function | Description |
| :--- | :--- |
| **Data & API** | |
| `addExpenseToDB(data)`  | **Async.** Sends a `POST` request to save a new expense to MongoDB. |
| `deleteExpenseFromDB(id)`| **Async.** Sends a `DELETE` request to remove an expense from the server. |
| `importDataFromFile(file)`| **Async.** Reads a JSON file and performs a **bulk upload** of expenses to the database. |
| `loadFromLocalStorage()` | **Async.** Loads the user session and **fetches** live data from the API. |
| `saveToLocalStorageSafe()`| **Sync.** Now strictly saves *user preferences* (Theme, Budget Goals) locally. |
| **Visualization** | |
| `safeRenderAndCharts()` | Wrapper that safely re-draws the dashboard and charts with new data. |
| `renderApp()`           | Updates the DOM elements (tables, summary cards) based on current state. |
| `syncThemeToDOM()`      | Applies the Dark/Light mode class to the `<body>`. |

---

## Installation & Setup

### Prerequisites
- Node.js installed.
- A MongoDB Atlas account.

### Setup Instructions

1. Clone the Repository
```bash
git clone https://github.com/yourusername/BudgetBunny.git
cd BudgetBunny
```

2. Install Dependencies
```bash
npm install
```

3. Configure Environment

Create a `.env` file in the root directory:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/testDB?retryWrites=true&w=majority
PORT=3000
```

4. Run the Server
```bash
npm start
```

The server will start on `http://localhost:3000`
  
---

## API Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Create a new user account. |
| POST | `/api/login` | Authenticate user & start session. |
| GET | `/api/expenses/:userId` | Fetch all expenses for a specific user. |
| POST | `/api/expenses` | Save a new expense to the database. |
| DELETE | `/api/expenses/:id` | Permanently remove an expense. |

---

## How to Use

### 1. Register

Create an account on the login screen.

### 2. Create an account on the login screen.

Once logged in, you will see your empty dashboard.

### 3. Add Expense

Use the sidebar form to add a transaction. It saves instantly to the cloud.

### 4. Export / Import Data

- **Export:** Click **Export Data** to download a JSON backup file named `budgetTracker-YYYY-MM-DD.json`.
- **Import:** Click **Import Data** to upload it to your new cloud account.

### 5. Analyze

Switch chart views to see monthly or yearly trends.

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
