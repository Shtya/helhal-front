import { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import AttachmentList from '@/components/common/AttachmentList';
import { formatDate } from '@/utils/date';
import api from '@/lib/axios';
import { useTranslations } from 'next-intl';

export default function ChangeRequestReviewModel({
    open,
    onClose,
    selectedRow,
}) {
    const t = useTranslations('MyOrders.modals.changeRequest');
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState(null);

    useEffect(() => {
        if (!selectedRow?.id || !open) return;

        const fetchChangeRequest = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/orders/${selectedRow.id}/last-change-request`);
                setRequest(res.data);

            } catch (error) {
                setRequest(null);
            } finally {
                setLoading(false);
            }
        };

        fetchChangeRequest();
    }, [selectedRow?.id]);

    if (!open) return null;

    const orderTitle = selectedRow?._raw?.title;
    const clientName = selectedRow?._raw?.buyer?.username;

    return (
        <Modal title={t('title')} onClose={onClose}>
            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    {t('order')}: <strong>{orderTitle}</strong>
                </p>
                <p className="text-sm text-slate-600">
                    {t('requestedBy')} <strong>{clientName}</strong>
                </p>

                {loading ? (
                    <ModalSkeleton />
                ) : request ? (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {t('message')}
                            </label>
                            <p className="text-sm text-slate-800 whitespace-pre-line bg-slate-50 p-3 rounded">
                                {request.message}
                            </p>
                        </div>

                        {request.files?.length > 0 && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('files')}
                                </label>
                                <AttachmentList attachments={request.files} variant="list" />
                            </div>
                        )}

                        <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded px-3 py-2">
                            {t('submittedOn')} <strong>{formatDate(request.created_at)}</strong>.
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-red-600">{t('notFound')}</p>
                )}
            </div>
        </Modal>
    );
}

function ModalSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-6 w-1/2 bg-slate-200 rounded" />
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
            <div className="h-4 w-2/3 bg-slate-200 rounded" />
            <div className="space-y-2">
                <div className="h-4 w-1/3 bg-slate-200 rounded" />
                <div className="h-24 w-full bg-slate-200 rounded" />
            </div>
        </div>
    );
}
