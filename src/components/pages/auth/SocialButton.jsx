import Image from 'next/image';
import { motion } from 'framer-motion';
import { localImageLoader } from '@/utils/helper';

export const SocialButton = ({ icon, text, onClick, className = '' }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className={`group cursor-pointer relative w-full flex items-center justify-center gap-2 px-4 py-3 
      rounded-2xl text-base font-semibold 
      bg-white text-gray-700 
      shadow-sm border border-gray-200 
      overflow-hidden 
      transition-all duration-300
      hover:shadow-lg hover:border-gray-300 
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-main-500 
      ${className}`}>

    <span
      className='absolute inset-0 bg-gradient-to-r from-main-400/0 via-main-100/40 to-main-400/0 
        translate-x-[-150%] group-hover:translate-x-[150%] 
        transition-transform duration-700 ease-out '
    />

    {/* Icon */}
    <div className='z-[10] flex h-5 sm:h-6 w-5 sm:w-6 items-center justify-center'>
      <Image src={icon} loader={localImageLoader} alt={`${text} Icon`} width={24} height={24} className='object-contain' priority />
    </div>

    {/* Label */}
    <span className='flex-1 relative z-10 text-wrap text-sm sm:text-base '>{text}</span>

    {/* Ripple Glow Background (subtle) */}
    <span
      className='absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 
        bg-gradient-to-r from-main-50 via-white to-main-50 
        transition-opacity duration-500'
    />
  </motion.button>
);
