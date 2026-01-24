import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';
import Tooltip from './Tooltip';
import { cn } from '@/utils/helper';

// interface TopRatedBadgeProps {
//     isTopRated: boolean;
//     variant?: 'default' | 'compact' | 'premium';
//     animated?: boolean;
//     className?: string;
// }

const TopRatedBadge = ({
    isTopRated,
    variant = 'default',
    size = 'default', // Added size prop: 'default' | 'sm' | 'xs'
    animated = true,
    className
}) => {
    const t = useTranslations('Profile');

    if (!isTopRated) return null;

    // Logic to determine if text should be hidden (sm and xs are icon-only)
    const isIconOnly = size === 'sm' || size === 'xs';

    return (
        <Tooltip text={t('page.topRatedBadge')} position="top">
            <div className={cn("relative inline-flex items-center", className)}>

                {/* Main Badge */}
                <div className={cn(
                    "relative z-10 flex items-center gap-1.5 rounded-full shadow-xl",
                    "transition-all duration-300",
                    "group-hover/tooltip:scale-105 group-hover/tooltip:shadow-2xl",
                    getBadgeStyles(variant)
                )}>
                    {/* Shine effect overlay */}
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent",
                            "transform -translate-x-full",
                            animated && "group-hover/tooltip:translate-x-full transition-transform duration-1000"
                        )} />
                    </div>

                    {/* Inner gradient border */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200/60 via-transparent to-amber-200/60" />

                    {/* Content Container with size-based padding */}
                    <div className={cn(
                        "relative flex items-center gap-1.5",
                        size === 'default' && "px-3.5 py-1.5",
                        size === 'sm' && "p-1.5",
                        size === 'xs' && "p-1"
                    )}>
                        {/* Star Icon with size-based dimensions */}
                        <div className="relative">
                            <Star className={cn(
                                "fill-white text-white drop-shadow-md",
                                "transition-transform duration-300",
                                "group-hover/tooltip:rotate-[360deg] group-hover/tooltip:scale-110",
                                size === 'default' && "h-3.5 w-3.5 sm:h-4 sm:w-4",
                                size === 'sm' && "h-3 w-3",
                                size === 'xs' && "h-2.5 w-2.5"
                            )} />

                            {/* Star sparkle effect */}
                            {animated && (
                                <>
                                    <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-white rounded-full animate-ping opacity-75" />
                                    <div className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-yellow-100 rounded-full animate-ping opacity-60"
                                        style={{ animationDelay: '0.5s' }} />
                                </>
                            )}
                        </div>

                        {/* Text - Only shown for default size */}
                        {!isIconOnly && (
                            <span className={cn(
                                "font-bold tracking-wide drop-shadow-md text-white",
                                variant === 'compact' ? "text-[10px]" : "text-[10px] sm:text-xs"
                            )}>
                                {t('page.topRated')}
                            </span>
                        )}

                        {/* Sparkle accent - Only shown for default size */}
                        {!isIconOnly && (
                            <div className="relative w-1 h-1">
                                <div className="absolute inset-0 bg-yellow-100 rounded-full" />
                                <div className={cn(
                                    "absolute -inset-0.5 bg-yellow-100 rounded-full",
                                    animated && "animate-ping opacity-75"
                                )} />
                            </div>
                        )}
                    </div>

                    {/* Floating particles (premium variant) */}
                    {variant === 'premium' && animated && (
                        <>
                            <div className="absolute -top-1 left-1/4 w-1 h-1 bg-yellow-200 rounded-full animate-bounce opacity-60"
                                style={{ animationDelay: '0s', animationDuration: '2s' }} />
                            <div className="absolute -top-1 right-1/4 w-1 h-1 bg-amber-200 rounded-full animate-bounce opacity-60"
                                style={{ animationDelay: '0.5s', animationDuration: '2.5s' }} />
                            <div className="absolute -bottom-1 left-1/3 w-0.5 h-0.5 bg-yellow-300 rounded-full animate-bounce opacity-40"
                                style={{ animationDelay: '1s', animationDuration: '3s' }} />
                        </>
                    )}

                    {/* Corner accent dots - Only shown for default size */}
                    {!isIconOnly && (
                        <div className="absolute -top-0.5 -right-0.5 flex gap-0.5">
                            <div className={cn(
                                "w-1.5 h-1.5 bg-yellow-200 rounded-full",
                                animated && "animate-pulse"
                            )} />
                        </div>
                    )}
                </div>

                {/* Trailing glow effect */}
                <div className={cn(
                    "absolute -inset-2 rounded-full opacity-0",
                    "bg-gradient-to-r from-transparent via-yellow-300/20 to-transparent",
                    "group-hover/tooltip:opacity-100 blur-xl transition-opacity duration-500"
                )} />
            </div>
        </Tooltip>
    );
};
//variant: 'default' | 'compact' | 'premium'
// Helper function for variant styles
function getBadgeStyles(variant) {
    const baseStyles = "bg-gradient-to-br border";

    const variants = {
        default: cn(
            baseStyles,
            "from-amber-400 via-yellow-500 to-amber-600",
            "border-yellow-200/50"
        ),
        compact: cn(
            baseStyles,
            "from-amber-500 via-yellow-600 to-amber-700",
            "border-yellow-300/40"
        ),
        premium: cn(
            baseStyles,
            "from-amber-300 via-yellow-400 to-amber-500",
            "border-yellow-100/60",
            "shadow-[0_0_20px_rgba(251,191,36,0.5)]"
        )
    };

    return variants[variant];
}

export default TopRatedBadge;