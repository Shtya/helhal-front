import { Modal } from '@/components/common/Modal';
import Button from '@/components/atoms/Button';
import { useTranslations } from 'next-intl';

export default function CongratulationsModal({ open, onClose, selectedRow }) {
    const t = useTranslations('MyOrders.modals.congratulations');
    const orderTitle = selectedRow?._raw?.title;
    const sellerName = selectedRow?._raw?.seller?.username;
    const amount = selectedRow?._raw?.totalAmount ? Number(selectedRow?._raw?.totalAmount).toFixed(2) : "—";
    if (!open) return null;

    return (
        <Modal title={t('title')} onClose={onClose}>
            <div className="space-y-6 text-center">
                {/* Success Icon */}
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                            className="w-10 h-10 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-800">
                        {t('heading')}
                    </h3>
                    <p className="text-sm text-slate-600">
                        {t('description')}
                    </p>
                </div>

                {/* Order Details */}
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">{t('order')}:</span>
                        <strong className="text-slate-800">{orderTitle}</strong>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">{t('seller')}:</span>
                        <strong className="text-slate-800">{sellerName}</strong>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">{t('amount')}:</span>
                        <strong className="text-green-600">${amount}</strong>
                    </div>
                </div>

                {/* Additional Info */}
                <p className="text-xs text-slate-500">
                    {t('paymentInfo')}
                </p>

                {/* Action Button */}
                <div className="pt-2">
                    <Button
                        type="button"
                        color="green"
                        name={t('continue')}
                        onClick={onClose}
                        className="w-full"
                    />
                </div>
            </div>
        </Modal>
    );
}