import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

export function Switcher({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300
        ${checked ? 'bg-gradient-to-r from-main-400 to-main-600' : 'bg-gray-300 dark:bg-dark-bg-card'}
        focus:outline-none focus:ring-2 focus:ring-main-400`}
    >
      {/* Circle Knob */}
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        className={`absolute top-1 ${checked ? "right-1" : "left-1"} flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-dark-bg-base shadow-md`}
      >
        {checked ? (
          <Check className="h-3 w-3 text-main-500" />
        ) : (
          <X className="h-3 w-3 text-gray-400 dark:text-dark-text-secondary" />
        )}
      </motion.span>
    </button>
  );
}