"use client";

export default function ServiceCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden bg-white border border-[#E5E7EB] shadow-inner animate-pulse">
      {/* Image placeholder */}
      <div className="relative">
        <div className="w-[calc(100%-10px)] mx-[5px] mt-[5px] h-[180px] lg:h-[220px] rounded-lg bg-slate-200" />
      </div>

      {/* Content placeholders */}
      <div className="p-4 space-y-3">
        {/* Avatar + Name */}
        <div className="flex items-center gap-2">
          <div className="h-[35px] lg:h-[45px] w-[35px] lg:w-[45px] rounded-full bg-slate-200" />
          <div className="h-5 w-32 bg-slate-200 rounded" />
        </div>

        {/* Level + Stars */}
        <div className="flex items-center justify-between gap-3">
          <div className="h-4 w-20 bg-slate-200 rounded" />
          <div className="h-4 w-16 bg-slate-200 rounded" />
        </div>

        {/* Service Title */}
        <div className="h-5 w-40 bg-slate-200 rounded" />

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-slate-200" />
          <div className="h-4 w-24 bg-slate-200 rounded" />
        </div>

        {/* Price */}
        <div className="h-4 w-28 bg-slate-200 rounded" />

        {/* Button */}
        <div className="h-10 w-full bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}
