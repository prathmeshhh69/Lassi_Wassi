import Order from "../models/Order.model.js";
import Booking from "../models/Booking.model.js";
import Restaurant from "../models/Restaurant.model.js";
import mongoose from "mongoose";

/* ─── shared helpers ────────────────────────────────────────────────────────── */

const assertOwner = async (userId, restaurantId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return { ok: false, status: 404, message: "Restaurant not found" };
  if (restaurant.owner.toString() !== userId.toString())
    return { ok: false, status: 403, message: "Forbidden: you do not own this restaurant" };
  return { ok: true, restaurant };
};

/* ─── date helpers ─────────────────────────────────────────────────────────── */

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOf = (unit) => {
  const d = new Date();
  if (unit === "month") { d.setDate(1); d.setHours(0, 0, 0, 0); }
  if (unit === "week")  { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); }
  return d;
};

/**
 * GET /api/owner/restaurants/:restaurantId/analytics
 *
 * Full aggregated analytics snapshot:
 *   KPIs: totalRevenue, revenueThisMonth, revenueLastMonth, totalOrders,
 *         avgOrderValue, conversionRate, totalBookings
 *   Charts: dailyRevenue (last 30d), weeklyRevenue (last 8w), peakHours (24h),
 *           mostOrderedItems (top 8), ordersByStatus (all statuses)
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const check = await assertOwner(req.user._id, restaurantId);
    if (!check.ok)
      return res.status(check.status).json({ success: false, message: check.message });

    const rid = new mongoose.Types.ObjectId(restaurantId);

    const now        = new Date();
    const d30ago     = daysAgo(30);
    const d60ago     = daysAgo(60);
    const d7ago      = daysAgo(7);
    const somStart   = startOf("month");
    const prevMStart = new Date(somStart); prevMStart.setMonth(prevMStart.getMonth() - 1);
    const prevMEnd   = new Date(somStart);

    const [
      allTimeRevenue,
      totalOrders,
      cancelledOrders,
      completedOrders,
      revThisMonth,
      revLastMonth,
      avgOrderValue,
      dailyRevenue,
      weeklyRevenue,
      mostOrderedItems,
      ordersByStatus,
      peakHours,
      bookingCount,
      ordersThisWeek,
      ordersPrevWeek,
    ] = await Promise.all([

      /* 1. All-time revenue (completed) */
      Order.aggregate([
        { $match: { restaurant: rid, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),

      /* 2. Total non-cancelled */
      Order.countDocuments({ restaurant: rid, status: { $ne: "cancelled" } }),

      /* 3. Total cancelled */
      Order.countDocuments({ restaurant: rid, status: "cancelled" }),

      /* 4. Total completed */
      Order.countDocuments({ restaurant: rid, status: "completed" }),

      /* 5. Revenue this calendar month */
      Order.aggregate([
        { $match: { restaurant: rid, status: "completed", createdAt: { $gte: somStart } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),

      /* 6. Revenue last calendar month */
      Order.aggregate([
        { $match: { restaurant: rid, status: "completed", createdAt: { $gte: prevMStart, $lt: prevMEnd } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),

      /* 7. Average order value (completed) */
      Order.aggregate([
        { $match: { restaurant: rid, status: "completed" } },
        { $group: { _id: null, avg: { $avg: "$totalAmount" } } }
      ]),

      /* 8. Daily revenue — last 30 days (all non-cancelled) */
      Order.aggregate([
        { $match: { restaurant: rid, createdAt: { $gte: d30ago }, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          }
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", orders: 1, revenue: 1 } }
      ]),

      /* 9. Weekly revenue — last 8 weeks, grouped by ISO week start (Monday) */
      Order.aggregate([
        { $match: { restaurant: rid, createdAt: { $gte: daysAgo(56) }, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: {
                  $dateSubtract: {
                    startDate: "$createdAt",
                    unit: "day",
                    amount: { $subtract: [{ $dayOfWeek: "$createdAt" }, 2] }
                  }
                }
              }
            },
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" }
          }
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, weekStart: "$_id", orders: 1, revenue: 1 } }
      ]),

      /* 10. Most ordered items — top 8 by qty */
      Order.aggregate([
        { $match: { restaurant: rid, status: { $ne: "cancelled" } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.menuItem",
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: "menuitems",
            localField: "_id",
            foreignField: "_id",
            as: "item"
          }
        },
        { $unwind: { path: "$item", preserveNullAndEmpty: true } },
        {
          $project: {
            _id: 1,
            name: { $ifNull: ["$item.name", "Deleted item"] },
            category: { $ifNull: ["$item.category", "—"] },
            totalQuantity: 1,
            totalRevenue: 1
          }
        }
      ]),

      /* 11. Orders by status */
      Order.aggregate([
        { $match: { restaurant: rid } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } }
      ]),

      /* 12. Peak hours — order count by hour-of-day (UTC, last 30d) */
      Order.aggregate([
        { $match: { restaurant: rid, createdAt: { $gte: d30ago }, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: { $hour: "$createdAt" },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, hour: "$_id", count: 1 } }
      ]),

      /* 13. Confirmed + completed bookings */
      Booking.countDocuments({ restaurant: rid, status: { $in: ["confirmed", "completed"] } }),

      /* 14. Orders this week */
      Order.countDocuments({ restaurant: rid, createdAt: { $gte: d7ago }, status: { $ne: "cancelled" } }),

      /* 15. Orders prev week */
      Order.countDocuments({ restaurant: rid, createdAt: { $gte: daysAgo(14), $lt: d7ago }, status: { $ne: "cancelled" } }),
    ]);

    /* ── derived KPIs ── */
    const totalAllOrders     = totalOrders + cancelledOrders;
    const conversionRate     = totalAllOrders > 0
      ? +((completedOrders / totalAllOrders) * 100).toFixed(1)
      : 0;

    const revenueThisMonth   = revThisMonth[0]?.total  ?? 0;
    const revenueLastMonth   = revLastMonth[0]?.total  ?? 0;
    const revenueTotal       = allTimeRevenue[0]?.total ?? 0;
    const avgOrderVal        = +(avgOrderValue[0]?.avg  ?? 0).toFixed(2);

    const revenueGrowth      = revenueLastMonth > 0
      ? +(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100).toFixed(1)
      : null;

    const ordersGrowth       = ordersPrevWeek > 0
      ? +(((ordersThisWeek - ordersPrevWeek) / ordersPrevWeek) * 100).toFixed(1)
      : null;

    /* ── shape ordersByStatus into map ── */
    const statusMap = {};
    ordersByStatus.forEach(({ status, count }) => { statusMap[status] = count; });

    return res.status(200).json({
      success: true,
      data: {
        /* KPI summary */
        kpi: {
          totalRevenue:      revenueTotal,
          revenueThisMonth,
          revenueLastMonth,
          revenueGrowth,      // % change vs last month (null if no prev data)
          totalOrders,
          ordersThisWeek,
          ordersPrevWeek,
          ordersGrowth,
          avgOrderValue:     avgOrderVal,
          conversionRate,
          totalBookings:     bookingCount,
        },

        /* Chart series */
        charts: {
          dailyRevenue,       // [{ date, orders, revenue }] last 30 days
          weeklyRevenue,      // [{ weekStart, orders, revenue }] last 8 weeks
          mostOrderedItems,   // [{ name, category, totalQuantity, totalRevenue }]
          ordersByStatus:    statusMap,
          peakHours,          // [{ hour, count }]
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/owner/restaurants/:restaurantId/analytics/daily?days=30
 * Lightweight endpoint for on-demand date range refresh.
 */
export const getDailyRevenue = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const check = await assertOwner(req.user._id, restaurantId);
    if (!check.ok)
      return res.status(check.status).json({ success: false, message: check.message });

    const days = Math.min(Math.max(parseInt(req.query.days ?? 30, 10), 1), 90);
    const rid  = new mongoose.Types.ObjectId(restaurantId);

    const data = await Order.aggregate([
      { $match: { restaurant: rid, createdAt: { $gte: daysAgo(days) }, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", orders: 1, revenue: 1 } }
    ]);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/owner/restaurants/:restaurantId/analytics/weekly?weeks=8
 */
export const getWeeklyRevenue = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const check = await assertOwner(req.user._id, restaurantId);
    if (!check.ok)
      return res.status(check.status).json({ success: false, message: check.message });

    const weeks = Math.min(Math.max(parseInt(req.query.weeks ?? 8, 10), 1), 26);
    const rid   = new mongoose.Types.ObjectId(restaurantId);

    const data = await Order.aggregate([
      { $match: { restaurant: rid, createdAt: { $gte: daysAgo(weeks * 7) }, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $dateSubtract: {
                  startDate: "$createdAt",
                  unit: "day",
                  amount: { $subtract: [{ $dayOfWeek: "$createdAt" }, 2] }
                }
              }
            }
          },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, weekStart: "$_id", orders: 1, revenue: 1 } }
    ]);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/owner/restaurants/:restaurantId/analytics/conversion
 * Returns order funnel breakdown + conversion rate.
 */
export const getConversionRate = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const check = await assertOwner(req.user._id, restaurantId);
    if (!check.ok)
      return res.status(check.status).json({ success: false, message: check.message });

    const rid = new mongoose.Types.ObjectId(restaurantId);

    const statusCounts = await Order.aggregate([
      { $match: { restaurant: rid } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } }
    ]);

    const map = {};
    statusCounts.forEach(({ status, count }) => { map[status] = count; });

    const total     = Object.values(map).reduce((s, c) => s + c, 0);
    const completed = map.completed ?? 0;
    const cancelled = map.cancelled ?? 0;

    return res.status(200).json({
      success: true,
      data: {
        statusCounts: map,
        total,
        completed,
        cancelled,
        conversionRate: total > 0 ? +((completed / total) * 100).toFixed(1) : 0,
        cancellationRate: total > 0 ? +((cancelled / total) * 100).toFixed(1) : 0,
      }
    });
  } catch (err) {
    return next(err);
  }
};
