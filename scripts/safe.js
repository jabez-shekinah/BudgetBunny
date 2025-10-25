/**
 *
 * Centralized "safe update" helpers.
 * The goal: protect the app from crashing if rendering or charts throw.
 * This directly addresses:
 *  - broader error handling (render/chart)
 *  - resilience against unexpected data
 *
 * We wrap high-risk UI functions in try/catch and surface:
 *  1. console.error for devs
 *  2. a non-blocking toast for users
 */

import { renderApp, showNotification } from "./ui.js";
import { updateCharts } from "./charts.js";

/**
 * Run any function safely.
 * Logs the error for debugging and shows a friendly toast to the user.
 *
 * @param {Function} fn - function to execute
 * @param {string} devContext - short label for console debugging
 * @param {string} userMessage - message shown to the user if it fails
 */
function runSafely(fn, devContext, userMessage) {
  try {
    fn();
  } catch (err) {
    console.error(`[SAFE ERROR] ${devContext}:`, err);
    showNotification(userMessage);
  }
}

/**
 * Safely re-render main UI sections (cards, recent txns, etc.)
 * AND safely refresh charts.
 *
 * Use this instead of calling renderApp() + updateCharts() directly
 * in places where bad data could explode the UI (editing, deleting, importing).
 */
export function safeRenderAndCharts() {
  runSafely(
    renderApp,
    "renderApp failed",
    "⚠️ Some info did not render. Please review recent changes."
  );

  runSafely(
    updateCharts,
    "updateCharts failed",
    "⚠️ Charts could not update. Data view may be stale."
  );
}
