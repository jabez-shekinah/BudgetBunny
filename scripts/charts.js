/* eslint-env browser */

// charts.js
//
// Chart initialization and updates:
// - Line chart (spending over time)
// - Doughnut chart (spending by category)
// - Theme sync (light/dark)
// - Time period switching (week / month / year)
//
// We wrap chart updates in try/catch where appropriate so a Chart.js error
// doesn't crash the rest of the UI. Charts are "nice-to-have", not core state.

import { state, parseLocalDate, niceScale } from "./state.js";

/* ------------------------------------------------------------------
   Private helpers
------------------------------------------------------------------- */

/**
 * _getExpenseChartData()
 *
 * Build {labels, data} for the expense line chart depending on
 * state.currentTimePeriod:
 * - "week": Mon..Sun of current week
 * - "month": 4 buckets (1–7, 8–14, etc.)
 * - "year": last 12 months
 */
function _getExpenseChartData() {
  const now = new Date();
  const labels = [];
  const data = [];

  if (state.currentTimePeriod === "week") {
    // Monday-start week
    const start = new Date(now);
    const dayIndex = (now.getDay() + 6) % 7; // Mon=0..Sun=6
    start.setDate(now.getDate() - dayIndex);

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      labels.push(
        d.toLocaleDateString(undefined, {
          weekday: "short",
        })
      );

      const totalForDay = state.expenses.reduce((sum, exp) => {
        const ed = parseLocalDate(exp.date);
        return ed.toDateString() === d.toDateString() ? sum + exp.amount : sum;
      }, 0);

      data.push(totalForDay);
    }
  } else if (state.currentTimePeriod === "month") {
    // 4 buckets in the current month
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let bucket = 1; bucket <= 4; bucket++) {
      const fromDay = (bucket - 1) * 7 + 1;
      const toDay = Math.min(bucket * 7, daysInMonth);

      labels.push(`Week ${bucket}`);

      const totalForBucket = state.expenses.reduce((sum, exp) => {
        const ed = parseLocalDate(exp.date);
        const dayNum = ed.getDate();
        const isSameMonth =
          ed.getMonth() === currentMonth && ed.getFullYear() === currentYear;
        const inRange = dayNum >= fromDay && dayNum <= toDay;
        return isSameMonth && inRange ? sum + exp.amount : sum;
      }, 0);

      data.push(totalForBucket);
    }
  } else {
    // default: "year" (last 12 months including current)
    const monthNames = [
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

    for (let offset = 11; offset >= 0; offset--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - offset);

      const monthIdx = d.getMonth();
      const yr = d.getFullYear();

      labels.push(monthNames[monthIdx]);

      const totalForMonth = state.expenses.reduce((sum, exp) => {
        const ed = parseLocalDate(exp.date);
        return ed.getMonth() === monthIdx && ed.getFullYear() === yr
          ? sum + exp.amount
          : sum;
      }, 0);

      data.push(totalForMonth);
    }
  }

  return { labels, data };
}

/* ------------------------------------------------------------------
   Public: init + update charts
------------------------------------------------------------------- */

/**
 * initializeCharts()
 *
 * Creates both charts (line + doughnut) and triggers first render.
 * Must be called once after DOMContentLoaded.
 */
export function initializeCharts() {
  try {
    const expenseCtx = document.getElementById("expenseChart").getContext("2d");

    state.expenseChart = new Chart(expenseCtx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Expenses",
            data: [],
            backgroundColor: "rgba(99,102,241,0.1)", // indigo-500 alpha
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
        elements: {
          point: { radius: 0, hoverRadius: 4, hitRadius: 6 },
        },
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
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,0.05)" },
          },
          x: { grid: { display: false } },
        },
      },
    });

    const categoryCtx = document
      .getElementById("categoryChart")
      .getContext("2d");

    state.categoryChart = new Chart(categoryCtx, {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        cutout: "70%",
      },
    });

    updateCharts();
  } catch (err) {
    console.error("initializeCharts failed:", err);
    // We do not showNotification here: app can still run fine w/out charts.
  }
}

/**
 * updateExpenseChart()
 *
 * Updates the line chart data + axes scaling.
 * Safe to call repeatedly.
 */
