import Img from '@/components/atoms/Img';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

/**
 * About panel for admin monitor: shows abbreviation/summary for both buyer and seller.
 */
export function MonitorAboutPanel({ buyer, seller, t: tProp }) {
  const t = tProp || useTranslations('Dashboard.monitor');

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const abbreviateEmail = (email) => {
    if (!email) return '—';
    if (email.length <= 25) return email;
    return email.slice(0, 12) + '…' + email.slice(-10);
  };

  const abbreviateName = (name) => {
    if (!name) return t('unknown');
    if (name.length <= 20) return name;
    return name.slice(0, 17) + '…';
  };

  const buyerName = buyer?.username || buyer?.person?.username || t('unknown');
  const sellerName = seller?.username || seller?.person?.username || t('unknown');

  return (
    <div className="w-full p-3">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('about')}</h2>

      <div className="space-y-4">
        {/* Buyer abbreviation */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-start gap-3">
            <Img
              src={buyer?.profileImage}
              altSrc="/no-user.png"
              alt={buyerName}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-200"
            />
            <div className="flex-1 min-w-0">
              <Link
                href={`/profile/${buyer?.id}`}
                className="font-semibold text-slate-900 hover:text-main-600 truncate block"
              >
                {abbreviateName(buyerName)}
              </Link>
              <p className="text-xs text-emerald-700 font-medium">{t('buyer')}</p>
              <p className="text-sm text-slate-600 truncate" title={buyer?.person?.email || buyer?.email}>
                {abbreviateEmail(buyer?.person?.email || buyer?.email)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {t('memberSince')}: {formatDate(buyer?.memberSince || buyer?.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Seller abbreviation */}
        <div className="rounded-xl border border-main-200 bg-main-50/50 p-4">
          <div className="flex items-start gap-3">
            <Img
              src={seller?.profileImage}
              altSrc="/no-user.png"
              alt={sellerName}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-main-200"
            />
            <div className="flex-1 min-w-0">
              <Link
                href={`/profile/${seller?.id}`}
                className="font-semibold text-slate-900 hover:text-main-600 truncate block"
              >
                {abbreviateName(sellerName)}
              </Link>
              <p className="text-xs text-main-700 font-medium">{t('seller')}</p>
              <p className="text-sm text-slate-600 truncate" title={seller?.person?.email || seller?.email}>
                {abbreviateEmail(seller?.person?.email || seller?.email)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {t('memberSince')}: {formatDate(seller?.memberSince || seller?.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
