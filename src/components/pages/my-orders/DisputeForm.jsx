import z from "zod";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import Textarea from '@/components/atoms/Textarea';
import Button from '@/components/atoms/Button';
import { useState } from "react";
import api from "@/lib/axios";
import { Modal } from "@/components/common/Modal";
import { useAuth } from "@/context/AuthContext";
import { Link } from "@/i18n/navigation";
import { OrderStatus } from "@/constants/order";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";



export function DisputeModal({ selectedRow, open, onClose, patchOrderRow, setRowLoading }) {
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter()
    const [apiError, setApiError] = useState(null);

    async function handleDisputeSubmit(values) {
        if (!selectedRow) return;

        setRowLoading(selectedRow.id, 'dispute');
        setSubmitting(true);
        setApiError(null);

        try {
            const res = await api.post(`/disputes`, {
                orderId: selectedRow.id,
                type: values.type,
                subject: values.subject,
                reason: values.message,
            });

            if (res.status >= 200 && res.status < 300) {
                patchOrderRow(selectedRow.id, r => ({
                    ...r,
                    status: OrderStatus.DISPUTED,
                    _raw: { ...r._raw, status: OrderStatus.DISPUTED, hasOpenDispute: true, disputeStatus: 'open' },
                }));
                toast.success('Dispute opened successfully');

                onClose();
                router.push(`my-disputes?dispute=${res.data.id}`)
            }
        } catch (e) {
            setApiError(e?.response?.data?.message || 'Failed to open dispute');
        } finally {
            setSubmitting(false);
            setRowLoading(selectedRow?.id || '', null);
        }
    }

    if (!open) return;
    return (
        <Modal title="Open a Dispute" onClose={() => { setApiError(''); onClose() }}>
            <div className="space-y-4">
                <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                    Order: <span className="font-medium">
                        {selectedRow?._raw?.title || selectedRow?._raw?.service?.title || selectedRow?.id}
                    </span>
                </div>

                {apiError && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {apiError}
                    </div>
                )}

                <DisputeForm submitting={submitting} onSubmit={handleDisputeSubmit} selectedRow={selectedRow} />
            </div>
        </Modal>
    );
}
const disputeSchema = z.object({
    type: z
        .enum(['money', 'quality', 'requirements', 'other'])
        .optional()
        .refine(val => !!val, {
            message: 'Please select a dispute type',
        }),
    subject: z
        .string()
        .min(3, 'Subject must be at least 3 characters')
        .max(250, 'Subject must be no more than 250 characters'),
    message: z
        .string()
        .min(8, 'Message must be at least 8 characters')
        .max(2000, 'Message must be no more than 2000 characters'),
});




function DisputeForm({ submitting, onSubmit, readOnly = false, defaultValues, selectedRow }) {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        resolver: zodResolver(disputeSchema),
        defaultValues,
    });

    const { role } = useAuth();
    const isBuyer = role === 'buyer';

    // Extract counterpart info
    const counterpart = isBuyer ? selectedRow?._raw?.seller : selectedRow?._raw?.buyer;
    const counterpartRole = isBuyer ? 'freelancer' : 'client';

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Contextual header */}
            <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                <p>
                    You are about to open a <span className="font-semibold">dispute</span> against the{' '}
                    <span className="font-semibold">{counterpartRole}</span>{' '}
                    <Link href={`/profile/${counterpart.id}`} className="font-medium text-slate-900 hover:underline">@{counterpart?.username}</Link> for the order:
                </p>
                <p className="mt-1 font-medium text-slate-800">
                    {selectedRow?._raw?.title} — ${selectedRow?._raw?.totalAmount}
                </p>
            </div>

            {/* Dispute Type */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    What is this dispute about? *
                </label>
                <Select
                    disabled={readOnly}
                    value={watch('type')}
                    onChange={opt => setValue('type', opt?.id)}
                    options={[
                        { id: 'money', name: 'Money issues' },
                        { id: 'quality', name: 'Work quality concerns' },
                        { id: 'requirements', name: 'Requirements not met' },
                        { id: 'other', name: 'Other issue' },
                    ]}
                    error={errors.type?.message}
                />
            </div>

            {/* Subject */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Dispute Subject *
                </label>
                <Input
                    disabled={readOnly}
                    placeholder="Enter a clear subject for your dispute"
                    {...register('subject')}
                    error={errors.subject?.message}
                />
            </div>

            {/* Message */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Detailed Explanation *
                </label>
                <Textarea
                    disabled={readOnly}
                    rows={5}
                    placeholder="Explain clearly what went wrong, what was expected, and what resolution you are seeking…"
                    {...register('message')}
                    error={errors.message?.message}
                />
                <p className="mt-1 text-xs text-gray-500">
                    Provide enough  details about the problem so we can understand your dispute.
                </p>
            </div>

            {!readOnly && (
                <div className="flex justify-end gap-3">
                    <Button
                        type="submit"
                        color="green"
                        name={submitting ? 'Submitting…' : 'Submit Dispute'}
                        className="!w-fit"
                        disabled={submitting}
                    />
                </div>
            )}
        </form>
    );
}







