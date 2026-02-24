import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useTranslations } from 'next-intl';
import IdentityStatus from "@/components/atoms/IdentityStatus";

export default function Client({ name, isVerifed, subtitle, id }) {
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
        if (id) router?.push(`/profile/${id}`)
    }

    return (
        <div>
            <h4 className='text-sm font-semibold text-slate-900 dark:text-dark-text-primary mb-2'>
                {t('aboutTheClient')}
            </h4>
            <div className='mt-1 flex items-center gap-3'>
                {/* Avatar Fallback */}
                <div className='grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-dark-bg-input text-slate-700 dark:text-dark-text-primary ring-1 ring-slate-200 dark:ring-dark-border'>
                    <span className='text-sm font-semibold'>{Initials}</span>
                </div>

                <div>
                    <div className="flex gap-2 items-center">
                        <div
                            className={`text-sm font-semibold text-slate-900 dark:text-dark-text-primary flex items-center gap-2 
                            ${id && 'cursor-pointer hover:underline'}`}
                            onClick={handleOnClick}
                        >
                            {name}
                        </div>
                        <IdentityStatus user={{ isVerifed }} size="sm" />
                    </div>
                    <div className='text-sm text-slate-500 dark:text-dark-text-secondary'>
                        {subtitle}
                    </div>
                </div>
            </div>
        </div>
    );
}