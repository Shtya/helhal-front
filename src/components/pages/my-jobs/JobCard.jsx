import { useMemo } from "react";
import PriceTag from '@/components/atoms/priceTag';
import AttachmentList from '@/components/common/AttachmentList';
import { User2, Trash2, FolderOpen } from 'lucide-react';
import { Divider } from "@/app/[locale]/services/[category]/[service]/page";
import Button from "@/components/atoms/Button";

// -------------------------------------------------
// Visual Tokens (light mode only)
// -------------------------------------------------
const chip = 'inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700';

const cardBase = ' !bg-gray-50/50 group relative overflow-hidden rounded-2xl border border-gray-200 bg-white  ring-1 ring-black/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-[2px]';

const getStatusStyles = status => {
    switch (status) {
        case 'published':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        // case 'draft':
        //   return 'bg-slate-50 text-slate-700 border-slate-200';
        case 'awarded':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'completed':
            return 'bg-purple-50 text-purple-700 border-purple-200';
        default:
            return 'bg-slate-50 text-slate-700 border-slate-200';
    }
};

const JobCard = ({ job, onDeleteRequest }) => {
    const created = useMemo(() => job?.created_at?.split('T')[0] ?? '—', [job?.created_at]);

    const postedAgo = useMemo(() => {
        if (!job?.created_at) return '—';
        const createdTs = new Date(job.created_at).getTime();
        const diffMs = Date.now() - createdTs;
        const mins = Math.floor(diffMs / 60000);
        if (mins < 60) return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        const days = Math.floor(hours / 24);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }, [job?.created_at]);

    const priceTypeLabel = job?.budgetType === 'hourly' ? 'Hourly' : 'Fixed price';

    const shortAdditional = useMemo(() => {
        if (!job?.additionalInfo) return null;
        const t = job.additionalInfo.trim();
        return t.length > 140 ? `${t.slice(0, 140).trim()}…` : t;
    }, [job?.additionalInfo]);

    return (
        <article className={`${cardBase} flex flex-col justify-between overflow-hidden`}>
            <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-500 opacity-80"></div>
            {/* Top content */}
            <div className="p-6 sm:p-7">
                {/* Header */}
                <header className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">{job.title}</h3>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            {/* replaced created + raw budget with budgetType + postedAgo */}
                            <div className="inline-flex items-center gap-2">
                                <span className="text-slate-700 font-medium">{priceTypeLabel}</span>
                                <span className="text-slate-400">•</span>
                                <span className="tabular-nums text-slate-500">{postedAgo}</span>
                            </div>

                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`${chip} ${getStatusStyles(job.status)} text-xs uppercase tracking-wide`} aria-hidden>
                            <span className="h-2 w-2 rounded-full bg-current opacity-80 [color:currentColor]" />
                            <span className="ml-2 capitalize">{job.status}</span>
                        </span>

                        <div className="text-xs text-slate-400">{job?.preferredDeliveryDays || 0} Delivery Days</div>
                    </div>
                </header>

                {/* Description */}
                {job.description ? (
                    <p className="mt-4 text-sm text-slate-600 leading-6 line-clamp-4">{job.description}</p>
                ) : (
                    <p className="mt-4 text-sm text-slate-400 italic">No description provided</p>
                )}

                {/* Additional info (small snippet) */}
                {shortAdditional && (
                    <div className="mt-3">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Extra details</div>
                        <p className="text-sm text-slate-600 leading-6 line-clamp-3">{shortAdditional}</p>
                    </div>
                )}

                {/* Skills */}
                {job?.skillsRequired?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {job.skillsRequired.slice(0, 8).map((s, idx) => (
                            <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
                                {s}
                            </span>
                        ))}
                        {job.skillsRequired.length > 8 && (
                            <span className="text-xs px-2.5 py-1 rounded-full text-slate-500">+{job.skillsRequired.length - 8}</span>
                        )}
                    </div>
                )}

                {/* Attachments (compact) */}
                {Array.isArray(job?.attachments) && job.attachments.length > 0 && (
                    <div className="mt-5">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                    <FolderOpen className="h-4 w-4" /> <span>Attachments</span>
                                </div>
                                <div className="text-xs text-slate-500">{job.attachments.length} file{job.attachments.length > 1 ? 's' : ''}</div>
                            </div>

                            <AttachmentList
                                attachments={job.attachments}
                                className=""
                                variant='list'
                                cnAttachment=""
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer actions */}
            <footer className="border-t border-slate-100 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
                {/* Left: budget display (replaces textual 'Cancel') */}
                <div className="flex flex-col items-start">
                    <div className="flex items-baseline gap-2">
                        <div className="text-lg font-semibold text-slate-900">
                            <PriceTag color="green" price={job.budget} />
                            {job.budgetType === 'hourly' && <span className="ml-1 text-sm text-slate-600">/hr</span>}
                        </div>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{priceTypeLabel}</div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-3">
                    {/* delete as icon-only control (compact) */}
                    <button
                        type="button"
                        title="Delete job"
                        aria-label="Delete job"
                        onClick={() => onDeleteRequest(job.id)}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-md text-rose-600 hover:bg-rose-50 border border-transparent"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                    <Button href={`/my-jobs/${job.id}/proposals`} name={`View Proposals (${job.proposals?.length || 0})`} className="min-w-[160px] opacity-90" />
                </div>
            </footer>

            {/* Focus ring */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5 transition-opacity group-hover:opacity-100" />
        </article>
    );
};


export default JobCard


// -------------------------------------------------
// Skeleton Loader (light mode)
// -------------------------------------------------
export const JobSkeleton = () => (
    <div className={`${cardBase} flex flex-col justify-between`}>


        {/* Top Content */}
        <div className='p-6 sm:p-7 !pb-10'>
            {/* Title + Status */}
            <header className='flex items-start justify-between gap-3'>
                <div className='h-8 w-2/3 rounded bg-slate-200' />
                <div className='h-6 w-24 rounded-full bg-slate-200' />
            </header>

            {/* Description */}
            <div className='mt-3 space-y-2'>
                <div className='h-4 w-full rounded bg-slate-200' />
                <div className='h-4 w-5/6 rounded bg-slate-200' />
            </div>

            {/* Skills & Budget */}
            <div className='mt-5 space-y-3'>
                <div className='flex gap-2'>
                    {[1, 2, 3].map(i => (
                        <div key={i} className='h-6 w-20 rounded-full bg-slate-200' />
                    ))}
                </div>
                <div className='flex flex-wrap items-center gap-3'>
                    <div className='h-6 w-24 rounded-full bg-slate-200' />
                    <div className='h-6 w-32 rounded-full bg-slate-200' />
                </div>
            </div>

            <Divider className='!my-6' />

            {/* Attachments */}
            <div className='mt-5 rounded-xl border border-slate-200 p-3'>
                <div className='mb-2 flex items-center gap-2'>
                    <div className='h-4 w-24 rounded bg-slate-200' />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                    <div className='h-20 rounded bg-slate-200' />
                    <div className='h-20 rounded bg-slate-200' />
                </div>
            </div>
        </div>

        {/* Footer */}
        <footer className='m-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-white px-3 py-3 ring-1 ring-slate-200'>
            <div className='h-9 w-40 rounded bg-slate-200' />
            <div className='h-9 w-24 rounded bg-slate-200' />
        </footer>
    </div>
);