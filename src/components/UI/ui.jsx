// src/components/UI/ui.jsx
"use client";

import React from "react";

/* ---------- Tiny UI Primitives (reusable) ---------- */
export const Card = ({ className = "", children }) => (
  <div className={`shadow-[0_10px_30px_rgba(0,0,0,0.08)] rounded-xl border border-slate-200 bg-white ${className}`}>{children}</div>
);

export const Divider = ({ className = "" }) => (
  <div className={`my-6 h-px bg-slate-200 ${className}`} />
);

export const Pill = ({ children, className = "" }) => (
  <span className={`inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm ${className}`}>
    {children}
  </span>
);

/* ---------- Skeletons ---------- */
const shimmer = "animate-pulse bg-slate-200/70";

export function SkeletonLine({ w = "w-full", h = "h-4", className = "" }) {
  return <div className={`${shimmer} ${w} ${h} shimmer rounded${className ? ` ${className}` : ""}`} />;
}

export function SkeletonAvatar({ className = "" }) {
  return <div className={`${shimmer} h-20 w-20 rounded-full ${className}`} />;
}

export function BlockSkeleton() {
  return (
    <Card className="p-6">
      <SkeletonLine w="w-40" />
      <div className="mt-4 space-y-3">
        <SkeletonLine />
        <SkeletonLine w="w-2/3" />
        <SkeletonLine w="w-4/5" />
      </div>
    </Card>
  );
}
