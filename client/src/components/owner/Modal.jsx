import { motion, AnimatePresence } from "framer-motion";
import { MdClose } from "react-icons/md";

/**
 * Modal — animated overlay dialog
 * Props: open, onClose, title, children, maxWidth (Tailwind class, default "max-w-lg")
 */
const Modal = ({ open, onClose, title, children, maxWidth = "max-w-lg" }) => (
    <AnimatePresence>
        {open && (
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />

                {/* Dialog */}
                <motion.div
                    className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} z-10 max-h-[90vh] overflow-y-auto`}
                    initial={{ scale: 0.95, y: 16, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.95, y: 16, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    <div className="flex items-center justify-between p-5 border-b border-gray-100">
                        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
                        >
                            <MdClose size={20} />
                        </button>
                    </div>
                    <div className="p-5">{children}</div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

export default Modal;
