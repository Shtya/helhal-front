// 'use client';
// import { useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { ChevronDown, Trash, Trash2 } from 'lucide-react';

// export default function FAQSection({ className, faqs, showTitle = true, removeFaq }) {
//   const [openIndex, setOpenIndex] = useState(0);

//   const toggleFAQ = index => {
//     setOpenIndex(openIndex === index ? null : index);
//   };

//   return (
//     <section className={`w-full max-w-4xl divider px-4 ${className}`}>
//       {showTitle && <h1 className='mb-12 text-4xl max-md:text-2xl font-bold text-center text-gray-900'>FAQ's</h1>}
//       <div className='space-y-4'>
//         {faqs.map((faq, idx) => {
//           const isOpen = openIndex === idx;
//           return (
//             <motion.div
//               key={idx}
//               initial={false}
//               animate={{
//                 backgroundColor: isOpen ? '#f0fdf4' : '#ffffff',
//                 borderColor: isOpen ? '#007a5550' : '#e5e7eb',
//                 boxShadow: isOpen ? '' : '0px 2px 6px rgba(0,0,0,0.05)',
//               }}
//               transition={{ duration: 0.3 }}
//               className={`cursor-pointer shadow-inner rounded-xl border overflow-hidden ${isOpen && 'card-glow'} `}>
//               <button className={`cursor-pointer  duration-300 w-full flex justify-between items-center px-3 md:px-6 py-2 md:py-4 text-left text-base md:text-lg font-medium transition ${isOpen ? 'text-green-600' : 'text-gray-900'}`} onClick={() => toggleFAQ(idx)}>
//                 <span className={`${isOpen ? 'bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent' : ''}`}>{faq.question}</span>
//                 <div className='flex items-center gap-2'>
//                   <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
//                     <ChevronDown className={`w-6 h-6 transition ${isOpen ? 'text-green-600' : 'text-gray-500'}`} />
//                   </motion.div>
//                   {removeFaq && (
//                     <motion.button type='button' onClick={() => removeFaq(idx)} className='text-red-500 hover:text-red-700 p-1 transition-colors'>
//                       <Trash2 className='w-6 h-6 cursor-pointer ' />
//                     </motion.button>
//                   )}
//                 </div>
//               </button>

//               {/* Answer */}
//               <AnimatePresence initial={false}>
//                 {isOpen && (
//                   <motion.div key='content' initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: 'easeInOut' }} className='overflow-hidden'>
//                     <motion.p initial={{ y: -5 }} animate={{ y: 0 }} exit={{ y: -5 }} transition={{ duration: 0.3 }} className='px-6  text-sm md:text-base pb-5 text-gray-700 leading-relaxed'>
//                       {faq.answer}
//                     </motion.p>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </motion.div>
//           );
//         })}
//       </div>
//     </section>
//   );
// }

'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

const PRIMARY = '#007a55';

export default function FAQSection({ loading, className = '', faqs = [], showTitle = true, removeFaq }) {
  const [openIndex, setOpenIndex] = useState(0);
  const t = useTranslations("BecomeSeller.faqs");
  const toggleFAQ = index => setOpenIndex(openIndex === index ? null : index);

  return (
    <section className={`w-full mx-auto max-w-4xl${className}`}>
      {/* Title */}
      {showTitle && (
        <div className='mb-8 text-center'>
          <h1 className='text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900'>{t('title')}</h1>
        </div>
      )}

      {/* List */}
      <div className='space-y-3'>
        {loading ? (
          // Skeletons while loading
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="animate-pulse rounded-2xl border border-gray-200 p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))
        ) : (faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;

          return (
            <motion.div
              key={idx}
              initial={false}
              animate={{
                backgroundColor: isOpen ? '#f8fffc' : '#ffffff',
                borderColor: isOpen ? `${PRIMARY}55` : '#e5e7eb',
                boxShadow: isOpen ? '0 6px 20px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.04)',
              }}
              transition={{ duration: 0.25 }}
              className={`rounded-2xl border overflow-hidden`}>
              {/* Header */}
              <button
                type='button'
                onClick={() => toggleFAQ(idx)}
                className={`group w-full select-none px-4 md:px-6 py-3 md:py-4 text-left flex items-start justify-between gap-3 outline-none focus-visible:ring-2 rounded-2xl`}
                style={{
                  // focus ring with primary color
                  boxShadow: 'none',
                }}>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2'>
                    <span className={`text-base md:text-lg font-semibold leading-6 ${isOpen ? 'text-slate-900' : 'text-slate-900'}`}>
                      <span className={`bg-clip-text ${isOpen ? 'text-transparent' : ''}`} style={isOpen ? { backgroundImage: `linear-gradient(90deg, ${PRIMARY}, ${PRIMARY})` } : undefined}>
                        {faq.question}
                      </span>
                    </span>
                  </div>
                </div>

                <div className='flex items-center gap-2 shrink-0'>
                  {typeof removeFaq === 'function' && (
                    <motion.button
                      type='button'
                      onClick={e => {
                        e.stopPropagation();
                        removeFaq(idx);
                      }}
                      title='Remove'
                      className='hidden md:inline-flex items-center justify-center rounded-lg p-1.5 hover:bg-slate-50 transition'
                      style={{ color: '#ef4444' }}
                      whileTap={{ scale: 0.95 }}>
                      <Trash2 className='h-5 w-5' />
                    </motion.button>
                  )}

                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className='grid place-items-center rounded-lg' style={{ color: isOpen ? PRIMARY : '#64748b' }}>
                    <ChevronDown className='h-6 w-6' />
                  </motion.div>
                </div>
              </button>

              {/* Answer */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div key='content' initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: 'easeInOut' }} className='overflow-hidden'>
                    <div className='px-6 pb-5'>
                      <div className='relative overflow-hidden rounded-xl border p-4 text-sm md:text-base leading-relaxed text-slate-700 bg-white' style={{ borderColor: `${PRIMARY}22` }}>
                        {/* left accent */}
                        <span aria-hidden className='absolute left-[0px] top-0 h-full w-1 rounded-l-xl' style={{ background: PRIMARY }} />
                        {faq.answer}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        }))}

        {/* Optional: empty state (does not change logic) */}
        {faqs.length === 0 && (
          <div className='rounded-2xl border p-8 text-center text-slate-600' style={{ borderColor: '#e5e7eb' }}>
            {t('noFaqs')}
          </div>
        )}
      </div>
    </section>
  );
}
