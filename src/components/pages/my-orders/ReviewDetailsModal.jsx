'use client';
import { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Star, MessageSquare, Lock, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import api from '@/lib/axios';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const RatingBreakdown = ({ label, score }) => (
    <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-slate-500 min-w-[100px]">{label}</span>
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
                className={`h-full transition-all duration-500 ${score ? 'bg-yellow-400' : 'bg-slate-200'}`}
                style={{ width: score ? `${(score / 5) * 100}%` : '0%' }}
            />
        </div>
        <span className="text-xs font-bold text-slate-700 w-4">{score ?? '-'}</span>
    </div>
);

const ReviewContent = ({ text }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const t = useTranslations('MyOrders.modals.feedback');
    if (!text) return <p className="text-slate-400 italic text-sm">{t('noFeedback')}</p>;

    const shouldTruncate = text.length > 300;
    const display = isExpanded ? text : `${text.substring(0, 300)}...`;

    return (
        <div className="text-sm text-slate-600 leading-relaxed">
            <div className={`transition-all duration-300 ${isExpanded ? 'max-h-60 overflow-y-auto pr-2 custom-scrollbar' : 'max-h-none'}`}>
                {shouldTruncate ? display : text}
            </div>
            {shouldTruncate && (
                <button onClick={() => setIsExpanded(!isExpanded)} className="mt-2 text-main-600 font-bold hover:underline">
                    {isExpanded ? t('showLess') : t('showMore')}
                </button>
            )}
        </div>
    );
};

const RatingStars = ({ score }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`w-3.5 h-3.5 ${s <= score ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
        ))}
    </div>
);

export default function ReviewDetailsModal({ open, onClose, orderId }) {
    const t = useTranslations('MyOrders.modals.feedback');
    const [rating, setRating] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuth()
    const isBuyer = user?.role === 'buyer';
    useEffect(() => {
        if (!orderId || !open) {
            setRating(null);
            setError(null);
            return;
        }
        const fetchRating = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/ratings/order/${orderId}`);
                setRating(data);
            } catch (err) {
                setError(err?.response?.data?.message || t('error'));
            } finally {
                setLoading(false);
            }
        };
        fetchRating();
    }, [open, orderId]);

    if (!open) return null;

    const renderSection = (type) => {
        const isOwner = (type === 'buyer' && isBuyer) || (type === 'seller' && !isBuyer);
        const hasRated = type === 'buyer' ? !!rating?.buyer_rated_at : !!rating?.seller_rated_at;
        const canSeeData = rating?.isPublic || isOwner;

        return (
            <div className="group p-5 rounded-2xl border border-slate-100 bg-white hover:border-main-100 transition-colors shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-50">
                    <span className="text-[10px] font-black uppercase text-slate-400">
                        {type === 'buyer' ? t('sellerReview') : t('buyerReview')}
                    </span>
                    {hasRated && canSeeData ? (
                        <RatingStars score={type === 'buyer' ? rating.buyer_total_score : rating.seller_total_score} />
                    ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold">
                            {!hasRated ? rating?.isPublic ? t('notRate') : t('notRatedYet') : t('hiddenStatus')}
                        </span>
                    )}
                </div>

                {!hasRated ? (
                    <div className="py-4 text-center border-2 border-dashed border-slate-100 rounded-xl">
                        <p className="text-sm text-slate-400 mb-2">{rating?.isPublic ? t('noFeedback') : t('noFeedbackYet')}</p>
                        {isOwner && (
                            <Link href={`/my-orders/${orderId}/feedback`} className="inline-flex items-center gap-1 text-xs font-bold text-main-600 hover:underline">
                                <ExternalLink className="w-3 h-3" /> {t('rateNow')}
                            </Link>
                        )}
                    </div>
                ) : !canSeeData ? (
                    <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                        <Lock className="w-5 h-5 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 px-6">{t('hiddenUntilPublic')}</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-4 bg-slate-50/50 p-3 rounded-xl">
                            {type === 'buyer' ? (
                                <>
                                    <RatingBreakdown label={t('dimensions.quality')} score={rating.buyer_rating_quality} />
                                    <RatingBreakdown label={t('dimensions.communication')} score={rating.buyer_rating_communication} />
                                    <RatingBreakdown label={t('dimensions.skills')} score={rating.buyer_rating_skills} />
                                    <RatingBreakdown label={t('dimensions.availability')} score={rating.buyer_rating_availability} />
                                    <RatingBreakdown label={t('dimensions.cooperation')} score={rating.buyer_rating_cooperation} />
                                </>
                            ) : (
                                <>
                                    <RatingBreakdown label={t('dimensions.communication')} score={rating.seller_rating_communication} />
                                    <RatingBreakdown label={t('dimensions.cooperation')} score={rating.seller_rating_cooperation} />
                                    <RatingBreakdown label={t('dimensions.availability')} score={rating.seller_rating_availability} />
                                    <RatingBreakdown label={t('dimensions.clarity')} score={rating.seller_rating_clarity} />
                                    <RatingBreakdown label={t('dimensions.payment')} score={rating.seller_rating_payment} />
                                </>
                            )}
                        </div>
                        <ReviewContent text={type === 'buyer' ? rating.buyer_review_text : rating.seller_review_text} />
                    </>
                )}
            </div>
        );
    };

    return (
        <Modal title={t('title')} onClose={onClose} className="!max-w-2xl">
            <div className="p-6">
                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-40 bg-slate-100 rounded-xl" />
                        <div className="h-40 bg-slate-100 rounded-xl" />
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <p className="text-red-600 font-medium">{error}</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {!rating?.isPublic && (
                            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 flex gap-3 items-start">
                                <div className="flex-shrink-0 p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <div className="space-y-1">
                                    <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">
                                        {t('privacyNote.title')}
                                    </h5>
                                    <p className="text-[11px] leading-relaxed text-slate-500">
                                        {t('privacyNote.description')}
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-main-50 rounded-lg"><MessageSquare className="w-5 h-5 text-main-600" /></div>
                            <div>
                                <h4 className="font-bold text-slate-900">{t('header')}</h4>
                                <p className="text-xs text-slate-500">Order ID: {orderId}</p>
                            </div>
                        </div>
                        {renderSection('buyer')}
                        {renderSection('seller')}
                    </div>
                )}
            </div>
        </Modal>
    );
}