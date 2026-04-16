import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "../components/Layout.jsx";
import Badge from "../components/ui/Badge.jsx";
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useCart } from "../context/CartContext.jsx";
import api from "../services/api.js";

export default function ItemDetails() {
  const { itemId }           = useParams();
  const navigate             = useNavigate();
  const { addItem, items: cartItems } = useCart();

  const [item, setItem]           = useState(null);
  const [restaurant, setRest]     = useState(null);
  const [related, setRelated]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/menu/${itemId}`)
      .then(async ({ data }) => {
        const menuItem = data.data ?? data;
        setItem(menuItem);

        // Fetch restaurant details
        if (menuItem.restaurant) {
          const rRes = await api.get(`/api/restaurants/${menuItem.restaurant?._id ?? menuItem.restaurant}`);
          const rest = rRes.data.data ?? rRes.data;
          setRest(rest);

          // Fetch related items from same restaurant
          const mRes = await api.get(`/api/restaurants/${rest._id}/menu`);
          const all  = mRes.data.data ?? mRes.data ?? [];
          setRelated(all.filter((i) => i._id !== itemId && i.category === menuItem.category).slice(0, 4));
        }
      })
      .catch(() => setError("Item not found."))
      .finally(() => setLoading(false));
  }, [itemId]);

  if (loading) return <Layout><LoadingSpinner variant="page" message="Loading item…" /></Layout>;
  if (error || !item) return (
    <Layout>
      <EmptyState
        icon="❌"
        title="Item not found"
        message={error}
        action={{ label: "Back to Menu", onClick: () => navigate("/menu") }}
      />
    </Layout>
  );

  const cartQty = cartItems.find((i) => i.menuItemId === itemId)?.quantity ?? 0;

  return (
    <Layout pageKey="menu">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-orange-500">Home</Link>
          <span>/</span>
          <Link to="/menu" className="hover:text-orange-500">Menu</Link>
          <span>/</span>
          <span className="text-gray-600 truncate max-w-[200px]">{item.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* ── Image ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl overflow-hidden bg-orange-50 aspect-square flex items-center justify-center"
          >
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-8xl">🍽️</span>
            )}
          </motion.div>

          {/* ── Info ── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            className="space-y-5"
          >
            <div>
              {item.category && (
                <Badge variant="default" size="sm" className="mb-2">{item.category}</Badge>
              )}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {item.name}
              </h1>
              {restaurant && (
                <p className="text-sm text-gray-400 mt-1">
                  from{" "}
                  <Link
                    to={`/restaurants/${restaurant._id}`}
                    className="text-orange-500 hover:underline font-medium"
                  >
                    {restaurant.name}
                  </Link>
                </p>
              )}
            </div>

            {item.description && (
              <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
            )}

            <div className="flex flex-wrap gap-3 items-center">
              {item.isVeg !== undefined && (
                <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border-2 ${item.isVeg ? "border-green-500 text-green-700" : "border-red-500 text-red-600"}`}>
                  <span className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                  {item.isVeg ? "Veg" : "Non-Veg"}
                </span>
              )}
              {item.spiceLevel && (
                <Badge variant="warning">🌶 {item.spiceLevel}</Badge>
              )}
              {item.calories && (
                <Badge variant="neutral">{item.calories} kcal</Badge>
              )}
            </div>

            <div className="text-3xl font-extrabold text-orange-500">₹{item.price}</div>

            {/* Add to cart */}
            <div className="flex items-center gap-3">
              {cartQty === 0 ? (
                <button
                  onClick={() =>
                    addItem({
                      menuItemId: item._id,
                      name: item.name,
                      price: item.price,
                      image: item.image,
                      restaurantId: restaurant?._id ?? item.restaurant,
                      restaurantName: restaurant?.name ?? "",
                    })
                  }
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                >
                  Add to Cart
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
                    <button className="w-7 h-7 rounded-full bg-white border border-orange-200 text-gray-700 font-bold flex items-center justify-center hover:bg-gray-50">−</button>
                    <span className="font-bold text-gray-800 min-w-[1.5rem] text-center">{cartQty}</span>
                    <button
                      onClick={() =>
                        addItem({
                          menuItemId: item._id,
                          name: item.name,
                          price: item.price,
                          image: item.image,
                          restaurantId: restaurant?._id ?? item.restaurant,
                          restaurantName: restaurant?.name ?? "",
                        })
                      }
                      className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center hover:bg-orange-600"
                    >+</button>
                  </div>
                  <Link
                    to="/cart"
                    className="flex-1 text-center py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors"
                  >
                    View Cart
                  </Link>
                </>
              )}
            </div>

            {/* Restaurant quick actions */}
            {restaurant && (
              <div className="flex gap-3 pt-2">
                <Link
                  to={`/pre-order/${restaurant._id}`}
                  className="flex-1 text-center py-2.5 rounded-xl border border-orange-200 text-orange-600 text-sm font-semibold hover:bg-orange-50 transition-colors"
                >
                  Pre-Order
                </Link>
                <Link
                  to={`/booking/${restaurant._id}`}
                  className="flex-1 text-center py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Book Table
                </Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Related items ── */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-lg font-bold text-gray-800 mb-5">You may also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map((r) => (
                <Link
                  key={r._id}
                  to={`/menu/${r._id}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="h-28 bg-orange-50 overflow-hidden flex items-center justify-center">
                    {r.image ? (
                      <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <span className="text-3xl">🍽️</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-800 truncate">{r.name}</p>
                    <p className="text-sm font-bold text-orange-500 mt-0.5">₹{r.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
