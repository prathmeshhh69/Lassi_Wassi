import { createContext, useContext, useReducer, useEffect, useCallback } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────
const TAX_RATE = 0.05;          // 5%
const DELIVERY_FEE = 40;        // ₹40 flat delivery
const FREE_DELIVERY_ABOVE = 500; // free when subtotal ≥ ₹500
const STORAGE_KEY = "lw_cart";

// ─── Shape of a cart item ────────────────────────────────────────────────────
// {
//   menuItemId : string
//   name       : string
//   price      : number
//   quantity   : number
//   image      : string
//   restaurantId   : string
//   restaurantName : string
//   prepTime   : number   (used for ETA calculation on frontend preview)
// }

// ─── Reducer ─────────────────────────────────────────────────────────────────
function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const { item } = action;

      // Enforce single-restaurant cart
      if (state.restaurantId && state.restaurantId !== item.restaurantId) {
        // Signal conflict — caller must confirm clear before adding
        return { ...state, pendingConflict: item };
      }

      const existing = state.items.find((i) => i.menuItemId === item.menuItemId);
      const items = existing
        ? state.items.map((i) =>
            i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i
          )
        : [...state.items, { ...item, quantity: item.quantity ?? 1 }];

      return {
        ...state,
        items,
        restaurantId: item.restaurantId,
        restaurantName: item.restaurantName,
        pendingConflict: null,
      };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.menuItemId !== action.menuItemId),
        ...(state.items.length === 1
          ? { restaurantId: null, restaurantName: null }
          : {}),
      };

    case "SET_QUANTITY": {
      if (action.quantity < 1) {
        // Treat as remove
        const items = state.items.filter((i) => i.menuItemId !== action.menuItemId);
        return {
          ...state,
          items,
          ...(items.length === 0 ? { restaurantId: null, restaurantName: null } : {}),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.menuItemId === action.menuItemId ? { ...i, quantity: action.quantity } : i
        ),
      };
    }

    case "CLEAR_CART":
      return { ...initialState };

    case "RESOLVE_CONFLICT":
      // User confirmed switch: clear old cart and add the pending item
      return cartReducer(
        { ...initialState },
        { type: "ADD_ITEM", item: state.pendingConflict }
      );

    case "DISMISS_CONFLICT":
      return { ...state, pendingConflict: null };

    case "HYDRATE":
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

const initialState = {
  items: [],
  restaurantId: null,
  restaurantName: null,
  pendingConflict: null,
};

// ─── Context ──────────────────────────────────────────────────────────────────
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // ── Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        dispatch({ type: "HYDRATE", payload: parsed });
      }
    } catch {
      // corrupted storage — ignore
    }
  }, []);

  // ── Persist to localStorage on every change (except pendingConflict)
  useEffect(() => {
    const { pendingConflict: _skip, ...toStore } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, [state]);

  // ─── Derived values ─────────────────────────────────────────────────────────
  const totalItems = state.items.reduce((n, i) => n + i.quantity, 0);
  const subtotal   = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax        = Math.round(subtotal * TAX_RATE);
  const deliveryFee = subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  const total      = subtotal + tax + deliveryFee;

  // Front-end ETA preview: max item prepTime + 30 min delivery buffer
  const etaMinutes = state.items.length
    ? Math.max(...state.items.map((i) => i.prepTime || 15)) + 30
    : 0;

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const addItem     = useCallback((item) => dispatch({ type: "ADD_ITEM",    item }),       []);
  const removeItem  = useCallback((id)   => dispatch({ type: "REMOVE_ITEM", menuItemId: id }), []);
  const setQuantity = useCallback((id, qty) => dispatch({ type: "SET_QUANTITY", menuItemId: id, quantity: qty }), []);
  const clearCart   = useCallback(()    => dispatch({ type: "CLEAR_CART" }),                []);
  const resolveConflict = useCallback(() => dispatch({ type: "RESOLVE_CONFLICT" }),         []);
  const dismissConflict = useCallback(() => dispatch({ type: "DISMISS_CONFLICT" }),         []);

  const value = {
    // State
    items:           state.items,
    restaurantId:    state.restaurantId,
    restaurantName:  state.restaurantName,
    pendingConflict: state.pendingConflict,
    // Derived
    totalItems,
    subtotal,
    tax,
    deliveryFee,
    total,
    etaMinutes,
    freeDeliveryAbove: FREE_DELIVERY_ABOVE,
    // Actions
    addItem,
    removeItem,
    setQuantity,
    clearCart,
    resolveConflict,
    dismissConflict,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
};
