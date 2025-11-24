import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useTranslations } from 'next-intl';


export default function Client({ name, subtitle, id }) {
    const t = useTranslations('Client');
    const router = useRouter()
    const Initials = useMemo(
        () =>
            (name || '?')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map(p => p[0]?.toUpperCase())
                .join(''),
        [name],
    );

    function handleOnClick() {
        router?.push(`/profile/${id}`)
    }
    return (
        <div>
            <h4 className='text-sm font-semibold text-slate-900 mb-2'>{t('aboutTheClient')}</h4>
            <div className='mt-1 flex items-center gap-3'>
                <div className='grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200'>
                    <span className='text-sm font-semibold'>{Initials}</span>
                </div>
                <div>
                    <div className={`text-sm font-semibold text-slate-900 flex items-center gap-2 
                        ${id && 'cursor-pointer hover:underline'}`} onClick={handleOnClick}>{name}</div>
                    <div className='text-sm text-slate-500'>{subtitle}</div>
                </div>
            </div>
        </div>
    );
}