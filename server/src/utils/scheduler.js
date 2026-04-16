/**
 * scheduler.js
 *
 * A lightweight zero-dependency cron-like scheduler that auto-updates
 * pre-order statuses when their scheduled time arrives.
 *
 * Runs every minute after the DB connects.
 *
 * Status transition rules:
 *   pending      → preparing  (when scheduledTime - prepBufferMs ≤ now)
 *   preparing    → out_for_delivery  (when scheduledTime ≤ now)
 *   (completed/cancelled are terminal — never touched by scheduler)
 *
 * prepBufferMs: Kitchen gets a heads-up `prepBuffer` minutes before
 * the scheduled slot so the order is ready on time.
 */

import Order from "../models/Order.model.js";

const TICK_INTERVAL_MS = 60 * 1000;   // run every 60 s
const PREP_BUFFER_MINUTES = 20;        // start preparing 20 min before slot

let _timer = null;

async function tick() {
  const now        = new Date();
  const prepCutoff = new Date(now.getTime() + PREP_BUFFER_MINUTES * 60 * 1000);

  // ── pending → preparing  (slot is within PREP_BUFFER_MINUTES)
  await Order.updateMany(
    {
      orderType: "pre-order",
      status: "pending",
      scheduledTime: { $lte: prepCutoff },
    },
    { $set: { status: "preparing" } }
  );

  // ── preparing → out_for_delivery  (slot time has arrived)
  await Order.updateMany(
    {
      orderType: "pre-order",
      status: "preparing",
      scheduledTime: { $lte: now },
    },
    { $set: { status: "out_for_delivery" } }
  );
}

export function startScheduler() {
  if (_timer) return; // already running
  console.log("[Scheduler] Pre-order status scheduler started.");
  // Run once immediately on boot, then every TICK_INTERVAL_MS
  tick().catch((err) => console.error("[Scheduler] tick error:", err));
  _timer = setInterval(() => {
    tick().catch((err) => console.error("[Scheduler] tick error:", err));
  }, TICK_INTERVAL_MS);
}

export function stopScheduler() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
}
