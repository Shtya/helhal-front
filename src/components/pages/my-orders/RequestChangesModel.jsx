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
import { useTranslations } from 'next-intl';

const getSchema = (t) => z.object({
    message: z
        .string()
        .min(10, t('validation.messageMin'))
        .max(2000, t('validation.messageMax')),
    files: z
        .any()
        .refine((files) => !files || files.length <= 10, t('validation.filesMax'))
        .refine(
            (files) =>
                !files ||
                Array.from(files).every((f) => !f.size || f.size <= 25 * 1024 * 1024),
            t('validation.fileSizeMax')
        )
        .optional(),
});

export default function RequestChangesModel({ open, onClose, onSend, selectedRow, patchOrderRow }) {
    const t = useTranslations('MyOrders.modals.requestChanges');
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
        setSubmitting(true);
        const formData = new FormData();
        const payload = {
            message: data.message,
            files: (data.files || []).map(file => ({
                filename: file.filename,
                url: file.url,
            })),
        };

        try {
            await api.post(`/orders/${selectedRow.id}/request-changes`, payload);
            patchOrderRow(selectedRow.id, (r) => ({
                ...r,
                status: OrderStatus.CHANGES_REQUESTED,
                _raw: { ...r._raw, status: OrderStatus.CHANGES_REQUESTED },
            }));

            toast.success(t('success'));
            onClose();
            onSend?.();
        } catch (e) {
            toast.error(e?.response?.data?.message || t('error'));
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
        <Modal title={t('title')} onClose={onClose} open={open} className="!z-[106]">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        {t('message')} *
                    </label>
                    <Textarea
                        rows={4}
                        placeholder={t('messagePlaceholder')}
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
                    name={submitting ? t('submitting') : t('sendRequest')}
                    disabled={submitting}
                    onClick={handleSubmit(onSubmit)}
                    className="!w-fit"
                />
            </div>
        </Modal>
    );
}
