import { useMemo } from "react";
import { useTranslations } from 'next-intl';
import PriceTag from '@/components/atoms/priceTag';
import AttachmentList from '@/components/common/AttachmentList';
import { User2, Trash2, FolderOpen } from 'lucide-react';
import { Divider } from "@/app/[locale]/services/[category]/[service]/page";
import Button from "@/components/atoms/Button";
import { getDateAgo } from "@/utils/date";
import StatusBadge from "../jobs/StatusBadge";

// -------------------------------------------------
// Visual Tokens (light mode only)
// -------------------------------------------------
const chip = 'inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700';
const cardBase =
    'group relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:bg-dark-bg-card/60 ring-1 ring-black/5 dark:ring-dark-border t dark:border-dark-border ransition-all duration-300 hover:shadow-xl hover:-translate-y-[2px]';

const getStatusStyles = (status) => {
    switch (status) {
        case 'published':
            return 'bg-main-50 text-main-700 border-main-200 dark:bg-main-900 dark:text-main-400 dark:border-main-700';
        case 'awarded':
            return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-400 dark:border-blue-700';
        case 'completed':
            return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-400 dark:border-purple-700';
        default:
            return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-dark-bg-card dark:text-dark-text-secondary dark:border-dark-border';
    }
};

const JobCard = ({ job, onDeleteRequest, onOpen }) => {
    const t = useTranslations('JobCard');

    const created = useMemo(() => job?.created_at?.split('T')[0] ?? '—', [job?.created_at]);
    const postedAgo = useMemo(() => getDateAgo(job?.created_at), [job?.created_at]);
    const priceTypeLabel = job?.budgetType === 'hourly' ? t('hourly') : t('fixedPrice');

    const shortAdditional = useMemo(() => {
        if (!job?.additionalInfo) return null;
        const text = job.additionalInfo.trim();
        return text.length > 140 ? `${text.slice(0, 140)}…` : text;
    }, [job?.additionalInfo]);

    return (
        <article className={`${cardBase} flex flex-col justify-between relative group`}>
            {/* Gradient top bar */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-500 opacity-80 rounded-t-xl" />

            {/* Content */}
            <div className="p-6 sm:p-7">
                {/* Header */}
                <header className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h3
                            className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-dark-text-primary truncate hover:underline cursor-pointer transition-colors duration-200"
                            onClick={onOpen}
                        >
                            {job.title}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-dark-text-secondary">
                            <div className="inline-flex items-center gap-2">
                                <span className="text-slate-700 dark:text-dark-text-primary font-medium">{priceTypeLabel}</span>
                                <span className="text-slate-400 dark:text-dark-text-secondary">•</span>
                                <span className="tabular-nums text-slate-500 dark:text-dark-text-secondary">{postedAgo}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <StatusBadge status={job.status} />
                        <div className="text-xs text-slate-400 dark:text-dark-text-secondary">
                            {job?.preferredDeliveryDays || 0} {t('deliveryDays')}
                        </div>
                    </div>
                </header>

                {/* Description */}
                <p className={`mt-4 text-sm leading-6 ${job.description ? 'text-slate-600 dark:text-dark-text-primary' : 'text-slate-400 dark:text-dark-text-secondary italic'}`}>
                    {job.description || t('noDescription')}
                </p>

                {/* Additional info */}
                {shortAdditional && (
                    <div className="mt-3">
                        <div className="text-xs font-semibold mb-1 text-slate-500 dark:text-dark-text-secondary">{t('extraDetails')}</div>
                        <p className="text-sm text-slate-600 dark:text-dark-text-primary leading-6 line-clamp-3">{shortAdditional}</p>
                    </div>
                )}

                {/* Skills */}
                {job?.skillsRequired?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {job.skillsRequired.slice(0, 8).map((s, idx) => (
                            <span
                                key={idx}
                                className="text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-slate-100 text-slate-700 dark:border-dark-border dark:bg-dark-bg-card dark:text-dark-text-primary transition-colors duration-200"
                            >
                                {s}
                            </span>
                        ))}
                        {job.skillsRequired.length > 8 && (
                            <span className="text-xs px-2.5 py-1 rounded-full text-slate-500 dark:text-dark-text-secondary">+{job.skillsRequired.length - 8}</span>
                        )}
                    </div>
                )}

                {/* Attachments */}
                {Array.isArray(job?.attachments) && job.attachments.length > 0 && (
                    <div className="mt-5">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-dark-border dark:bg-dark-bg-card p-3 transition-colors duration-200">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-dark-text-primary">
                                    <FolderOpen className="h-4 w-4" />
                                    <span>{t('attachments')}</span>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-dark-text-secondary">
                                    {job.attachments.length} {job.attachments.length > 1 ? t('files') : t('file')}
                                </div>
                            </div>

                            <AttachmentList attachments={job.attachments} variant="list" />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer actions */}
            <footer className="border-t border-slate-100 dark:border-dark-border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-dark-bg-card transition-colors duration-200">
                {/* Budget */}
                <div className="flex flex-col items-start">
                    <div className="flex items-baseline gap-2">
                        <div className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary flex items-center">
                            <PriceTag color="green" price={job.budget} />
                            {job.budgetType === 'hourly' && <span className="ml-1 text-sm text-slate-600 dark:text-dark-text-secondary">/hr</span>}
                        </div>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-dark-text-secondary mt-1">{priceTypeLabel}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        title={t('deleteJob')}
                        aria-label={t('deleteJob')}
                        onClick={() => onDeleteRequest(job.id)}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 border border-transparent transition-colors duration-200"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>

                    <Button
                        href={`/my-jobs/${job.id}/proposals`}
                        name={t('viewProposals', { count: job.proposals?.length || 0 })}
                        className="min-w-[160px] opacity-90"
                    />
                </div>
            </footer>

            {/* Focus ring */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5 dark:ring-dark-border transition-opacity group-hover:opacity-100" />
        </article>
    );
};


export default JobCard


// -------------------------------------------------
// Skeleton Loader (light mode)
// -------------------------------------------------
export const JobSkeleton = () => (
    <div className={`${cardBase} flex flex-col justify-between animate-pulse relative`}>
        {/* Top accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-500 opacity-30" />

        {/* Content */}
        <div className="p-6 sm:p-7">
            {/* Header: title + status */}
            <header className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                    <div className="h-6 w-2/3 rounded bg-slate-200 dark:bg-dark-bg-base" />
                    <div className="h-4 w-48 rounded bg-slate-200 dark:bg-dark-bg-base" />
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-dark-bg-base" />
                    <div className="h-4 w-20 rounded bg-slate-200 dark:bg-dark-bg-base" />
                </div>
            </header>

            {/* Avatar + meta */}
            <div className="mt-4 flex gap-4 items-start">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-dark-bg-base flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-dark-bg-base" />
                    <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-dark-bg-base" />
                </div>
            </div>

            {/* Description */}
            <div className="mt-4 space-y-2">
                <div className="h-3 w-full rounded bg-slate-200 dark:bg-dark-bg-base" />
                <div className="h-3 w-5/6 rounded bg-slate-200 dark:bg-dark-bg-base" />
            </div>

            {/* Skills */}
            <div className="mt-4 flex flex-wrap gap-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-6 w-20 rounded-full bg-slate-200 dark:bg-dark-bg-base" />
                ))}
            </div>

            {/* Attachments block */}
            <div className="mt-5 rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg-card p-3 transition-colors duration-300">
                <div className="mb-3 flex items-center justify-between">
                    <div className="h-4 w-24 rounded bg-slate-200 dark:bg-dark-bg-base" />
                    <div className="h-4 w-12 rounded bg-slate-200 dark:bg-dark-bg-base" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 rounded bg-slate-200 dark:bg-dark-bg-base" />
                    <div className="h-16 rounded bg-slate-200 dark:bg-dark-bg-base" />
                </div>
            </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-100 dark:border-dark-border px-4 py-3 flex items-center justify-between gap-3 bg-white dark:bg-dark-bg-card transition-colors duration-300">
            <div className="flex items-center gap-3">
                <div className="h-8 w-36 rounded bg-slate-200 dark:bg-dark-bg-base" />
            </div>
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-slate-200 dark:bg-dark-bg-base" />
                <div className="h-9 w-44 rounded bg-slate-200 dark:bg-dark-bg-base" />
            </div>
        </footer>
    </div>
);