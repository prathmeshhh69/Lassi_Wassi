import { motion } from "framer-motion";

const variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 }
};

function FadeInSection({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 0.61, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default FadeInSection;

