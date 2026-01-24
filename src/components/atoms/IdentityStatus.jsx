import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Tooltip from './Tooltip';

const IdentityStatus = ({ user, size }) => {
    const t = useTranslations('Profile.accountVerification');
    const isVerified = user?.isIdentityVerified;
    const iconClass = size === 'sm' ? 'h-4 w-4' : "h-5 w-5";

    if (!user) return null;

    return (
        <Tooltip text={isVerified ? t('verifiedTooltip') : t('unverifiedTooltip')}>
            <div className={`flex items-center ${isVerified ? 'text-blue-600' : 'text-red-600'}`}>
                {isVerified ? (
                    <CheckCircle2 className={iconClass} />
                ) : (
                    <AlertCircle className={iconClass} />
                )}
            </div>
        </Tooltip>
    );
};

export default IdentityStatus;