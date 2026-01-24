'use client';
import { use, useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star } from 'lucide-react';
import Textarea from '@/components/atoms/Textarea';
import Button from '@/components/atoms/Button';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import z from 'zod';
import Img from '@/components/atoms/Img';

export default function FeedbackPage({ params }) {
    const { orderId } = use(params);
    const t = useTranslations('MyOrders.feedbackPage');
    const router = useRouter();
    const { user, role } = useAuth();
    const [rating, setRating] = useState(null);
    const [loading, setLoading] = useState(true);
    const isBuyer = role === 'buyer';

    useEffect(() => {
        const fetchState = async () => {
            try {
                const { data } = await api.get(`/ratings/order/${orderId}`);
                // Rule: If already public, redirect to modal view
                if (data.isPublic) {
                    router.push(`/my-orders`);
                    return;
                }
                setRating(data);
            } catch (err) {
                router.push('/my-orders');
            } finally {
                setLoading(false);
            }
        };
        fetchState();
    }, [orderId]);
    const userHasRated = isBuyer ? !!rating?.buyer_rated_at : !!rating?.seller_rated_at;
    if (loading) {
        return (
            <div className="container py-10 max-w-3xl animate-pulse">
                {/* Header Skeleton */}
                <div className="mb-8 space-y-3">
                    <div className="h-9 w-48 bg-slate-200 rounded-lg mt-3" />
                    <div className="h-4 w-64 bg-slate-100 rounded" />
                </div>

                <div className="space-y-6">
                    {/* Order Card Skeleton */}
                    <div className="h-24 w-full bg-slate-100 rounded-lg border border-slate-200" />

                    {/* Privacy Note Skeleton */}
                    <div className="h-20 w-full bg-slate-50 rounded-lg border border-slate-100" />

                    {/* Ratings Box Skeleton */}
                    <div className="bg-white p-8 rounded-lg border border-slate-200 space-y-6">
                        <div className="h-6 w-32 bg-slate-200 rounded" />
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex justify-between items-center py-2">
                                <div className="h-4 w-24 bg-slate-100 rounded" />
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <div key={s} className="w-6 h-6 bg-slate-100 rounded-full" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Review Textarea Skeleton */}
                    <div className="bg-white p-8 rounded-lg border border-slate-200 space-y-4">
                        <div className="h-6 w-32 bg-slate-200 rounded" />
                        <div className="h-32 w-full bg-slate-100 rounded-lg" />
                    </div>

                    {/* Button Skeleton */}
                    <div className="flex justify-end">
                        <div className="h-11 w-40 bg-slate-200 rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-10 max-w-3xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-slate-900 mt-3">
                    {userHasRated ? t('editFeedback') : t('giveFeedback')}
                </h1>
                <p className="text-slate-600">{t('subtitle')}</p>
            </div>
            <RatingForm
                initialData={rating}
                orderId={orderId}
            />
        </div>
    );
}

const schema = z.object({
    reviewText: z.string().trim().max(5000).optional(),
    // Ratings are validated in the state below
});

function RatingForm({ orderId, initialData }) {

    const { role } = useAuth()
    const tOrder = useTranslations('MyOrders.modals.feedback');
    const t = useTranslations('MyOrders.feedbackPage');
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter()

    // Dimensions based on Role (Rule #2 & #5)
    const dimensions = role === 'buyer'
        ? ['quality', 'communication', 'skills', 'availability', 'cooperation']
        : ['communication', 'cooperation', 'availability', 'clarity', 'payment'];

    const [ratings, setRatings] = useState(
        dimensions.reduce((acc, dim) => ({
            ...acc,
            [dim]: initialData?.[`${role}_rating_${dim}`] || 0
        }), {})
    );

    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { reviewText: initialData?.[`${role}_review_text`] || '' }
    });

    useEffect(() => {
        // 1. Reset Dimension Ratings
        const newRatings = dimensions.reduce((acc, dim) => ({
            ...acc,
            [dim]: initialData?.[`${role}_rating_${dim}`] || 0
        }), {});
        setRatings(newRatings);

        // 2. Reset React Hook Form (Review Text)
        reset({
            reviewText: initialData?.[`${role}_review_text`] || ''
        });
    }, [role, initialData, reset]);

    const reviewTextValue = watch('reviewText') || '';

    const onSubmit = async (data) => {
        // Validate that all dimensions have at least 1 star
        if (Object.values(ratings).some(v => v === 0)) {
            return toast.error(t('errorAllDimensions'));
        }

        setSubmitting(true);
        try {
            const endpoint = role === 'buyer' ? 'rate-seller' : 'rate-buyer';
            await api.post(`/ratings/order/${orderId}/${endpoint}`, {
                ...ratings,
                reviewText: data.reviewText.trim() // [2025-12-24] Remember to trim.
            });
            toast.success(t('submitSuccess'));
            router.push(`/my-orders`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error');
        } finally {
            setSubmitting(false);
        }
    };


    console.log(initialData?.order)
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">


            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">
                            {tOrder('privacyNote.title')}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            {tOrder('privacyNote.description')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-lg border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">
                    {t('ratingsTitle')}
                </h2>
                <div className="space-y-5">
                    {dimensions.map((dim) => (
                        <div key={dim} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                            <label className="text-sm font-medium text-slate-700 flex-shrink-0 w-36">
                                {tOrder(`dimensions.${dim}`)}
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRatings(prev => ({ ...prev, [dim]: star }))}
                                        className="focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 rounded"
                                    >
                                        <Star
                                            className={`w-6 h-6 cursor-pointer transition-all ${star <= ratings[dim]
                                                ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm'
                                                : 'text-slate-300 hover:text-yellow-200'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-8 rounded-lg border border-slate-200">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">
                        {t('yourReview')}
                    </h2>
                    <p className="text-sm text-slate-500">{t('reviewDescription')}</p>
                </div>
                <div className="relative">
                    <Textarea
                        {...register('reviewText')}
                        rows={6}
                        placeholder={t('placeholder')}
                        error={errors?.reviewText?.message}
                        className="w-full resize-none"
                    />
                    <div className="text-right text-xs text-slate-400 mt-2">
                        {reviewTextValue.length} / 5000
                    </div>
                </div>
            </div>

            <div className="flex justify-start pt-2">
                <Button
                    type="submit"
                    name={submitting ? t('saving') : t('submitBtn')}
                    loading={submitting}
                    className="px-12 py-2.5 !w-fit"
                />
            </div>
        </form>
    );
}