import { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import Button from '@/components/atoms/Button';
import { OrderStatus } from '@/constants/order';

import api from '@/lib/axios';
import RequestChangesModel from './RequestChangesModel';
import AttachmentList from '@/components/common/AttachmentList';
import { formatDate } from '@/utils/date';
import toast from 'react-hot-toast';

export default function ReviewSubmissionModel({
    open,
    onClose,
    selectedRow,
    patchOrderRow,
    setRowLoading,
    readOnly
}) {
    const [loading, setLoading] = useState(true);
    const [completeloading, setCompleteLoading] = useState(false);
    const [submission, setSubmission] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);

    useEffect(() => {
        if (!selectedRow?.id || !open) return;

        const fetchSubmission = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/orders/${selectedRow.id}/last-submission`);
                setSubmission(res.data);

            } catch (error) {
                setSubmission(null);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmission();
    }, [selectedRow?.id]);


    async function completeOrder() {
        setRowLoading(selectedRow.id, 'receive');
        setCompleteLoading(true);
        try {
            const res = await api.post(`/orders/${selectedRow.id}/complete`);

            if (res?.status >= 200 && res?.status < 300) {
                patchOrderRow(selectedRow.id, (r) => ({
                    ...r,
                    status: OrderStatus.COMPLETED,
                    _raw: { ...r._raw, status: OrderStatus.COMPLETED },
                }));

                toast.success('Order completed successfully');
                onClose();
            }
        } catch (e) {
            alert(e?.response?.data?.message || 'Failed to complete order');
        } finally {
            setRowLoading(selectedRow.id, null);
            setCompleteLoading(false);
        }
    }

    if (!open) return null;

    const orderTitle = selectedRow?._raw?.title;
    const sellerName = selectedRow?._raw?.seller?.username;
    const deliveredAt = new Date(submission?.created_at);
    const releaseDate = new Date(deliveredAt.getTime() + 14 * 86400000);
    const amount = selectedRow?._raw?.totalAmount ? Number(selectedRow?._raw?.totalAmount).toFixed(2) : "—";

    return (
        <>
            <Modal title={readOnly ? "Review Submission" : "Receive Work"} onClose={onClose}>
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Order: <strong>{orderTitle}</strong>
                    </p>
                    <p className="text-sm text-slate-600">
                        Submitted by <strong>{sellerName}</strong>
                    </p>

                    {loading ? (
                        <ModalSkeleton />
                    ) : submission ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Message
                                </label>
                                <p className="text-sm text-slate-800 whitespace-pre-line bg-slate-50 p-3 rounded">
                                    {submission.message}
                                </p>
                            </div>

                            {submission.files?.length > 0 && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Files
                                    </label>
                                    <AttachmentList attachments={submission.files} variant='list' />
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-red-600">No submission found.</p>
                    )}

                    {!readOnly && <>
                        {submission && <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded px-3 py-2">
                            This delivery was submitted on <strong>{formatDate(submission?.created_at)}</strong>.
                            If you don’t take action by <strong>{formatDate(releaseDate)}</strong>, a payment of <strong>${amount}</strong> will be automatically released to <strong>{sellerName}</strong>.
                        </div>
                        }
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                color="green"
                                name="Receive Work"
                                disabled={!submission}
                                loading={completeloading}
                                onClick={completeOrder}
                                className="!w-fit"
                            />
                            <Button
                                type="button"
                                color="red"
                                name="Request Changes"
                                disabled={!submission}
                                onClick={() => setShowRequestModal(true)}
                                className="!w-fit"
                            />
                        </div> </>}
                </div>
            </Modal>

            {showRequestModal && (
                <RequestChangesModel
                    open={showRequestModal}
                    onClose={() => setShowRequestModal(false)}
                    onSend={onClose}
                    patchOrderRow={patchOrderRow}
                    selectedRow={selectedRow}
                />
            )}
        </>
    );
}


function ModalSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {/* Title */}
            <div className="h-6 w-1/2 bg-slate-200 rounded" />

            {/* Subtitle lines */}
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
            <div className="h-4 w-2/3 bg-slate-200 rounded" />

            {/* Message field */}
            <div className="space-y-2">
                <div className="h-4 w-1/3 bg-slate-200 rounded" />
                <div className="h-24 w-full bg-slate-200 rounded" />
            </div>


            {/* Buttons */}
            <div className="flex gap-3 pt-2">
                <div className="h-10 w-32 bg-slate-200 rounded" />
                <div className="h-10 w-32 bg-slate-200 rounded" />
            </div>
        </div>
    );
}
