import Button from '@/components/atoms/Button';
import BecomeFreelancer from './BecomeFreelancer';

const { Pencil, ChevronRight, Paperclip } = require('lucide-react');
const { useMemo } = require('react');

export default function ProjectReview({ setCurrentStep, t, data, onEditProject, onEditJob, onBack,  onSubmit, dataAos }) {
  const hasFiles = useMemo(() => (data.attachments || []).length > 0, [data.attachments]);

  return (
    <div className='w-full p-6 rounded-2xl shadow-inner border border-slate-200 flex flex-col' data-aos={dataAos}>
      <BecomeFreelancer />

      <section className='pb-8'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h2 className='text-[22px] md:text-[24px] font-semibold text-black'>{t('review.project')}</h2>
            <p className='text-gray-700 mt-2'>{t('review.bigPicture')}</p>
          </div>
          <button type='button' onClick={onEditProject} className='p-2 rounded-md hover:bg-gray-100 transition' aria-label='Edit project section' title='Edit'>
            <Pencil className='w-4 h-4 text-gray-700' />
          </button>
        </div>

        <div className='mt-6 space-y-5'>
          <Item label={t('review.title')} value={data.title || '—'} />
          <Item label={t('review.service')} value={data.service || '—'} />
          <Item label={t('review.description')} value={data.description || '—'} />

          <div>
            <div className='flex items-center gap-2'>
              <Paperclip className='w-4 h-4 text-gray-700' />
              <div className='text-[15px] font-semibold text-black'>{t('review.attachment')}</div>
            </div>

            {hasFiles ? (
              <div className='mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {data.attachments.map((f, i) => (
                  <div key={i} className='flex items-center gap-3 rounded-xl border border-gray-200 p-3'>
                    {f.thumb ? (
                      <img src={f.thumb} alt='' className='w-16 h-12 rounded-lg object-cover flex-none border border-gray-200' />
                    ) : (
                      <div className='w-16 h-12 rounded-lg bg-gray-200 flex items-center justify-center'>
                        <Paperclip className='w-6 h-6 text-gray-400' />
                      </div>
                    )}
                    <div className='min-w-0'>
                      <div className='truncate text-sm font-medium text-gray-900'>{f.name}</div>
                      <div className='text-xs text-gray-500'>{f.size}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='mt-2 text-sm text-gray-500'>{t('review.noFiles')}</div>
            )}
          </div>
        </div>
      </section>

      <hr className='border-t border-gray-200 my-2' />

      <section className='pt-6'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h3 className='text-[22px] md:text-[24px] font-semibold text-black'>{t('review.job')}</h3>
            <p className='text-gray-700 mt-2'>{data.job?.blurb}</p>
          </div>
          <button type='button' onClick={onEditJob} className='p-2 rounded-md hover:bg-gray-100 transition' aria-label='Edit job section' title='Edit'>
            <Pencil className='w-4 h-4 text-gray-700' />
          </button>
        </div>

        <div className='mt-6 grid grid-cols-1 sm:grid-cols-2 gap-8'>
          <Item label={t('review.budget')} value={data.job?.budget ?? '—'} />
          <Item label={'Flexible Budget'} value={data.job?.flexible ?? '—'} />
          <Item label={t('review.deliverBy')} value={data.job?.deliverBy ?? '—'} />
        </div>
      </section>

      <div className='flex items-center justify-between gap-4 mt-4 '>
        <Button className='!max-w-fit' name={t('common.back')} onClick={() => setCurrentStep(prev => prev - 1)} color='secondary' />
        <Button className='!max-w-fit' name={t('review.reviewCta')} onClick={onSubmit} color='green' />
      </div>
 
    </div>
  );
}

function Item({ label, value }) {
  return (
    <div>
      <div className='text-[15px] font-semibold text-black'>{label}</div>
      <div className='text-gray-800 mt-1 leading-relaxed'>{value}</div>
    </div>
  );
}