export function updateExpenseChart() {
  if (!state.expenseChart) return;

  try {
    const { labels, data } = _getExpenseChartData();
    state.expenseChart.data.labels = labels;
    state.expenseChart.data.datasets[0].data = data;

    // auto-scale y axis nicely
    const max = Math.max(0, ...data);
    const { suggestedMax, stepSize } = niceScale(max);

    state.expenseChart.options.scales.y = {
      beginAtZero: true,
      suggestedMax,
      ticks: {
        stepSize,
        callback: (v) => {
          // turn 1200 -> ₱1.2K
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
  } catch (err) {
    console.error("updateExpenseChart failed:", err);
    // Silent fail is OK; we already have safeRenderAndCharts elsewhere
  }
}

/**
 * updateCategoryChart()
 *
 * Sums totals per category and renders the doughnut chart.
 */
export function updateCategoryChart() {
  if (!state.categoryChart) return;

  try {
    if (!state.expenses.length) {
      // clear chart if no data
      state.categoryChart.data.labels = [];
      state.categoryChart.data.datasets[0].data = [];
      state.categoryChart.data.datasets[0].backgroundColor = [];
      state.categoryChart.update();
      return;
    }

    const totals = {};
    state.expenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    const labels = [];
    const data = [];
    const colors = [];

    Object.entries(totals).forEach(([cat, amt]) => {
      labels.push(cat);
      data.push(amt);
      colors.push(
        state.categoryColors[cat]?.bg || state.categoryColors.other.bg
      );
    });

    state.categoryChart.data.labels = labels;
    state.categoryChart.data.datasets[0].data = data;
    state.categoryChart.data.datasets[0].backgroundColor = colors;
    state.categoryChart.update();
  } catch (err) {
    console.error("updateCategoryChart failed:", err);
  }
}

/**
 * updateCharts()
 *
 * Convenience to refresh both charts.
 * This is called after state changes.
 */
export function updateCharts() {
  updateExpenseChart();
  updateCategoryChart();
}

/* ------------------------------------------------------------------
   Time period selector
------------------------------------------------------------------- */

/**
 * changeTimePeriod(period)
 *
 * Sets the line chart range (week/month/year),
 * toggles active button styles, and re-renders the line chart.
 */
export function changeTimePeriod(period) {
  state.currentTimePeriod = period;

  document.querySelectorAll(".time-period-btn").forEach((btn) => {
    const isActive = btn.getAttribute("data-period") === period;
    btn.className =
      "time-period-btn px-3 py-1 text-sm rounded-md " +
      (isActive
        ? "bg-indigo-100 text-indigo-600 font-medium"
        : "bg-gray-100 text-gray-600 font-medium");
  });

  updateExpenseChart();
}

/* ------------------------------------------------------------------
   Theme sync
------------------------------------------------------------------- */

/**
 * refreshChartsTheme()
 *
 * Updates tick, grid, and legend label color when dark mode changes.
 * Call after toggling theme.
 */
export function refreshChartsTheme() {
  const textColor = state.darkMode ? "#f3f4f6" : "#374151";
  const gridColor = state.darkMode
    ? "rgba(255,255,255,0.1)"
    : "rgba(0,0,0,0.05)";

  // Line chart
  if (state.expenseChart) {
    try {
      const sc = state.expenseChart.options.scales;
      sc.x.ticks.color = textColor;
      sc.y.ticks.color = textColor;
      sc.y.grid.color = gridColor;

      state.expenseChart.options.plugins.legend.labels.color = textColor;
      state.expenseChart.update();
    } catch (err) {
      console.error("refreshChartsTheme (expenseChart) failed:", err);
    }
  }

  // Doughnut chart
  if (state.categoryChart) {
    try {
      state.categoryChart.options.plugins.legend =
        state.categoryChart.options.plugins.legend || {};
      if (state.categoryChart.options.plugins.legend.labels) {
        state.categoryChart.options.plugins.legend.labels.color = textColor;
      }
      state.categoryChart.update();
    } catch (err) {
      console.error("refreshChartsTheme (categoryChart) failed:", err);
    }
  }
}
