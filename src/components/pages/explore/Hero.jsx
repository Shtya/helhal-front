import React from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/atoms/Button';

export default function Hero() {
  const cards = [
    {
      id: 'recommended',
      icon: <EnvelopeIcon />,
      title: 'Recommended for you',
      lines: ['Get matched with freelancers', 'Create a job and get custom offers'],
      buttonLabel: 'Start a Project',
			href : "/share-job-description"
    },
    {
      id: 'business',
      icon: <TrendingUpIcon />,
      title: 'Business recommendations',
      lines: ['Tailor UpPhoto to your needs', 'Tell us a bit about your business.'],
      buttonLabel: 'Complete Your Project',
			href : "/services"
    },
  ];

  return (
    <div className='relative px-6 py-12 my-12 lg:px-12 lg:py-18 text-white rounded-[30px] overflow-hidden shadow-2xl bg-gradient-to-r from-green-400 to-green-600'>
      {/* Fancy green gradient background */}
      <div className='absolute inset-0 bg-gradient-to-r from-green-300 to-green-500 opacity-50'></div>

      {/* Soft glow overlay */}
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_70%)]'></div>

      {/* Decorative blobs */}
      <div className='absolute -top-20 -left-20 h-40 w-40 rounded-full bg-green-100 opacity-30 blur-3xl'></div>
      <div className='absolute bottom-0 right-0 h-60 w-60 rounded-full bg-green-300 opacity-20 blur-3xl'></div>

      <div className='relative z-[10]'>
        <motion.h1 
          className='text-[30px] font-extrabold leading-[1.1] md:text-[50px]' 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.5 }}
        >
          Welcome back, Temur Khbulava
        </motion.h1>

        <div className='mt-10 flex items-center justify-start max-[900px]:flex-wrap gap-5'>
          {cards.map(({ id, icon, title, lines, buttonLabel , href }) => (
            <motion.section 
              key={id} 
              className='flex flex-col rounded-2xl max-w-[500px] w-full bg-white/90 backdrop-blur-[100px] p-8 text-slate-900 shadow-xl'
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className=' mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 shadow-inner border border-green-200 text-green-700 ring-1 ring-green-200'>
                {icon}
              </div>

              <motion.h2 
                className='text-2xl mb-2 font-[700]' 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                {title}
              </motion.h2>

              {lines.map((text, i) => (
                <motion.p 
                  key={i} 
                  className='text-base ltr:pl-2 rtl:pr-2' 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                >
                  {text}
                </motion.p>
              ))}

              <Button 
                name={buttonLabel} 
								href={href}
                color='green' 
                className='mt-8 py-3' 
                icon={<PlusIcon className='h-5 w-5 border border-white rounded-md p-[1px] text-white' />} 
              />
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlusIcon({ className }) {
  return (
    <svg className={className} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' aria-hidden='true'>
      <path d='M12 5v14M5 12h14' />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg width='30' height='30' viewBox='0 0 60 60' fill='none' stroke='currentColor' strokeWidth={1.8} strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <path d='M5 21.25C5 12.5 10 8.75 17.5 8.75H42.5C50 8.75 55 12.5 55 21.25V38.75C55 47.5 50 51.25 42.5 51.25H17.5' strokeWidth={4} />
      <path d='M42.5 22.5L34.675 28.75C32.1 30.8 27.875 30.8 25.3 28.75L17.5 22.5' strokeWidth={4} />
      <path d='M5 41.25H20' strokeWidth={4} />
      <path d='M5 31.25H12.5' strokeWidth={4} />
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg className='h-[30px] w-[30px]' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={1.8} strokeLinecap='round' aria-hidden='true'>
      <path d='M3 17l6-6 4 4 8-8' />
      <path d='M14 5h8v8' />
    </svg>
  );
}
