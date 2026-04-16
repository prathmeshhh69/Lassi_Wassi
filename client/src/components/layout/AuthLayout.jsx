import React from "react";
import { motion } from "framer-motion";

const AuthLayout = ({ children }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4 sm:p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-8"
            >
                {children}
            </motion.div>
        </div>
    );
};

export default AuthLayout;
