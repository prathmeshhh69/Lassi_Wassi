import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Hero from "../components/Hero.jsx";
import FadeInSection from "../components/FadeInSection.jsx";
import PreOrderHighlight from "../components/PreOrderHighlight.jsx";
import RestaurantCard from "../components/RestaurantCard.jsx";
import SectionTitle from "../components/ui/SectionTitle.jsx";
import FeaturedMenuSection from "../components/menu/FeaturedMenuSection.jsx";
import api from "../services/api.js";

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    api.get("/api/restaurants")
      .then(({ data }) => setRestaurants(data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout pageKey="home">
      <Hero />

      <div className="pb-16 space-y-16">
        {/* ── Restaurant Grid / Menu ── */}
        <FadeInSection delay={0.05}>
          <section id="restaurants" className="max-w-6xl mx-auto px-4 sm:px-6">
            <SectionTitle
              title="Restaurants Near You"
              subtitle="Fresh, fast, and delivered to your door"
              size="md"
              className="mb-6"
              action={
                <Link
                  to="/menu"
                  className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                >
                  Browse full menu →
                </Link>
              }
            />

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : restaurants.length === 0 ? (
              <FeaturedMenuSection />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((r, i) => (
                  <motion.div
                    key={r._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                  <RestaurantCard
                    name={r.name}
                    image={r.image}
                    rating={r.rating}
                    prepTime={r.prepTime}
                    cuisines={r.cuisines}
                    href={`/restaurant/${r._id}`}
                  />
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </FadeInSection>

        {/* ── Pre-order highlight ── */}
        <FadeInSection delay={0.08}>
          <PreOrderHighlight />
        </FadeInSection>
      </div>
    </Layout>
  );
}
