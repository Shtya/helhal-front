import { useEffect, useMemo, useState } from "react";
import { useTranslations } from 'next-intl';
import { OrderStatus } from "@/constants/order";

export default function OrderDeliveryTimer({ order }) {
    const t = useTranslations('OrderDeliveryTimer');

    const [remaining, setRemaining] = useState({
        years: 0,
        months: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: false,
    });

    useEffect(() => {
        if (!order?.deliveryTime) return;

        const orderDate = order?.submissionDate || order.created_at;
        if (!orderDate) return;

        const deliveryDeadline = new Date(orderDate);
        deliveryDeadline.setDate(
            deliveryDeadline.getDate() + (order.deliveryTime)
        ); // e.g. 5 days

        const tick = () => {
            const now = new Date();
            const diff = deliveryDeadline - now;

            if (diff <= 0) {
                setRemaining(prev => ({ expired: true }));
                return;
            }

            let seconds = Math.floor(diff / 1000);
            const years = Math.floor(seconds / (365 * 24 * 60 * 60));
            seconds %= 365 * 24 * 60 * 60;

            const months = Math.floor(seconds / (30 * 24 * 60 * 60));
            seconds %= 30 * 24 * 60 * 60;

            const days = Math.floor(seconds / (24 * 60 * 60));
            seconds %= 24 * 60 * 60;

            const hours = Math.floor(seconds / 3600);
            seconds %= 3600;

            const minutes = Math.floor(seconds / 60);
            seconds %= 60;

            setRemaining({ years, months, days, hours, minutes, seconds, expired: false });
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [order?.created_at, order?.deliveryTime]);

    if (!order?.created_at || !order?.deliveryTime) return null;;

    if (order.completedAt) return null;

    const allawed = [OrderStatus.ACCEPTED, OrderStatus.DELIVERED, OrderStatus.CHANGES_REQUESTED]
    const showTime = useMemo(() => allawed.includes(order.status))
    if (!showTime) return null

    return (
        <div>
            <div className="pt-5 border-t border-slate-200">
                <p className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-1">
                    <span className="text-main-600">⏳</span> {t('timeRemaining')}
                </p>
                {remaining.expired ? (<p className="text-center text-sm text-red-600 mt-4">{t('expired')}</p>)
                    : (<div className="inline-flex items-center px-3 py-1.5">
                        <div className="flex items-center justify-center w-full gap-6 count-down-main">
                            {/* Days */}
                            <div className="timer">
                                <div className="pr-1.5 pl-2 relative bg-main-50 w-max ">
                                    <h3 className="countdown-element days font-manrope font-semibold text-2xl text-main-600 tracking-[6px] max-w-[44px] text-center relative z-20">
                                        {remaining.days}
                                    </h3>
                                </div>
                                <p className="text-sm font-normal text-main-700 mt-1 text-center w-full">{t('days')}</p>
                            </div>

                            {/* Hours */}
                            <div className="timer">
                                <div className="pr-1.5 pl-2 relative bg-main-50 w-max ">
                                    <h3 className="countdown-element hours font-manrope font-semibold text-2xl text-main-600 tracking-[6px] max-w-[44px] text-center relative z-20">
                                        {remaining.hours}
                                    </h3>
                                </div>
                                <p className="text-sm font-normal text-main-700 mt-1 text-center w-full">{t('hours')}</p>
                            </div>

                            {/* Minutes */}
                            <div className="timer">
                                <div className="pr-1.5 pl-2 relative bg-main-50 w-max ">
                                    <h3 className="countdown-element minutes font-manrope font-semibold text-2xl text-main-600 tracking-[6px] max-w-[44px] text-center relative z-20">
                                        {remaining.minutes}
                                    </h3>
                                </div>
                                <p className="text-sm font-normal text-main-700 mt-1 text-center w-full">{t('minutes')}</p>
                            </div>

                            {/* Seconds */}
                            <div className="timer">
                                <div className="pr-1.5 pl-2 relative bg-main-50 w-max ">
                                    <h3 className="countdown-element seconds font-manrope font-semibold text-2xl text-main-600 tracking-[6px] max-w-[44px] text-center relative z-20">
                                        {remaining.seconds}
                                    </h3>
                                </div>
                                <p className="text-sm font-normal text-main-700 mt-1 text-center w-full">{t('seconds')}</p>
                            </div>
                        </div>
                    </div>
                    )}
            </div>
        </div>
    );
}