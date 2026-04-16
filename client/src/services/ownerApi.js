/**
 * Owner Dashboard API service
 * All calls are pre-authenticated via the shared axios instance's request interceptor.
 */
import api from "./api";

// ── Restaurant ────────────────────────────────────────────────────────────────
export const fetchMyRestaurant = () =>
  api.get("/api/restaurants").then(({ data }) => {
    // Return the restaurant owned by the logged-in user
    // The user ID comparison is done on the frontend via the token subject
    return data.data;
  });

// Better: fetch by owner ID via query param (server already supports search)
export const fetchOwnerRestaurant = (ownerId) =>
  api.get(`/api/restaurants`).then(({ data }) => {
    const restaurants = data.data ?? [];
    return restaurants.find((r) => r.owner === ownerId || r.owner?._id === ownerId) ?? null;
  });

// ── Orders ────────────────────────────────────────────────────────────────────
export const fetchOrders = (restaurantId, params = {}) =>
  api.get(`/api/owner/restaurants/${restaurantId}/orders`, { params });

export const fetchOrderById = (restaurantId, orderId) =>
  api.get(`/api/owner/restaurants/${restaurantId}/orders/${orderId}`);

export const updateOrderStatus = (orderId, status) =>
  api.patch(`/api/owner/orders/${orderId}/status`, { status });

// ── Menu Items ────────────────────────────────────────────────────────────────
export const fetchMenu = (restaurantId) =>
  api.get(`/api/owner/restaurants/${restaurantId}/menu`);

export const createMenuItem = (data) =>
  api.post("/api/owner/menu", data);

export const updateMenuItem = (id, data) =>
  api.put(`/api/owner/menu/${id}`, data);

export const deleteMenuItem = (id) =>
  api.delete(`/api/owner/menu/${id}`);

// ── Bookings ──────────────────────────────────────────────────────────────────
export const fetchBookings = (restaurantId, params = {}) =>
  api.get(`/api/owner/restaurants/${restaurantId}/bookings`, { params });

export const createBooking = (restaurantId, data) =>
  api.post(`/api/owner/restaurants/${restaurantId}/bookings`, data);

export const updateBooking = (bookingId, data) =>
  api.put(`/api/owner/bookings/${bookingId}`, data);

export const updateBookingStatus = (bookingId, status) =>
  api.patch(`/api/owner/bookings/${bookingId}/status`, { status });

export const deleteBooking = (bookingId) =>
  api.delete(`/api/owner/bookings/${bookingId}`);

// ── Analytics ─────────────────────────────────────────────────────────────────
export const fetchAnalytics       = (restaurantId) =>
  api.get(`/api/owner/restaurants/${restaurantId}/analytics`);

export const fetchDailyRevenue    = (restaurantId, days = 30) =>
  api.get(`/api/owner/restaurants/${restaurantId}/analytics/daily`, { params: { days } });

export const fetchWeeklyRevenue   = (restaurantId, weeks = 8) =>
  api.get(`/api/owner/restaurants/${restaurantId}/analytics/weekly`, { params: { weeks } });

export const fetchConversionRate  = (restaurantId) =>
  api.get(`/api/owner/restaurants/${restaurantId}/analytics/conversion`);
