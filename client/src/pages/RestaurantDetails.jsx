import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiClock, FiPlus, FiShoppingBag, FiStar } from "react-icons/fi";

const reveal = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

function MenuItemCard({ item, onAdd }) {
  return (
    <motion.div
      variants={reveal}
      className="group overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm transition-shadow duration-200 hover:shadow-lg hover:shadow-slate-200/70"
    >
      <div className="flex gap-4 p-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-500">
              Image
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-dark">
                {item.name}
              </p>
              {item.description ? (
                <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">
                  {item.description}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-dark">₹{item.price}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                ~{item.prepTime} min
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            {item.tag ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {item.tag}
              </span>
            ) : (
              <span className="text-xs text-slate-500"> </span>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onAdd(item)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-primary/20 hover:bg-primary/90 transition-colors-transform ease-soft-out"
            >
              <FiPlus className="h-4 w-4" />
              Add
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RestaurantDetails({ restaurant }) {
  const demoRestaurant = useMemo(
    () => ({
      name: "Punjab Lassi House",
      rating: 4.7,
      deliveryTime: "25–35 min",
      cuisines: ["Lassi", "North Indian", "Snacks"],
      banner:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1400&q=70",
      categories: [
        {
          key: "starters",
          label: "Starters",
          items: [
            {
              id: "s1",
              name: "Crispy Paneer Bites",
              description: "Golden bites with mint chutney.",
              price: 159,
              prepTime: 15,
              tag: "Popular"
            },
            {
              id: "s2",
              name: "Masala Fries",
              description: "Street-style spice mix, extra crunchy.",
              price: 129,
              prepTime: 12
            }
          ]
        },
        {
          key: "main",
          label: "Main Course",
          items: [
            {
              id: "m1",
              name: "Chole Kulche Combo",
              description: "Comforting, hearty, and filling.",
              price: 219,
              prepTime: 22,
              tag: "Best value"
            },
            {
              id: "m2",
              name: "Tandoori Paneer Roll",
              description: "Smoky paneer, fresh salad, soft roti.",
              price: 199,
              prepTime: 18
            }
          ]
        },
        {
          key: "drinks",
          label: "Drinks",
          items: [
            {
              id: "d1",
              name: "Classic Sweet Lassi",
              description: "Thick, creamy, chilled.",
              price: 99,
              prepTime: 8,
              tag: "Signature"
            },
            {
              id: "d2",
              name: "Mango Lassi",
              description: "Seasonal mango blend.",
              price: 119,
              prepTime: 8
            }
          ]
        }
      ]
    }),
    []
  );

  const data = restaurant || demoRestaurant;
  const [active, setActive] = useState(data.categories?.[0]?.key || "starters");
  const [cartCount, setCartCount] = useState(2);

  const sectionRefs = useRef({});

  const scrollToCategory = (key) => {
    setActive(key);
    const el = sectionRefs.current[key];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const onAdd = () => setCartCount((c) => c + 1);

  return (
    <div className="bg-light">
      {/* Banner */}
      <div className="relative">
        <div className="h-56 sm:h-72 lg:h-80 w-full overflow-hidden">
          <img
            src={data.banner}
            alt={data.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />

        <div>
          <motion.div
            initial="hidden"
            animate="show"
            transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
            variants={reveal}
            className="relative -mt-12 sm:-mt-14 lg:-mt-16"
          >
            <div className="rounded-3xl bg-white p-5 sm:p-6 ring-1 ring-slate-200 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-dark">
                    {data.name}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    {data.cuisines?.join(" • ")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    <FiStar className="h-4 w-4" />
                    {Number(data.rating).toFixed(1)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    <FiClock className="h-4 w-4" />
                    {data.deliveryTime}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[72px] z-20 bg-light/90 backdrop-blur border-b border-slate-200">
        <div className="py-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {data.categories.map((c) => {
              const isActive = active === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => scrollToCategory(c.key)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-colors-transform ease-soft-out ${
                    isActive
                      ? "bg-primary text-white ring-primary/30"
                      : "bg-white text-slate-700 ring-slate-200 hover:ring-primary/30 hover:text-primary"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="py-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          transition={{ staggerChildren: 0.05 }}
          className="space-y-10"
        >
          {data.categories.map((c) => (
            <section
              key={c.key}
              ref={(el) => {
                sectionRefs.current[c.key] = el;
              }}
              className="scroll-mt-32"
            >
              <motion.div variants={reveal} className="flex items-end justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-dark">
                    {c.label}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {c.items.length} items
                  </p>
                </div>
              </motion.div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                {c.items.map((it) => (
                  <MenuItemCard key={it.id} item={it} onAdd={onAdd} />
                ))}
              </div>
            </section>
          ))}
        </motion.div>
      </div>

      {/* Floating View Cart */}
      <div className="fixed inset-x-0 bottom-4 z-30">
        <div>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="ml-auto flex w-full sm:w-auto items-center justify-between gap-3 rounded-2xl bg-dark px-5 py-4 text-light shadow-xl shadow-slate-900/20"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                <FiShoppingBag className="h-5 w-5" />
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold">View Cart</p>
                <p className="text-xs text-slate-300">
                  {cartCount} item{cartCount === 1 ? "" : "s"} added
                </p>
              </div>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              Checkout
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default RestaurantDetails;

