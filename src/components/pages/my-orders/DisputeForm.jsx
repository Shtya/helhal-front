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
import { useTranslations } from 'next-intl';



export function DisputeModal({ selectedRow, open, onClose, patchOrderRow, setRowLoading }) {
    const t = useTranslations('MyOrders.modals.dispute');
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
                toast.success(t('success'));

                onClose();
                router.push(`my-disputes?dispute=${res.data.id}`)
            }
        } catch (e) {
            setApiError(e?.response?.data?.message || t('error'));
        } finally {
            setSubmitting(false);
            setRowLoading(selectedRow?.id || '', null);
        }
    }

    if (!open) return;
    return (
        <Modal title={t('title')} onClose={() => { setApiError(''); onClose() }}>
            <div className="space-y-4">
                <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                    {t('order')}: <span className="font-medium">
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
const getDisputeSchema = (t) => z.object({
    type: z
        .enum(['money', 'quality', 'requirements', 'other'])
        .optional()
        .refine(val => !!val, {
            message: t('validation.typeRequired'),
        }),
    subject: z
        .string()
        .min(3, t('validation.subjectMin'))
        .max(250, t('validation.subjectMax')),
    message: z
        .string()
        .min(8, t('validation.messageMin'))
        .max(2000, t('validation.messageMax')),
});




function DisputeForm({ submitting, onSubmit, readOnly = false, defaultValues, selectedRow }) {
    const t = useTranslations('MyOrders.modals.dispute');
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        resolver: zodResolver(getDisputeSchema(t)),
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
                    {t('aboutToOpen')} <span className="font-semibold">{t('dispute')}</span> {t('against')} <span className="font-semibold">{counterpartRole}</span>{' '}
                    <Link href={`/profile/${counterpart.id}`} className="font-medium text-slate-900 hover:underline">@{counterpart?.username}</Link> {t('forOrder')}
                </p>
                <p className="mt-1 font-medium text-slate-800">
                    {selectedRow?._raw?.title} — ${selectedRow?._raw?.totalAmount}
                </p>
            </div>

            {/* Dispute Type */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('whatAbout')} *
                </label>
                <Select
                    disabled={readOnly}
                    value={watch('type')}
                    placeholder={t('selectPlaceholder')}
                    onChange={opt => setValue('type', opt?.id)}
                    options={[
                        { id: 'money', name: t('types.money') },
                        { id: 'quality', name: t('types.quality') },
                        { id: 'requirements', name: t('types.requirements') },
                        { id: 'other', name: t('types.other') },
                    ]}
                    error={errors.type?.message}
                />
            </div>

            {/* Subject */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('subject')} *
                </label>
                <Input
                    disabled={readOnly}
                    placeholder={t('subjectPlaceholder')}
                    {...register('subject')}
                    error={errors.subject?.message}
                />
            </div>

            {/* Message */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('detailedExplanation')} *
                </label>
                <Textarea
                    disabled={readOnly}
                    rows={5}
                    placeholder={t('explanationPlaceholder')}
                    {...register('message')}
                    error={errors.message?.message}
                />
                <p className="mt-1 text-xs text-gray-500">
                    {t('explanationHint')}
                </p>
            </div>

            {!readOnly && (
                <div className="flex justify-end gap-3">
                    <Button
                        type="submit"
                        color="green"
                        name={submitting ? t('submitting') : t('submit')}
                        className="!w-fit"
                        disabled={submitting}
                    />
                </div>
            )}
        </form>
    );
}







