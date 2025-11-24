import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import Textarea from '@/components/atoms/Textarea';
import Button from '@/components/atoms/Button';
import FileUploader from '@/components/atoms/FileUploader';
import { OrderStatus } from '@/constants/order';
import { Modal } from '@/components/common/Modal';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

const getSchema = (t) => z.object({
    message: z
        .string()
        .min(10, t('validation.messageMin'))
        .max(2000, t('validation.messageMax')),
    files: z
        .any()
        .refine(
            (files) => !files || files.length <= 10,
            t('validation.filesMax')
        )
        .refine(
            (files) =>
                !files ||
                Array.from(files).every((f) => !f.size || f.size <= 25 * 1024 * 1024),
            t('validation.fileSizeMax')
        )
        .optional(),
});

export default function DeliverModel({
    open,
    onClose,
    selectedRow,
    patchOrderRow,
    setRowLoading,
}) {
    const t = useTranslations('MyOrders.modals.deliver');
    const [submitting, setSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(getSchema(t)),
        defaultValues: {
            message: '',
            files: [],
        },
    });

    const files = watch('files');

    async function onSubmit(data) {
        const row = selectedRow;
        setRowLoading(row.id, 'deliver');
        setSubmitting(true);


        try {
            const payload = {
                message: data.message,
                files: (data.files || []).map(file => ({
                    filename: file.filename,
                    url: file.url,
                })),
            };

            const res = await api.post(`/orders/${row.id}/deliver`, payload);
            if (res?.status >= 200 && res?.status < 300) {
                patchOrderRow(row.id, (r) => ({
                    ...r,
                    status: OrderStatus.DELIVERED,
                    _raw: {
                        ...r._raw,
                        status: OrderStatus.DELIVERED,
                        deliveredAt: new Date().toISOString(),
                    },
                }));
                toast.success(t('success'));

                onClose();
            }
        } catch (e) {
            const msg = e?.response?.data?.message || t('error');
            toast.error(msg)
        } finally {
            setRowLoading(row.id, null);
            setSubmitting(false);
        }
    }

    useEffect(() => {
        setValue("message", '');
        setValue("files", []);
    }, [selectedRow?.id])

    const amount = selectedRow?._raw?.totalAmount ? Number(selectedRow?._raw?.totalAmount).toFixed(2) : "—";

    if (!open) return null;

    const clientName = selectedRow?._raw?.buyer?.username;
    const orderTitle = selectedRow?._raw?.title;


    return (
        <Modal title={t('title')} onClose={onClose}>
            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    {t('order')}: <strong>{orderTitle}</strong>
                </p>
                <p className="text-sm text-slate-600">
                    {t('receivePayment')} <strong>{clientName}</strong> {t('acceptsDelivery')}
                </p>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        {t('messageToClient')} *
                    </label>
                    <Textarea
                        rows={4}
                        placeholder={t('messagePlaceholder')}
                        {...register('message')}
                        error={errors.message?.message}
                    />
                </div>

                <FileUploader
                    // label="Attach Files"
                    maxFiles={10}
                    maxSizeMB={25}
                    files={files}
                    onChange={(newFiles) => setValue('files', newFiles)}
                />
                {/* Freelancer note */}
                <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded px-3 py-2">
                    {t('note')} <strong>{clientName}</strong> {t('willHave')} <strong>14</strong> {t('daysToReview')}
                    {t('noAction')} <strong>${amount}</strong> {t('willBeReleased')}
                </div>
                <Button
                    type="button"
                    color="green"
                    name={submitting ? t('delivering') : t('deliverWork')}
                    disabled={submitting}
                    onClick={handleSubmit(onSubmit)}
                    className="!w-fit"
                />
            </div>
        </Modal>
    );
}
