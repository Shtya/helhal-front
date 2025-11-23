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

const schema = z.object({
    message: z
        .string()
        .min(10, 'Message must be at least 10 characters')
        .max(2000, 'Message must be at most 2000 characters'),
    files: z
        .any()
        .refine(
            (files) => !files || files.length <= 10,
            'You can upload up to 10 files'
        )
        .refine(
            (files) =>
                !files ||
                Array.from(files).every((f) => !f.size || f.size <= 25 * 1024 * 1024),
            'Each file must be less than 25MB'
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
    const [submitting, setSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
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
                toast.success('Work delivered successfully');

                onClose();
            }
        } catch (e) {
            const msg = e?.response?.data?.message || 'Failed to deliver order';
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
        <Modal title="Deliver Work" onClose={onClose}>
            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    Order: <strong>{orderTitle}</strong>
                </p>
                <p className="text-sm text-slate-600">
                    You’ll receive payment once <strong>{clientName}</strong> accepts the delivery.
                </p>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Message to Client *
                    </label>
                    <Textarea
                        rows={4}
                        placeholder="Describe what you’re delivering…"
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
                    Once you deliver your work, <strong>{clientName}</strong> will have up to <strong>14 days</strong> to review and respond.
                    If no action is taken within that period, a payment of <strong>${amount}</strong> will be automatically released to you from the client.
                </div>
                <Button
                    type="button"
                    color="green"
                    name={submitting ? 'Delivering…' : 'Deliver Work'}
                    disabled={submitting}
                    onClick={handleSubmit(onSubmit)}
                    className="!w-fit"
                />
            </div>
        </Modal>
    );
}
