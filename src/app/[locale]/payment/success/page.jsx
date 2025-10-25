'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import Button from '@/components/atoms/Button';

async function getOrder(orderId) {
  const res = await api.get(`/orders/${orderId}`);
  return res.data;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const data = await getOrder(orderId);
        setOrder(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading) {
    return (
      <div className="container max-w-lg py-16 text-center">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-2/3 mx-auto rounded bg-slate-200" />
          <div className="h-4 w-1/2 mx-auto rounded bg-slate-200" />
          <div className="h-24 w-full rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-lg py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold text-rose-600">Order not found</h1>
        <p className="mb-6 text-slate-600">We could not retrieve your order details.</p>
        <Link href="/my-orders" className="text-emerald-700 underline">
          Go to My Orders
        </Link>
      </div >
    );
  }

  return (
    <div className="container max-w-2xl py-16 text-center">
      {/* Success banner */}
      <div className="mx-auto mb-8 w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <span className="text-4xl">🎉</span>
      </div>

      <h1 className="mb-3 text-3xl font-bold text-emerald-600">Payment Successful</h1>
      <p className="mb-10 text-slate-700">Your order has been created and marked as paid.</p>

      {/* Order summary */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 text-left space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Order Summary</h2>
        <p><span className="font-medium">Order ID:</span> {order.id}</p>
        <p><span className="font-medium">Title:</span> {order.title}</p>
        <p><span className="font-medium">Amount:</span> {order.totalAmount} {order.invoices?.[0]?.currencyId || 'USD'}</p>
        <p><span className="font-medium">Status:</span> <span className="text-emerald-600">{order.status}</span></p>
        <p><span className="font-medium">Buyer:</span> {order.buyer?.username}</p>
        <p><span className="font-medium">Seller:</span> {order.seller?.username}</p>
        <p><span className="font-medium">Invoice:</span> {order.invoices?.[0]?.invoiceNumber}</p>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col  sm:flex-row justify-center gap-4">
        <Link href="/orders">
          <Button name="Go to My Orders" color="green" />
        </Link>
        <Link href="/">
          <Button name="Back to Home" color="secondary" />
        </Link>
      </div>
    </div>
  );
}
