'use client';
import React from 'react';

export default function FiltersBar({ onChange }) {
  const [budget, setBudget] = React.useState('');
  const [delivery, setDelivery] = React.useState('');
  const [level, setLevel] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [sort, setSort] = React.useState('all');

  React.useEffect(() => {
    onChange?.({ budget, delivery, level, location, sort });
  }, [budget, delivery, level, location, sort, onChange]);

  const box = 'h-12 rounded-xl border border-main-600/70 focus-within:ring-2 focus-within:ring-main-500/80 px-4 bg-transparent';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 my-6">
      <input
        placeholder="Service Options"
        className={`${box} text-sm placeholder:text-main-400/70`}
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
      />
      <input
        placeholder="Seller Details"
        className={`${box} text-sm placeholder:text-main-400/70`}
        value={delivery}
        onChange={(e) => setDelivery(e.target.value)}
      />
      <input
        placeholder="Budget"
        className={`${box} text-sm placeholder:text-main-400/70`}
        value={level}
        onChange={(e) => setLevel(e.target.value)}
      />
      <input
        placeholder="Delivery Time"
        className={`${box} text-sm placeholder:text-main-400/70`}
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <input
          placeholder="Search by Location"
          className={`flex-1 ${box} text-sm placeholder:text-main-400/70`}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <select
          className="h-12 rounded-xl border border-main-600/70 bg-transparent px-3 text-sm"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option className="text-black" value="all">Sort By All</option>
          <option className="text-black" value="price-asc">Price (low → high)</option>
          <option className="text-black" value="price-desc">Price (high → low)</option>
          <option className="text-black" value="rating">Rating</option>
        </select>
      </div>
    </div>
  );
}
