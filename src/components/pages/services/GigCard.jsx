// components/GigCard.jsx
import { Link } from '@/i18n/navigation';

export default function GigCard({ gig, category, service }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-white text-black border border-[#E5E7EB] shadow">
      {gig.gallery?.[0] ? (
        <img src={gig.gallery[0]} alt={gig.title} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-slate-100" />
      )}

      <div className="p-4 space-y-2">
        <h3 className="text-lg font-semibold line-clamp-2">{gig.title}</h3>
        <div className="text-sm text-slate-600">Delivery: {gig.delivery}</div>
        <div className="text-sm">
          From <span className="font-semibold">{gig.price} ﷼</span>
        </div>

        <Link
          href={`/services/${category}/${service}/${gig.slug}`}
          className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-[#108A00] text-white px-4 py-2 hover:bg-emerald-700 transition"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
