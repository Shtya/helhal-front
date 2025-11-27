import Currency from "../common/Currency";

export default function PriceTag({ price, color = 'black', className = '' }) {
  const colors = {
    black: '#111',
    white: '#fff',
    green: '#00bb7c',
  };
  return (
    <div className={`inline-flex text-base items-center gap-1   ${className}`} style={{ color: colors[color] }}  >
      <span className='font-semibold'>{typeof price == "number" ? price?.toFixed(2) : price || 0}</span>

      <Currency style={{ fill: colors[color] }} />


      {/* <img
        src={`/icons/ryal-${color}.svg`}
        alt="﷼"
        className="h-4 w-4 object-contain"
      /> */}
    </div>
  );
}
