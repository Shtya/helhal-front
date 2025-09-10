export default function RatingStars({ value = 0, outOf = 5 }) {
  const full = Math.round(value);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: outOf }).map((_, i) => (
        <span key={i} className={i < full ? 'text-emerald-500' : 'text-slate-500/60'}>
          ★
        </span>
      ))}
    </div>
  );
}
