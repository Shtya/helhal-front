'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import NoResults from '@/components/common/NoResults';
import Img from '@/components/atoms/Img';
import Button from '@/components/atoms/Button';
import { useValues } from '@/context/GlobalContext';

export default function CartPage() {
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
      setError(e?.response?.data?.message ?? 'Failed to remove item');
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
      setError(e?.response?.data?.message ?? 'Failed to clear cart');
    } finally {
      setBusy(null);
    }
  };

  const hasItems = cart?.total > 0;

  return (
    <div className="bg-white py-8 sm:py-12 px-4 sm:px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Cart</h1>
            <p className="text-slate-600">These are the services in your cart.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {hasItems && (
              <Button
                name={busy === 'all' ? 'Clearing…' : 'Clear Cart'}
                color="red"
                onClick={clearCart}
                disabled={busy === 'all'}
                className="!w-fit !px-4"
                aria-label="Clear cart"
              />
            )}
            <Button
              name="Explore Services"
              color="secondary"
              href="/services"
              disabled={busy === 'all'}
              className="!w-fit !px-4"
              aria-label="Explore services"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-60 bg-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !hasItems && (
          <NoResults
            mainText="Your cart is empty"
            additionalText="Explore services and add them to your cart to see them here."
            buttonText="Explore Services"
            buttonLink="/services"
          />
        )}

        {!loading && hasItems && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cart.items.map((service) => {
              const thumb = service?.gallery?.[0]?.url;
              return (
                <div
                  key={service.id}
                  className="bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden hover:shadow-2xl transition-shadow duration-300"
                >
                  <div className="relative w-full aspect-2/1 overflow-hidden rounded-lg">
                    <Img
                      src={thumb}
                      alt={service?.title ?? 'Service'}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={service?.slug ? `/services/category/${service.slug}` : '#'}
                          className="block text-base sm:text-lg font-semibold text-slate-900 truncate hover:underline"
                          title={service?.title}
                        >
                          {service?.title ?? 'Service'}
                        </Link>
                      </div>
                      <button
                        onClick={() => removeFromCart(service.id)}
                        disabled={busy === service.id}
                        className="p-2 rounded-md hover:bg-red-50 border border-transparent hover:border-red-200 text-red-600 disabled:opacity-60"
                        title="Remove"
                        aria-label="Remove from cart"
                      >
                        {busy === service.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <Button
                      href={`/services/category/${service?.slug ?? ''}`}
                      className="mt-3 sm:mt-4 w-full"
                      name="View Service"
                      aria-label="View service"
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
