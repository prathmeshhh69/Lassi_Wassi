import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import FadeInSection from "../components/FadeInSection.jsx";
import SectionTitle from "../components/ui/SectionTitle.jsx";

const TEAM = [
  { name: "Arjun Sharma",   role: "Founder & Chef",       emoji: "👨‍🍳" },
  { name: "Priya Mehta",    role: "Head of Operations",   emoji: "🧑‍💼" },
  { name: "Vikram Nair",    role: "Culinary Director",    emoji: "👨‍🍳" },
  { name: "Ananya Joshi",   role: "Customer Experience",  emoji: "👩‍💻" },
];

const VALUES = [
  { icon: "🌿", title: "Fresh Always",      desc: "Every dish starts with fresh, locally sourced ingredients — no shortcuts." },
  { icon: "❤️",  title: "Made with Love",   desc: "Authentic recipes passed down through generations, cooked with passion every day." },
  { icon: "⚡", title: "Speed Matters",     desc: "We respect your time. Most orders are out in under 15 minutes." },
  { icon: "🌍", title: "Community First",   desc: "We support local farmers and food artisans who share our values." },
];

export default function About() {
  return (
    <Layout pageKey="about">
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-orange-50 via-amber-50 to-white py-20 px-4 sm:px-6 text-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative z-10 max-w-2xl mx-auto"
        >
          <span className="text-6xl mb-4 block">🥛</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            The Story of{" "}
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              Lassi Wassi
            </span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            Born from a love of authentic Indian flavours and a dream to bring home-style cooking to your doorstep.
          </p>
        </motion.div>
        {/* decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-200 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />
      </section>

      {/* ── Our Story ── */}
      <FadeInSection>
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <SectionTitle title="Our Story" size="lg" className="mb-6" />
          <div className="space-y-4 text-gray-600 leading-relaxed text-[0.95rem]">
            <p>
              Lassi Wassi started in 2020 in a small kitchen in Pune, where our founder Arjun Sharma
              began selling his grandmother's lassi recipe to neighbours. The overwhelming response 
              convinced him that India needed a food platform built around warmth, authenticity, and speed.
            </p>
            <p>
              Today we partner with a curated selection of restaurants and home kitchens that share our 
              obsession with quality. Every partner goes through a rigorous tasting process — we only 
              list food we'd be proud to serve at our own table.
            </p>
            <p>
              Whether it's a cold glass of mango lassi on a summer afternoon or a hearty biryani on a 
              rainy evening, we're committed to delivering food that feels like home.
            </p>
          </div>
        </section>
      </FadeInSection>

      {/* ── Values ── */}
      <FadeInSection>
        <section className="bg-gray-50 py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <SectionTitle title="What We Stand For" center size="lg" className="mb-10" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {VALUES.map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex gap-4"
                >
                  <span className="text-3xl mt-0.5">{v.icon}</span>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">{v.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* ── Team ── */}
      <FadeInSection>
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <SectionTitle title="The Team" subtitle="The people behind every bite" center size="lg" className="mb-10" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-orange-50 border-2 border-orange-100 flex items-center justify-center text-4xl mb-3 shadow-sm">
                  {member.emoji}
                </div>
                <p className="font-semibold text-gray-800 text-sm">{member.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </FadeInSection>

      {/* ── CTA ── */}
      <FadeInSection>
        <section className="bg-gradient-to-r from-orange-500 to-amber-400 py-16 px-4 sm:px-6 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Ready to taste the difference?</h2>
          <p className="text-orange-100 mb-6 text-sm">Explore our full menu and order or pre-book your table today.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/menu" className="px-6 py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors text-sm shadow">
              Browse Menu
            </Link>
            <Link to="/contact" className="px-6 py-3 border border-white/50 text-white font-bold rounded-xl hover:bg-white/10 transition-colors text-sm">
              Get in Touch
            </Link>
          </div>
        </section>
      </FadeInSection>
    </Layout>
  );
}
