import { motion } from 'framer-motion';

export default function TableEmptyState({ title = 'No results found', subtitle = 'Try adjusting filters, clearing search, or changing the date range.', onResetFilters, onReload }) {
    return (
        <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className='flex flex-col items-center justify-center py-12' aria-live='polite'>
            <div className='relative'>
                <div className='absolute -inset-3 rounded-full bg-emerald-100/40 blur-md' />
                <div className='relative h-14 w-14 rounded-2xl bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center'>
                    <svg viewBox='0 0 24 24' className='h-7 w-7 text-emerald-600' fill='none' stroke='currentColor' strokeWidth='2'>
                        <path d='M21 21l-4.35-4.35' />
                        <circle cx='10' cy='10' r='7' />
                    </svg>
                </div>
            </div>
            <h3 className='mt-4 text-base font-semibold text-slate-800'>{title}</h3>
            <p className='mt-1 text-sm text-slate-500 text-center max-w-md'>{subtitle}</p>
            {(onResetFilters || onReload) && (
                <div className='mt-4 flex items-center gap-2'>
                    {onResetFilters && <button className='inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50'>Clear filters</button>}
                    {onReload && <button className='inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700'>Reload</button>}
                </div>
            )}
        </motion.div>
    );
}