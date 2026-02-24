import Currency from "../common/Currency";

export default function PriceTag({ price, color = 'default', className = '' }) {
  // Mapping roles to Tailwind-friendly classes or CSS variables
  const colorClasses = {
    default: 'text-slate-900 dark:text-dark-text-primary',
    white: 'text-white',
    green: 'text-main-600 dark:text-main-400',
    black: 'text-black dark:text-white',
  };

  const selectedColorClass = colorClasses[color] || colorClasses.default;

  return (
    <div className={`inline-flex items-center gap-1 font-semibold ${selectedColorClass} ${className}`}>
      <span className="tracking-tight">
        {typeof price === "number" ? price.toFixed(2) : price || '0.00'}
      </span>

      {/* Applying currentcolor to the SVG ensures it always matches the text 
         without needing a separate 'fill' logic in the colors object.
      */}
      <Currency className="h-[1.1em] w-[1.1em] fill-current" aria-hidden="true" />
    </div>
  );
}