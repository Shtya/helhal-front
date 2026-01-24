
// type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

import { cn } from "@/utils/helper";

// interface TooltipProps {
//     children: ReactNode;
//     text: string;
//     position?: TooltipPosition;
//     className?: string;
//     variant?: 'dark' | 'light' | 'primary' | 'secondary';
//     arrow?: boolean;
//     delay?: number;
// }

const Tooltip = ({
    children,
    text,
    position = 'top',
    className,
    variant = 'dark',
    arrow = true,
    delay = 0
}) => {
    const positions = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
        left: 'right-full top-1/2 -translate-y-1/2 mr-3',
        right: 'left-full top-1/2 -translate-y-1/2 ml-3',
    };

    const arrowPositions = {
        top: '-bottom-1 left-1/2 -translate-x-1/2 rotate-45',
        bottom: '-top-1 left-1/2 -translate-x-1/2 rotate-45',
        left: '-right-1 top-1/2 -translate-y-1/2 rotate-45',
        right: '-left-1 top-1/2 -translate-y-1/2 rotate-45',
    };

    const variantStyles = {
        dark: {
            bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900',
            border: 'border-gray-700',
            text: 'text-white',
            shadow: 'shadow-lg shadow-gray-500/50',
            glow: 'bg-gray-400'
        },
        light: {
            bg: 'bg-gradient-to-br from-white via-gray-50 to-white',
            border: 'border-gray-200',
            text: 'text-gray-900',
            shadow: 'shadow-lg shadow-gray-300/50',
            glow: 'bg-gray-200'
        },
        primary: {
            bg: 'bg-gradient-to-br from-primary via-primary-hover to-primary',
            border: 'border-primary-hover',
            text: 'text-white',
            shadow: 'shadow-lg shadow-primary/50',
            glow: 'bg-primary/30'
        },
        secondary: {
            bg: 'bg-gradient-to-br from-secondary via-secondary-hover to-secondary',
            border: 'border-secondary-hover',
            text: 'text-white',
            shadow: 'shadow-lg shadow-secondary/50',
            glow: 'bg-secondary/30'
        }
    };

    const styles = variantStyles[variant];

    return (
        <div className="relative inline-flex items-center group/tooltip">
            {children}

            <div
                className={cn(
                    "pointer-events-none absolute z-[9999]",
                    positions[position],
                    "opacity-0 scale-95 translate-y-1",
                    "transition-all duration-200 ease-out",
                    "group-hover/tooltip:opacity-100",
                    "group-hover/tooltip:scale-100",
                    "group-hover/tooltip:translate-y-0",
                    className
                )}
                style={{
                    transitionDelay: delay ? `${delay}ms` : '0ms'
                }}
            >
                <div className="relative flex flex-col items-center">
                    {/* Outer glow */}
                    <div className={cn(
                        "absolute -inset-1 rounded-xl blur-md opacity-0",
                        "group-hover/tooltip:opacity-100 transition-opacity duration-300",
                        styles.glow
                    )} />

                    {/* Tooltip body */}
                    <div className={cn(
                        "relative px-3.5 py-2 text-xs font-semibold",
                        "whitespace-nowrap rounded-xl border backdrop-blur-sm",
                        styles.bg,
                        styles.border,
                        styles.text,
                        styles.shadow
                    )}>
                        {/* Shine effect */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover/tooltip:translate-x-full transition-transform duration-1000" />
                        </div>

                        {/* Text content */}
                        <span className="relative z-10 drop-shadow-sm">
                            {text}
                        </span>
                    </div>

                    {/* Arrow */}
                    {arrow && (
                        <div className="relative">
                            {/* Arrow glow */}
                            <div className={cn(
                                "absolute w-3 h-3 blur-sm opacity-0",
                                "group-hover/tooltip:opacity-100 transition-opacity duration-300",
                                arrowPositions[position],
                            )} />

                            {/* Arrow shape */}
                            <div className={cn(
                                "absolute w-2.5 h-2.5 border-r border-b",
                                arrowPositions[position],
                                styles.bg,
                                styles.border
                            )} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Tooltip;