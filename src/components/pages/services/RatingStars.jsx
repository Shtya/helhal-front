export default function RatingStars({ value = 0, outOf = 5 }) {
  const full = Math.round(value);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: outOf }).map((_, i) => (
        <span
          key={i}
          className={`
            ${i < full
              ? 'text-main-500 dark:text-main-400'
              : 'text-slate-500/60 dark:text-dark-text-secondary'}
          `}
        >
          ★
        </span>
      ))}
    </div>
  );
}