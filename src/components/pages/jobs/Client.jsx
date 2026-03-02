import { useMemo } from "react";
import { useTranslations } from 'next-intl';
import IdentityStatus from "@/components/atoms/IdentityStatus";
import { useAuth } from "@/context/AuthContext";
import { canViewUserProfile } from "@/utils/helper";
import { Link } from "@/i18n/navigation";

export default function Client({ name, isVerifed, subtitle, user }) {
    const id = user?.id;
    const t = useTranslations('Client');
    const { role } = useAuth()
    const canAccess = canViewUserProfile(role, user?.role);

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
                        {canAccess && id ? (<Link
                            href={`/profile/${id}`}
                            className={`text-sm font-semibold text-slate-900 dark:text-dark-text-primary flex items-center gap-2  cursor-pointer hover:underline`}
                        >
                            {name}
                        </Link>) : (
                            <div
                                className={`text-sm font-semibold text-slate-900 dark:text-dark-text-primary flex items-center gap-2 `}
                            >
                                {name}
                            </div>
                        )}
                        <IdentityStatus user={{ isVerifed }} size="sm" />
                    </div>
                    {subtitle && <div className='text-sm text-slate-500 dark:text-dark-text-secondary'>
                        {subtitle}
                    </div>}
                </div>
            </div>
        </div>
    );
}