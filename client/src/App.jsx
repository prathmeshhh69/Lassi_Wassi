import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ── Providers ────────────────────────────────────────────────────────────────
import { AuthProvider }  from "./context/AuthContext.jsx";
import { CartProvider }  from "./context/CartContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";

// ── Guards ───────────────────────────────────────────────────────────────────
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// ── Customer pages ───────────────────────────────────────────────────────────
import Home             from "./pages/Home.jsx";
import Menu             from "./pages/Menu.jsx";
import ItemDetails      from "./pages/ItemDetails.jsx";
import RestaurantDetailsPage from "./pages/RestaurantDetailsPage.jsx";
import Cart             from "./pages/Cart.jsx";
import Checkout         from "./pages/Checkout.jsx";
import OrderHistory     from "./pages/OrderHistory.jsx";
import OrderTracking    from "./pages/OrderTracking.jsx";
import Profile          from "./pages/Profile.jsx";
import PreOrder         from "./pages/PreOrder.jsx";
import Booking          from "./pages/Booking.jsx";
import About            from "./pages/About.jsx";
import Contact          from "./pages/Contact.jsx";
import NotFound         from "./pages/NotFound.jsx";

// ── Auth pages ───────────────────────────────────────────────────────────────
import Login      from "./pages/Auth/Login.jsx";
import Signup     from "./pages/Auth/Signup.jsx";
import OwnerLogin from "./pages/Auth/OwnerLogin.jsx";

// ── Owner pages ───────────────────────────────────────────────────────────────
import OwnerLayout        from "./components/owner/OwnerLayout.jsx";
import OverviewDashboard  from "./pages/owner/OwnerDashboard.jsx";
import OwnerOrders        from "./pages/owner/OwnerOrders.jsx";
import OwnerMenu          from "./pages/owner/OwnerMenu.jsx";
import OwnerBookings      from "./pages/owner/OwnerBookings.jsx";
import OwnerAnalytics     from "./pages/owner/OwnerAnalytics.jsx";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <SocketProvider>
        <Router basename={import.meta.env.BASE_URL}>
          <Routes>
            {/* ── Public ─────────────────────────────────── */}
            <Route path="/"           element={<Home />} />
            <Route path="/menu"       element={<Menu />} />
            <Route path="/menu/:itemId" element={<ItemDetails />} />
            <Route path="/restaurant/:id" element={<RestaurantDetailsPage />} />
            <Route path="/cart"       element={<Cart />} />
            <Route path="/about"      element={<About />} />
            <Route path="/contact"    element={<Contact />} />
            <Route path="/login"      element={<Login />} />
            <Route path="/signup"     element={<Signup />} />
            <Route path="/owner/login" element={<OwnerLogin />} />
            <Route path="/pre-order/:restaurantId" element={<PreOrder />} />
            <Route path="/booking/:restaurantId"   element={<Booking />} />

            {/* ── Protected (customer) ───────────────────── */}
            <Route path="/checkout"   element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/profile"    element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/orders"     element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
            <Route path="/orders/:orderId/track" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />

            {/* ── Protected (owner / admin) ──────────────── */}
            <Route
              path="/owner"
              element={
                <ProtectedRoute allowedRoles={["owner", "admin"]}>
                  <OwnerLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard"  element={<OverviewDashboard />} />
              <Route path="orders"     element={<OwnerOrders />} />
              <Route path="menu"       element={<OwnerMenu />} />
              <Route path="bookings"   element={<OwnerBookings />} />
              <Route path="analytics"  element={<OwnerAnalytics />} />
            </Route>

            {/* ── 404 ────────────────────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        </SocketProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
