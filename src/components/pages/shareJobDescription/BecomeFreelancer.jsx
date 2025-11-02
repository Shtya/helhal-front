import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

const BecomeFreelancer = () => {
  const t = useTranslations('createProject');



  return (
    <div className=' gradient text-lg max-md:text-base flex items-center justify-between gap-2 p-4 rounded-xl '>
      <span className='text-white' > {t("banner.q")} </span>
      <Link href={"/become-seller"} className='hover:underline cursor-pointer flex items-center gap-1 text-white stroke-white ' >
        {t("banner.cta")}
        <ChevronRight className='mt-[2px] ' size={18} />

      </Link>
    </div>
  );
};

export default BecomeFreelancer;
