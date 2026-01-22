import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

const IdentityStatus = ({ user, size }) => {

    const t = useTranslations('Profile.accountVerification');
    const isVerified = user?.isIdentityVerified;
    const className = size === 'sm' ? 'h-4 w-4' : "h-5 w-5";
    if (!user) return null;
    return (
        <div className="relative group flex items-center w-fit">
            {/* The Icon Badge */}
            <div className={`flex items-center gap-2 ${isVerified ? 'text-blue-600' : 'text-red-600'}`}>
                {isVerified ? (
                    <CheckCircle2 className={className} />
                ) : (
                    <AlertCircle className={className} />
                )}
            </div>

            {/* Custom Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center">
                <div className="relative z-10 p-2 text-xs leading-none text-white whitespace-nowrap bg-gray-800 rounded shadow-lg">
                    {isVerified ? t('verifiedTooltip') : t('unverifiedTooltip')}
                </div>
                {/* Tooltip Arrow */}
                <div className="w-3 h-3 -mt-2 rotate-45 bg-gray-800"></div>
            </div>
        </div>
    );
};

export default IdentityStatus;