'use client';
import React from 'react';
import { motion } from 'framer-motion';

export function InputRadio({ checked, onChange, label, name, value }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={() => onChange(value)}
      className="relative cursor-pointer flex items-center gap-2 focus:outline-none"
    >
      {/* Outer circle */}
      <span
        className={`flex items-center justify-center h-5 w-5 rounded-full border transition-colors duration-300
          ${checked ? 'border-green-600' : 'border-gray-500 bg-white'}
          focus:ring-2 focus:ring-green-400`}
      >
        <motion.span
          initial={false}
          animate={{
            scale: checked ? 1 : 0,
            opacity: checked ? 1 : 0,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="h-3 w-3 rounded-full bg-green-600"
        />
      </span>

      {/* Label */}
      <span className="text-sm text-gray-700">{label}</span>
    </button>
  );
}
