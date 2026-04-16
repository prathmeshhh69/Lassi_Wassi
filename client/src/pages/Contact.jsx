import { useState } from "react";
import { motion } from "framer-motion";
import Layout from "../components/Layout.jsx";
import SectionTitle from "../components/ui/SectionTitle.jsx";
import Button from "../components/ui/Button.jsx";

const INFO = [
  { icon: "📍", label: "Address",   value: "123 Flavour Street, Koregaon Park, Pune — 411001" },
  { icon: "📞", label: "Phone",     value: "+91 98765 43210" },
  { icon: "📧", label: "Email",     value: "hello@lassiwassi.in" },
  { icon: "🕐", label: "Hours",     value: "Mon – Sun: 9 AM – 11 PM" },
];

const SOCIALS = [
  { label: "Instagram", href: "#", icon: "📸" },
  { label: "Twitter",   href: "#", icon: "🐦" },
  { label: "Facebook",  href: "#", icon: "📘" },
];

export default function Contact() {
  const [form, setForm]       = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError("Please fill in all required fields.");
      return;
    }
    setSending(true);
    setError("");
    // Simulate submission (backend endpoint optional)
    await new Promise(r => setTimeout(r, 800));
    setSent(true);
    setSending(false);
  };

  return (
    <Layout pageKey="contact">
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 via-amber-50 to-white py-14 px-4 sm:px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="text-5xl mb-3 block">💬</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Get in Touch</h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Have a question, feedback, or a partnership idea? We'd love to hear from you.
          </p>
        </motion.div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* ── Info column ── */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>
          <SectionTitle title="Contact Info" size="md" className="mb-6" />
          <div className="space-y-4 mb-8">
            {INFO.map(info => (
              <div key={info.label} className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{info.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{info.label}</p>
                  <p className="text-sm text-gray-700 mt-0.5">{info.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Follow Us</p>
            <div className="flex gap-3">
              {SOCIALS.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:border-orange-300 hover:text-orange-500 transition-all shadow-sm"
                >
                  {s.icon} {s.label}
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Form column ── */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
          {sent ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <span className="text-6xl mb-4">🎉</span>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h2>
              <p className="text-sm text-gray-500">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <SectionTitle title="Send a Message" size="sm" className="mb-4" />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-600 text-xs">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@email.com"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="How can we help?"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Message *</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={4}
                  placeholder="Tell us what's on your mind…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                />
              </div>

              <Button type="submit" full size="md" loading={sending}>
                Send Message
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
