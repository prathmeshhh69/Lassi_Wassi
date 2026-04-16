import api from "./api.js";

// ── Pre-orders ────────────────────────────────────────────────────────────────
export const getPreOrderSlots  = (restaurantId, date) =>
  api.get(`/api/preorders/slots/${restaurantId}`, { params: { date } });

export const createPreOrder    = (payload) => api.post("/api/preorders", payload);
export const getMyPreOrders    = (params = {}) => api.get("/api/preorders/me", { params });
export const cancelPreOrder    = (orderId) => api.patch(`/api/preorders/${orderId}/cancel`);

// ── Table bookings ────────────────────────────────────────────────────────────
export const getBookingSlots   = (restaurantId, date) =>
  api.get(`/api/bookings/slots/${restaurantId}`, { params: { date } });

export const createBooking     = (payload) => api.post("/api/bookings", payload);
export const getMyBookings     = (params = {}) => api.get("/api/bookings/me", { params });
export const cancelMyBooking   = (bookingId) => api.patch(`/api/bookings/${bookingId}/cancel`);
