'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Trash2, Minus, Plus, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import NoResults from '@/components/common/NoResults';
import Img from '@/components/atoms/Img';
import Button from '@/components/atoms/Button';

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(null);
  const [busy, setBusy] = useState (null); // itemId currently mutating
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState (null);

  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/cart');
      const items = data?.items ?? data?.data?.items ?? [];
      setCart({
        id: data?.id ?? data?.data?.id ?? '',
        items,
        total: data?.total ?? data?.data?.total ?? undefined,
      });
    } catch (e ) {
      setError(e?.response?.data?.message ?? 'Failed to load cart');
      setCart({ id: '', items: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const currency = (n ) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n || 0);

  const lineTotal = (item ) => {
    const base = parseFloat(String(item.priceSnapshot ?? 0)) || 0;
    const extras = (item.extraServices ?? []).reduce(
      (s , x ) => s + (Number(x.price) || 0),
      0
    );
    return (base + extras) * (item.quantity || 1);
  };

  const grandTotal = useMemo(() => {
    if (!cart?.items?.length) return 0;
    return cart.items.reduce((sum, it) => sum + lineTotal(it), 0);
  }, [cart]);

  const updateQty = async (item , nextQty ) => {
    if (nextQty < 1) return;
    setBusy(item.id);
    setError(null);

    // optimistic
    const prev = cart;
    const optimistic = {
      ...cart,
      items: cart.items.map((it ) => (it.id === item.id ? { ...it, quantity: nextQty } : it)),
    };
    setCart(optimistic);

    try {
      await api.put(`/cart/item/${item.id}`, {
        quantity: nextQty,
        extraServices: item.extraServices ?? [],
      });
    } catch (e ) {
      setCart(prev || null);
      setError(e?.response?.data?.message ?? 'Failed to update quantity');
    } finally {
      setBusy(null);
    }
  };

  const removeItem = async (itemId ) => {
    setBusy(itemId);
    setError(null);

    const prev = cart;
    const optimistic = {
      ...cart,
      items: cart.items.filter((it ) => it.id !== itemId),
    };
    setCart(optimistic);

    try {
      await api.delete(`/cart/item/${itemId}`);
    } catch (e ) {
      setCart(prev || null);
      setError(e?.response?.data?.message ?? 'Failed to remove item');
    } finally {
      setBusy(null);
    }
  };

  const clearCart = async () => {
    if (!cart?.items?.length) return;
    setClearing(true);
    setError(null);

    const prev = cart;
    setCart({ ...cart, items: [] });

    try {
      await api.delete('/cart');
    } catch (e ) {
      setCart(prev || null);
      setError(e?.response?.data?.message ?? 'Failed to clear cart');
    } finally {
      setClearing(false);
    }
  };

  /* ============================ Skeletons (match components) ============================ */

  const SkeletonCard = () => (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden">
      <div className="relative w-[calc(100%-15px)] mx-[7.5px] mt-[7.5px] rounded-lg overflow-hidden">
        <div className="aspect-[4/3] shimmer rounded-lg" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-5 w-2/3 shimmer rounded" />
        <div className="h-4 w-1/3 shimmer rounded" />
        <div className="h-10 w-full shimmer rounded" />
      </div>
    </div>
  );

  const SkeletonSummary = () => (
    <div className="rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="h-6 w-1/2 shimmer rounded mb-3" />
      <div className="space-y-2">
        <div className="h-4 w-full shimmer rounded" />
        <div className="h-4 w-5/6 shimmer rounded" />
        <div className="h-4 w-4/6 shimmer rounded" />
      </div>
      <hr className="my-3" />
      <div className="h-6 w-2/3 shimmer rounded" />
      <div className="h-10 w-full shimmer rounded mt-4" />
    </div>
  );

  const SkeletonHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div className="space-y-2">
        <div className="h-7 w-40 shimmer rounded" />
        <div className="h-4 w-64 shimmer rounded" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-28 shimmer rounded" />
        <div className="h-10 w-40 shimmer rounded" />
      </div>
    </div>
  );

  const hasItems = !!cart?.items?.length;

  return (
    <div className="bg-white py-8 sm:py-12 px-4 sm:px-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        {loading ? (
          <SkeletonHeader />
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">My Cart</h1>
              <p className="text-slate-600">Review your services and proceed to checkout.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {hasItems && (
                <Button
                  name={clearing ? 'Clearing…' : 'Clear Cart'}
                  color="red"
                  onClick={clearCart}
                  disabled={clearing}
                  className="!w-fit !px-4"
                  aria-label="Clear cart"
                />
              )}
              <Button
                name={'Continue Shopping'}
                color="secondary"
                href={'/services'}
                disabled={clearing}
                className="!w-fit !px-4"
                aria-label="Continue shopping"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
            <div className="md:col-span-1 mt-6 md:mt-0">
              <SkeletonSummary />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !hasItems && (
          <NoResults
            mainText="Your cart is empty"
            additionalText="Explore services and add them to your cart to see them here."
            buttonText="Explore Services"
            buttonLink="/explore"
          />
        )}

        {/* Items */}
        {!loading && hasItems && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Items grid */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
                {cart.items.map((item ) => {
                  const thumb = item?.service?.gallery?.[0]?.url;
                  const pkg = item?.packageType ?? 'Basic';
                  const basePrice = parseFloat(String(item?.priceSnapshot ?? 0)) || 0;
                  const total = lineTotal(item);

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden hover:shadow-2xl transition-shadow duration-300"
                    >
                      {/* Image keeps consistent ratio on all screens */}
                      <div className="relative w-[calc(100%-15px)] mx-[7.5px] mt-[7.5px] overflow-hidden rounded-lg">
                           <Img
                            src={thumb}
                            alt={item?.service?.title ?? 'Service'}
                            className="aspect-2/1 object-cover rounded-lg"
                          />
                       </div>

                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={
                                item?.service?.slug
                                  ? `/services/category/${item.service.slug}`
                                  : '#'
                              }
                              className="block text-base sm:text-lg font-semibold text-slate-900 truncate hover:underline"
                              title={item?.service?.title}
                            >
                              {item?.service?.title ?? 'Service'}
                            </Link>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {pkg}
                              </span>
                              <span className="text-slate-500">Unit: {currency(basePrice)}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={busy === item.id}
                            className="p-2 rounded-md hover:bg-red-50 border border-transparent hover:border-red-200 text-red-600 disabled:opacity-60"
                            title="Remove"
                            aria-label="Remove item"
                          >
                            {busy === item.id ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </button>
                        </div>

                        {/* Qty controls */}
                        <div className="mt-2 sm:mt-3 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center rounded-lg border border-slate-200 overflow-hidden">
                            <button
                              onClick={() => updateQty(item, (item.quantity || 1) - 1)}
                              disabled={busy === item.id || item.quantity <= 1}
                              className="px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 text-sm font-medium min-w-[2.5rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item, (item.quantity || 1) + 1)}
                              disabled={busy === item.id}
                              className="px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="text-xs sm:text-sm text-slate-500">Line total</div>
                            <div className="text-sm sm:text-base font-semibold">
                              {currency(total)}
                            </div>
                          </div>
                        </div>

                        <Button
                          href={`/services/category/${item?.service?.slug ?? ''}`}
                          className="mt-3 sm:mt-4 w-full"
                          name="View Service"
                          aria-label="View service"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary (not sticky on small screens, sticky on lg+) */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-28 space-y-4">
                <div className="rounded-xl border border-slate-200 p-4 shadow-sm">
                  <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Items</span>
                      <span>{cart.items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{currency(grandTotal)}</span>
                    </div>
                  </div>
                  <hr className="my-3" />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>{currency(grandTotal)}</span>
                  </div>
                  <Button
                    name={'Proceed to Checkout'}
                    disabled={clearing}
                    className="mt-4 w-full"
                    aria-label="Proceed to checkout"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
 
    </div>
  );
}
