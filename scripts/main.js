// scripts/main.js
document.addEventListener("DOMContentLoaded", () => {
  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const formatCurrency = (n) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(n ?? 0);

  // Parse "yyyy-mm-dd" as local date (avoid UTC shifts)
  const parseLocalDate = (yyyyMMdd) => {
    const [y, m, d] = yyyyMMdd.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  // Replace niceStep() with this:
  function niceScale(max) {
    if (max <= 0) return { suggestedMax: 100, stepSize: 20 };

    const niceNum = (x) => {
      const exp = Math.floor(Math.log10(x));
      const f = x / Math.pow(10, exp);
      const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
      return nf * Math.pow(10, exp);
    };

    const desiredTicks = 6;
    const step = niceNum(max / desiredTicks);
    // ⬇️ round up to the nearest step (prevents 1.2K if 1.0K is your max)
    const suggestedMax = Math.ceil(max / step) * step;
    return { suggestedMax, stepSize: step };
  }

  // ---------- App State ----------
  const state = {
    darkMode: false,
    budget: 2500.0,
    savingsGoal: 500.0,
    expenses: [],
    savings: 0,
    expenseChart: null,
    categoryChart: null,
    currentTimePeriod: "week",
    filteredTransactions: [],
    categoryColors: {
      food: { bg: "rgba(99, 102, 241, 0.8)", color: "#6366f1" },
      transportation: { bg: "rgba(59, 130, 246, 0.8)", color: "#3b82f6" },
      entertainment: { bg: "rgba(139, 92, 246, 0.8)", color: "#8b5cf6" },
      utilities: { bg: "rgba(34, 197, 94, 0.8)", color: "#22c55e" },
      shopping: { bg: "rgba(249, 115, 22, 0.8)", color: "#f97316" },
      health: { bg: "rgba(236, 72, 153, 0.8)", color: "#ec4899" },
      other: { bg: "rgba(234, 179, 8, 0.8)", color: "#eab308" },
    },
  };

  const CATEGORY_NAMES = {
    food: "Food & Dining",
    transportation: "Transportation",
    entertainment: "Entertainment",
    utilities: "Utilities",
    shopping: "Shopping",
    health: "Health",
    other: "Other",
  };

  const getCategoryName = (k) => CATEGORY_NAMES[k] || "Other";

  // ---------- Storage ----------
  const saveToLocalStorage = () => {
    localStorage.setItem(
      "budgetTrackerData",
      JSON.stringify({
        darkMode: state.darkMode,
        budget: state.budget,
        savingsGoal: state.savingsGoal,
        expenses: state.expenses,
        savings: state.savings,
      })
    );
  };

  const loadFromLocalStorage = () => {
    // theme
    const dm = localStorage.getItem("budgetTrackerDarkMode");
    if (dm !== null) state.darkMode = dm === "true";

    document.body.classList.toggle("app--dark", state.darkMode);
    document.body.classList.toggle("dark-mode", state.darkMode);
    document.documentElement.classList.toggle("dark", state.darkMode);
    $("#moon-icon")?.classList.toggle("hidden", state.darkMode);
    $("#sun-icon")?.classList.toggle("hidden", !state.darkMode);

    // data
    const raw = localStorage.getItem("budgetTrackerData");
    if (!raw) return;

    const data = JSON.parse(raw);
    state.budget = data.budget ?? state.budget;
    state.savingsGoal = data.savingsGoal ?? state.savingsGoal;
    state.expenses = Array.isArray(data.expenses) ? data.expenses : [];
    state.savings = data.savings ?? state.savings;

    $("#budget-amount").textContent = formatCurrency(state.budget);
    $("#savings-goal").textContent = formatCurrency(state.savingsGoal);
  };

  // ---------- Date/Top UI ----------
  const updateCurrentDate = () => {
    const now = new Date();
    const options = { year: "numeric", month: "long", day: "numeric" };
    $("#current-date span").textContent = now.toLocaleDateString(
      undefined,
      options
    );
  };

  // ---------- Theme ----------
  const updateChartsTheme = () => {
    const text = state.darkMode ? "#f3f4f6" : "#374151";
    const grid = state.darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";

    if (state.expenseChart) {
      const sc = state.expenseChart.options.scales;
      sc.x.ticks.color = text;
      sc.y.ticks.color = text;
      sc.y.grid.color = grid;
      state.expenseChart.options.plugins.legend.labels.color = text;
      state.expenseChart.update();
    }
    if (state.categoryChart) {
      state.categoryChart.options.plugins.legend.labels.color = text;
      state.categoryChart.update();
    }
  };

  const toggleDarkMode = () => {
    state.darkMode = !state.darkMode;
    document.body.classList.toggle("app--dark", state.darkMode);
    document.body.classList.toggle("dark-mode", state.darkMode);
    document.documentElement.classList.toggle("dark", state.darkMode);
    $("#moon-icon").classList.toggle("hidden", state.darkMode);
    $("#sun-icon").classList.toggle("hidden", !state.darkMode);
    updateChartsTheme();
    localStorage.setItem("budgetTrackerDarkMode", state.darkMode);
  };

  // ---------- Charts ----------
  const initializeCharts = () => {
    const expenseCtx = $("#expenseChart").getContext("2d");
    state.expenseChart = new Chart(expenseCtx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Expenses",
            data: [],
            backgroundColor: "rgba(99,102,241,0.1)",
            borderColor: "rgba(99,102,241,1)",
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            spanGaps: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        elements: { point: { radius: 0, hoverRadius: 4, hitRadius: 6 } },
        plugins: {
          legend: { position: "top" },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                " " +
                new Intl.NumberFormat("en-PH", {
                  style: "currency",
                  currency: "PHP",
                  minimumFractionDigits: 2,
                }).format(ctx.parsed.y ?? 0),
              title: (items) => items[0]?.label ?? "",
            },
          },
        },
        scales: {
          y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
          x: { grid: { display: false } },
        },
      },
    });

    const categoryCtx = $("#categoryChart").getContext("2d");
    state.categoryChart = new Chart(categoryCtx, {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [{ data: [], backgroundColor: [], borderWidth: 0 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: "70%",
      },
    });

    updateCharts();
  };

  const updateCharts = () => {
    updateExpenseChart();
    updateCategoryChart();
  };

  const getExpenseChartData = () => {
    const now = new Date();
    const labels = [];
    let data = [];

    if (state.currentTimePeriod === "week") {
      // Mon..Sun of the current week
      const start = new Date(now);
      const day = (now.getDay() + 6) % 7; // Mon=0..Sun=6
      start.setDate(now.getDate() - day);

      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        labels.push(d.toLocaleDateString(undefined, { weekday: "short" }));

        const total = state.expenses.reduce((sum, exp) => {
          const ed = parseLocalDate(exp.date); // yyyy-mm-dd → local
          return ed.toDateString() === d.toDateString()
            ? sum + exp.amount
            : sum;
        }, 0);
        data.push(total);
      }
    } else if (state.currentTimePeriod === "month") {
      // 4 buckets: days 1–7, 8–14, 15–21, 22–end
      const m = now.getMonth();
      const y = now.getFullYear();
      const daysInMonth = new Date(y, m + 1, 0).getDate();

      for (let w = 1; w <= 4; w++) {
        const from = (w - 1) * 7 + 1;
        const to = Math.min(w * 7, daysInMonth);
        labels.push(`Week ${w}`);

        const total = state.expenses.reduce((sum, exp) => {
          const ed = parseLocalDate(exp.date);
          const dayNum = ed.getDate();
          return ed.getMonth() === m &&
            ed.getFullYear() === y &&
            dayNum >= from &&
            dayNum <= to
            ? sum + exp.amount
            : sum;
        }, 0);
        data.push(total);
      }
    } else {
      // last 12 months
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        const mi = d.getMonth(),
          yr = d.getFullYear();
        labels.push(months[mi]);

        const total = state.expenses.reduce((sum, exp) => {
          const ed = parseLocalDate(exp.date);
          return ed.getMonth() === mi && ed.getFullYear() === yr
            ? sum + exp.amount
            : sum;
        }, 0);
        data.push(total);
      }
    }

    return { labels, data };
  };

  const updateExpenseChart = () => {
    if (!state.expenseChart) return;
    const { labels, data } = getExpenseChartData();
    state.expenseChart.data.labels = labels;
    state.expenseChart.data.datasets[0].data = data;

    const max = Math.max(0, ...data);
    const { suggestedMax, stepSize } = niceScale(max);
    state.expenseChart.options.scales.y = {
      beginAtZero: true,
      suggestedMax,
      ticks: {
        stepSize,
        callback: (v) => {
          if (v >= 1000) {
            const k = v / 1000;
            const text = Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1);
            return `₱${text}K`;
          }
          return `₱${v}`;
        },
      },
      grid: {
        color: state.darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
      },
    };

    state.expenseChart.update();
  };

  const updateCategoryChart = () => {
    if (!state.categoryChart) return;

    if (!state.expenses.length) {
      state.categoryChart.data.labels = [];
      state.categoryChart.data.datasets[0].data = [];
      state.categoryChart.data.datasets[0].backgroundColor = [];
      state.categoryChart.update();
      return;
    }

    const totals = {};
    state.expenses.forEach(
      (e) => (totals[e.category] = (totals[e.category] || 0) + e.amount)
    );

    const labels = [];
    const data = [];
    const colors = [];
    Object.entries(totals).forEach(([cat, amt]) => {
      labels.push(getCategoryName(cat));
      data.push(amt);
      colors.push(
        state.categoryColors[cat]?.bg || state.categoryColors.other.bg
      );
    });

    state.categoryChart.data.labels = labels;
    state.categoryChart.data.datasets[0].data = data;
    state.categoryChart.data.datasets[0].backgroundColor = colors;
    state.categoryChart.update();
  };

  // ---------- UI updates ----------
  const showNotification = (message) => {
    const el = document.createElement("div");
    el.className =
      "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-500 translate-y-20 opacity-0";
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.classList.remove("translate-y-20", "opacity-0"), 100);
    setTimeout(() => {
      el.classList.add("translate-y-20", "opacity-0");
      setTimeout(() => el.remove(), 500);
    }, 3000);
  };

  const updateSummaryCards = () => {
    const total = state.expenses.reduce((s, e) => s + e.amount, 0);
    $("#expenses-amount").textContent = formatCurrency(total);

    const remaining = Math.max(0, state.budget - total);
    $("#remaining-amount").textContent = formatCurrency(remaining);

    const pct =
      state.budget > 0 ? Math.round((remaining / state.budget) * 100) : 0;
    $("#remaining-percentage").textContent = pct;
    const bar = $("#remaining-progress");
    bar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    bar.className =
      (pct < 20
        ? "bg-red-500 "
        : pct < 50
        ? "bg-yellow-500 "
        : "bg-green-500 ") + "h-2.5 rounded-full";

    const saved = Math.min(remaining, state.savingsGoal); // cap at goal
    state.savings = saved; // keep in state/localStorage if you want
    const sPct =
      state.savingsGoal > 0 ? Math.round((saved / state.savingsGoal) * 100) : 0;
    $("#savings-percentage").textContent = sPct;
    $("#savings-progress").style.width = `${Math.max(0, Math.min(100, sPct))}%`;
  };

  const updateTransactionsList = () => {
    const container = $("#transactions-container");
    if (!state.expenses.length) {
      container.innerHTML = `
        <div class="flex items-center justify-center p-8 text-gray-500">
          <p>No transactions yet. Add your first expense!</p>
        </div>`;
      return;
    }

    container.innerHTML = "";
    state.expenses.slice(0, 5).forEach((exp) => {
      const color =
        state.categoryColors[exp.category] || state.categoryColors.other;
      const expenseDate = parseLocalDate(exp.date).toLocaleDateString(
        undefined,
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      );

      const row = document.createElement("div");
      row.className =
        "transaction-row flex items-center justify-between p-3 rounded-lg transition hover:bg-gray-50 dark:hover:bg-gray-700";

      row.innerHTML = `
        <div class="flex items-center">
          <div class="p-2 rounded-lg mr-4" style="background-color: ${color.bg.replace(
            "0.8",
            "0.2"
          )}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="${
              color.color
            }">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p class="font-medium">${exp.description}</p>
            <p class="text-sm text-gray-500">${expenseDate}</p>
          </div>
        </div>
        <p class="font-semibold text-red-500">-${formatCurrency(
          exp.amount
        )}</p>`;
      container.appendChild(row);
    });
  };

  const updateCategoryBreakdown = () => {
    const container = $("#category-breakdown");
    if (!state.expenses.length) {
      container.innerHTML = `
        <div class="flex items-center justify-center p-4 text-gray-500">
          <p>No expenses yet to show categories</p>
        </div>`;
      return;
    }

    const totals = {};
    state.expenses.forEach(
      (e) => (totals[e.category] = (totals[e.category] || 0) + e.amount)
    );
    container.innerHTML = "";

    Object.entries(totals).forEach(([cat, amt]) => {
      const color = state.categoryColors[cat] || state.categoryColors.other;
      const item = document.createElement("div");
      item.className = "flex items-center justify-between";
      item.innerHTML = `
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${
            color.color
          }"></div>
          <span class="text-sm">${getCategoryName(cat)}</span>
        </div>
        <span class="text-sm font-medium">${formatCurrency(amt)}</span>`;
      container.appendChild(item);
    });
  };

  const updateUI = () => {
    updateSummaryCards();
    updateTransactionsList();
    updateCategoryBreakdown();
    updateCharts();
  };

  // ---------- Modals / Forms ----------
  const openBudgetModal = () => {
    $("#budget-input").value = state.budget;
    $("#budget-modal").classList.remove("hidden");
  };
  const closeBudgetModal = () => $("#budget-modal").classList.add("hidden");

  const openSavingsModal = () => {
    $("#savings-input").value = state.savingsGoal;
    $("#savings-modal").classList.remove("hidden");
  };
  const closeSavingsModal = () => $("#savings-modal").classList.add("hidden");

  const updateBudget = (e) => {
    e.preventDefault();
    const v = parseFloat($("#budget-input").value);
    if (Number.isFinite(v)) {
      state.budget = v;
      $("#budget-amount").textContent = formatCurrency(v);
      updateUI();
      saveToLocalStorage();
      closeBudgetModal();
      showNotification("Budget updated successfully!");
    }
  };

  const updateSavingsGoal = (e) => {
    e.preventDefault();
    const v = parseFloat($("#savings-input").value);
    if (Number.isFinite(v)) {
      state.savingsGoal = v;
      $("#savings-goal").textContent = formatCurrency(v);
      updateUI();
      saveToLocalStorage();
      closeSavingsModal();
      showNotification("Savings goal updated successfully!");
    }
  };

  const openAllTransactionsModal = () => {
    $("#transaction-search").value = "";
    state.filteredTransactions = [...state.expenses];
    updateAllTransactionsTable();
    $("#all-transactions-modal").classList.remove("hidden");
  };
  const closeAllTransactionsModal = () =>
    $("#all-transactions-modal").classList.add("hidden");

  const updateAllTransactionsTable = () => {
    const body = $("#all-transactions-body");
    const empty = $("#no-transactions-message");
    body.innerHTML = "";

    if (!state.filteredTransactions.length) {
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");

    state.filteredTransactions.forEach((exp) => {
      const color =
        state.categoryColors[exp.category] || state.categoryColors.other;
      const expenseDate = parseLocalDate(exp.date).toLocaleDateString(
        undefined,
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      );

      const tr = document.createElement("tr");
      tr.className = "transaction-row";
      tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm">${expenseDate}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${
          exp.description
        }</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 py-1 text-xs font-medium rounded-full"
                style="background-color:${color.bg.replace(
                  "0.8",
                  "0.2"
                )}; color:${color.color}">
            ${getCategoryName(exp.category)}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-500">-${formatCurrency(
          exp.amount
        )}</td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="action-button text-indigo-600 hover:text-indigo-900 mr-3" onclick="editTransaction(${
            exp.id
          })" aria-label="Edit"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
          <button class="action-button text-red-600 hover:text-red-900" onclick="confirmDeleteTransaction(${
            exp.id
          })" aria-label="Delete"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
        </td>`;
      body.appendChild(tr);
    });
  };

  const searchTransactions = (e) => {
    const q = e.target.value.toLowerCase();
    state.filteredTransactions = q
      ? state.expenses.filter(
          (exp) =>
            exp.description.toLowerCase().includes(q) ||
            getCategoryName(exp.category).toLowerCase().includes(q) ||
            exp.date.includes(q) ||
            String(exp.amount).includes(q)
        )
      : [...state.expenses];
    updateAllTransactionsTable();
  };

  // Edit/Delete exposed for onclick handlers
  window.editTransaction = (id) => {
    const exp = state.expenses.find((x) => x.id === id);
    if (!exp) return;
    $("#edit-transaction-id").value = exp.id;
    $("#edit-description").value = exp.description;
    $("#edit-amount").value = exp.amount;
    $("#edit-category").value = exp.category;
    $("#edit-date").value = exp.date;
    $("#edit-transaction-modal").classList.remove("hidden");
  };

  window.confirmDeleteTransaction = (id) => {
    $("#delete-transaction-id").value = id;
    $("#delete-confirmation-modal").classList.remove("hidden");
  };

  const saveEditedTransaction = (e) => {
    e.preventDefault();
    const id = parseInt($("#edit-transaction-id").value, 10);
    const idx = state.expenses.findIndex((x) => x.id === id);
    if (idx === -1) return;

    const description = $("#edit-description").value;
    const amount = parseFloat($("#edit-amount").value);
    const category = $("#edit-category").value;
    const date = $("#edit-date").value;

    state.expenses[idx] = {
      ...state.expenses[idx],
      description,
      amount,
      category,
      date,
      timestamp: parseLocalDate(date).getTime(),
    };

    state.expenses.sort((a, b) => b.timestamp - a.timestamp);
    state.filteredTransactions = [...state.expenses];
    updateUI();
    updateAllTransactionsTable();
    saveToLocalStorage();
    showNotification("Transaction updated successfully!");
    closeEditTransactionModal();
  };

  const deleteTransaction = () => {
    const id = parseInt($("#delete-transaction-id").value, 10);
    state.expenses = state.expenses.filter((x) => x.id !== id);
    state.filteredTransactions = [...state.expenses];
    updateUI();
    updateAllTransactionsTable();
    saveToLocalStorage();
    showNotification("Transaction deleted successfully!");
    closeDeleteConfirmationModal();
  };

  const closeEditTransactionModal = () =>
    $("#edit-transaction-modal").classList.add("hidden");
  const closeDeleteConfirmationModal = () =>
    $("#delete-confirmation-modal").classList.add("hidden");

  const handleAddExpense = (e) => {
    e.preventDefault();
    const description = $("#expense-description").value.trim();
    const amount = parseFloat($("#expense-amount").value);
    const category = $("#expense-category").value;
    const date = $("#expense-date").value;

    if (!description || !Number.isFinite(amount) || !category || !date) {
      alert("Please fill out all fields before adding an expense.");
      return;
    }

    state.expenses.push({
      id: Date.now(),
      description,
      amount,
      category,
      date,
      timestamp: parseLocalDate(date).getTime(),
    });

    state.expenses.sort((a, b) => b.timestamp - a.timestamp);
    updateUI();
    saveToLocalStorage();
    $("#expense-form").reset();
    $("#expense-date").valueAsDate = new Date();
    showNotification("Expense added successfully!");
  };

  const changeTimePeriod = (period) => {
    state.currentTimePeriod = period;
    $$(".time-period-btn").forEach((btn) => {
      const isActive = btn.getAttribute("data-period") === period;
      btn.className =
        "time-period-btn px-3 py-1 text-sm rounded-md " +
        (isActive
          ? "bg-indigo-100 text-indigo-600 font-medium"
          : "bg-gray-100 text-gray-600 font-medium");
    });
    updateExpenseChart();
  };

  // ---------- Wire up ----------
  loadFromLocalStorage();
  updateCurrentDate();
  $("#current-year").textContent = new Date().getFullYear();
  $("#expense-date").valueAsDate = new Date();
  initializeCharts();
  updateUI();

  // Events
  $("#theme-toggle").addEventListener("click", toggleDarkMode);
  $("#expense-form").addEventListener("submit", handleAddExpense);

  $("#edit-budget-icon").addEventListener("click", openBudgetModal);
  $("#budget-form").addEventListener("submit", updateBudget);
  $("#budget-cancel").addEventListener("click", closeBudgetModal);

  $("#edit-savings-icon").addEventListener("click", openSavingsModal);
  $("#savings-form").addEventListener("submit", updateSavingsGoal);
  $("#savings-cancel").addEventListener("click", closeSavingsModal);

  $("#view-all-transactions").addEventListener(
    "click",
    openAllTransactionsModal
  );
  $("#close-transactions").addEventListener("click", closeAllTransactionsModal);

  $("#edit-transaction-form").addEventListener("submit", saveEditedTransaction);
  $("#edit-transaction-cancel").addEventListener(
    "click",
    closeEditTransactionModal
  );

  $("#delete-confirm").addEventListener("click", deleteTransaction);
  $("#delete-cancel").addEventListener("click", closeDeleteConfirmationModal);

  $("#transaction-search").addEventListener("input", searchTransactions);

  $$(".time-period-btn").forEach((btn) =>
    btn.addEventListener("click", () =>
      changeTimePeriod(btn.getAttribute("data-period"))
    )
  );
});
