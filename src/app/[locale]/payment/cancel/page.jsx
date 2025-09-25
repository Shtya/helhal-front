'use client';
import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="container max-w-lg py-16 text-center">
      <h1 className="mb-4 text-3xl font-bold text-rose-600">Payment Canceled</h1>
      <p className="mb-8 text-slate-700">No money was charged. You can try again anytime.</p>
      <Link href="/my-jobs" className="text-rose-700 underline">
        Back to My Jobs
      </Link>
    </div>
  );
}
