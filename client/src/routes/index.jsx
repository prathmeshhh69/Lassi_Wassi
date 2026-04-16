/**
 * Centralized route constants for Lassi Wassi.
 * Usage: import { ROUTES } from "../routes/index.jsx";
 */
export const ROUTES = {
  // ── Public / Customer ───────────────────────────────────────
  home:           "/",
  menu:           "/menu",
  menuItem:       (itemId) => `/menu/${itemId}`,
  restaurant:     (id) => `/restaurant/${id}`,
  cart:           "/cart",
  checkout:       "/checkout",
  about:          "/about",
  contact:        "/contact",

  // ── Pre-order & Booking ──────────────────────────────────────
  preorder:       (restaurantId) => `/pre-order/${restaurantId}`,
  booking:        (restaurantId) => `/booking/${restaurantId}`,

  // ── Auth ────────────────────────────────────────────────────
  login:          "/login",
  signup:         "/signup",
  ownerLogin:     "/owner/login",

  // ── Protected customer ──────────────────────────────────────
  orders:         "/orders",
  orderTracking:  (orderId) => `/orders/${orderId}/track`,
  myBookings:     "/bookings/me",
  profile:        "/profile",

  // ── Owner (protected) ───────────────────────────────────────
  owner: {
    base:       "/owner",
    dashboard:  "/owner/dashboard",
    orders:     "/owner/orders",
    menu:       "/owner/menu",
    bookings:   "/owner/bookings",
    analytics:  "/owner/analytics",
  },

  // ── 404 ─────────────────────────────────────────────────────
  notFound: "*",
};

export default ROUTES;
