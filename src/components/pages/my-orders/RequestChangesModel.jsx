import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import Textarea from '@/components/atoms/Textarea';
import Button from '@/components/atoms/Button';
import FileUploader from '@/components/atoms/FileUploader';

import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Modal } from '@/components/dashboard/Ui';
import { OrderStatus } from '@/constants/order';

const schema = z.object({
    message: z
        .string()
        .min(10, 'Message must be at least 10 characters')
        .max(2000, 'Message must be at most 2000 characters'),
    files: z
        .any()
        .refine((files) => !files || files.length <= 10, 'You can upload up to 10 files')
        .refine(
            (files) =>
                !files || Array.from(files).every((f) => f.size <= 25 * 1024 * 1024),
            'Each file  must be less than 25MB'
        )
        .optional(),
});

export default function RequestChangesModel({ open, onClose, onSend, selectedRow, patchOrderRow }) {
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
        setSubmitting(true);
        const formData = new FormData();
        formData.append('message', data.message);
        for (const file of data.files || []) {
            formData.append('files', file);
        }

        try {
            await api.post(`/orders/${selectedRow.id}/request-changes`, formData);
            patchOrderRow(selectedRow.id, (r) => ({
                ...r,
                status: OrderStatus.CHANGES_REQUESTED,
                _raw: { ...r._raw, status: OrderStatus.CHANGES_REQUESTED },
            }));

            toast.success('Change request sent to the freelancer');
            onClose();
            onSend?.();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to request changes');
        } finally {
            setSubmitting(false);
        }
    }

    useEffect(() => {
        setValue("message", '');
        setValue("files", []);
    }, [selectedRow?.id])
    if (!open) return null;

    return (
        <Modal title="Request Changes" onClose={onClose} open={open}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Message *
                    </label>
                    <Textarea
                        rows={4}
                        placeholder="Explain what needs to be changed…"
                        {...register('message')}
                        error={errors.message?.message}
                    />
                </div>

                <FileUploader
                    maxFiles={10}
                    maxSizeMB={25}
                    files={files}
                    onChange={(newFiles) => setValue('files', newFiles)}
                    error={errors.files?.message}
                />

                <Button
                    type="submit"
                    color="red"
                    name={submitting ? 'Submitting…' : 'Send Request'}
                    disabled={submitting}
                    onClick={handleSubmit(onSubmit)}
                    className="!w-fit"
                />
            </div>
        </Modal>
    );
}
