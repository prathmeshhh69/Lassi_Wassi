import api from "./api.js";

// ─── Orders ───────────────────────────────────────────────────────────────────

/** Place a new order.
 * @param {{ restaurantId: string, items: {menuItemId, quantity}[], deliveryAddress: object }} payload
 */
export const placeOrder = (payload) => api.post("/api/orders", payload);

/** Get the logged-in user's order history. */
export const getMyOrders = (params = {}) => api.get("/api/orders/me", { params });

/** Get a single order by ID (only the owner can see it). */
export const getOrderById = (orderId) => api.get(`/api/orders/${orderId}`);

/** Cancel a pending order. */
export const cancelOrder = (orderId) => api.patch(`/api/orders/${orderId}/cancel`);
