'use client';

import { useEffect, useState } from 'react';

import { Trash2, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import NoResults from '@/components/common/NoResults';
import Img from '@/components/atoms/Img';
import Button from '@/components/atoms/Button';
import { useValues } from '@/context/GlobalContext';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function CartPage() {
  const t = useTranslations('Cart.page');
  const { cart, loadingCart: loading, setCart } = useValues();
  const [busy, setBusy] = useState(null); // serviceId currently mutating
  const [error, setError] = useState(null);

  const removeFromCart = async (serviceId) => {
    setBusy(serviceId);
    setError(null);

    const prev = cart;
    setCart(prevCart => ({
      ...prevCart,
      items: (prevCart?.items ?? []).filter(item => String(item.id || item._id) !== String(serviceId)),
      total: Math.max((prevCart.total || 0) - 1, 0),
    }));
    try {
      await api.delete(`/cart/item/${serviceId}`);
    } catch (e) {
      setCart(prev);
      setError(e?.response?.data?.message ?? t('errors.failedToRemove'));
    } finally {
      setBusy(null);
    }
  };

  const clearCart = async () => {
    if (!cart.total) return;
    setBusy('all');
    const prev = cart;
    setCart(null);

    try {
      await api.delete('/cart');
    } catch (e) {
      setCart(prev);
      setError(e?.response?.data?.message ?? t('errors.failedToClear'));
    } finally {
      setBusy(null);
    }
  };

  const hasItems = cart?.total > 0;

  return (
    <div className="bg-white dark:bg-dark-bg-base py-8 sm:py-12 px-4 sm:px-6 transition-colors duration-300 min-h-screen">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-dark-text-primary">
              {t('title')}
            </h1>
            <p className="text-slate-600 dark:text-dark-text-secondary">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {hasItems && (
              <Button
                name={busy === 'all' ? t('clearing') : t('clearCart')}
                color="red"
                onClick={clearCart}
                disabled={busy === 'all'}
                className="!w-fit !px-4"
                aria-label={t('clearCart')}
              />
            )}
            <Button
              name={t('exploreServices')}
              color="secondary"
              href="/services"
              disabled={busy === 'all'}
              className="!w-fit !px-4 dark:bg-dark-bg-input dark:text-dark-text-primary! dark:border-dark-border"
              aria-label={t('exploreServices')}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 bg-slate-100 dark:bg-dark-bg-card rounded-xl animate-pulse border border-slate-200 dark:border-dark-border" />
            ))}
          </div>
        )}

        {!loading && !hasItems && (
          <div className="py-12">
            <NoResults
              mainText={t('emptyState.mainText')}
              additionalText={t('emptyState.additionalText')}
              buttonText={t('emptyState.buttonText')}
              buttonLink="/services"
            />
          </div>
        )}

        {!loading && hasItems && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cart.items.map((service) => {
              const thumb = service?.gallery?.[0]?.url;
              return (
                <div
                  key={service.id}
                  className="bg-white dark:bg-dark-bg-card border border-slate-200 dark:border-dark-border rounded-xl shadow-sm overflow-hidden hover:shadow-xl dark:hover:shadow-2xl/20 transition-all duration-300"
                >
                  <div className="relative w-full aspect-[16/10] overflow-hidden">
                    <Img
                      src={thumb}
                      alt={service?.title ?? 'Service'}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={service?.slug ? `/services/category/${service.slug}` : '#'}
                          className="block text-base font-bold text-slate-900 dark:text-dark-text-primary leading-tight hover:text-main-600 dark:hover:text-main-400 transition-colors line-clamp-2"
                          title={service?.title}
                        >
                          {service?.title ?? 'Service'}
                        </Link>
                      </div>
                      <button
                        onClick={() => removeFromCart(service.id)}
                        disabled={busy === service.id}
                        className="p-2 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60 shrink-0"
                        title={t('remove')}
                      >
                        {busy === service.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <Button
                      href={`/services/category/${service?.slug ?? ''}`}
                      className="w-full !h-10 text-sm"
                      name={t('viewService')}
                      aria-label={t('viewService')}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
