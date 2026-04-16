import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "../components/Layout.jsx";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
        >
          {/* Illustration */}
          <div className="relative inline-block mb-6">
            <span className="text-[7rem] leading-none select-none">🍽️</span>
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
              404
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Page Not Found
          </h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-xs mx-auto mb-8">
            Looks like this page wandered off — probably following the smell of biryani.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors text-sm shadow-sm"
            >
              Back to Home
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-200 hover:border-orange-400 text-gray-600 font-bold rounded-xl transition-colors text-sm"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
