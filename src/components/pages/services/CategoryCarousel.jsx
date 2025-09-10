'use client';
import { Link } from '@/i18n/navigation';
import React from 'react';

export default function CategoryCarousel({ items = [] }) {
  const ref = React.useRef(null);

  const scrollBy = (dir) => {
    if (!ref.current) return;
    const width = ref.current.clientWidth;
    ref.current.scrollBy({ left: dir * (width * 0.9), behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        className="nice-scroll flex gap-4 overflow-x-auto pb-2"
      >
        {items.map((c) => (
          <Link
            key={c.id}
            href={`/services?category=${c.id}`}
            className="flex-none w-[280px] rounded-xl bg-white text-black border border-white/10 hover:border-emerald-500/60 transition card-shadow overflow-hidden"
          >
            <div className="h-32 bg-gradient-to-br from-gray-900 to-gray-800 flex items-end p-4">
              <div className="text-sm text-emerald-300">{c.title}</div>
            </div>
            <div className="px-4 py-3 text-lg font-semibold">
              Website Development
            </div>
          </Link>
        ))}
      </div>

      {/* chevrons */}
      <button
        onClick={() => scrollBy(-1)}
        className="absolute -left-4 -top-6 bg-white/10 backdrop-blur rounded-full p-2 hover:bg-white/20"
        aria-label="Prev"
      >
        ‹
      </button>
      <button
        onClick={() => scrollBy(1)}
        className="absolute -right-4 -top-6 bg-white/10 backdrop-blur rounded-full p-2 hover:bg-white/20"
        aria-label="Next"
      >
        ›
      </button>
    </div>
  );
}
