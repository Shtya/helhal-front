import { toast } from 'react-hot-toast';

export const showWarningToast = (message) => {
    toast(message, {
        icon: '⚠️',
        style: {
            background: '#fffbe6',
            color: '#92400e',
            border: '1px solid #facc15',
        },
    });
};


/* ------------------------------ NOTIFICATION FUNCTION ------------------------------ */
export const showNotification = (message, type = 'success', toastId) => {
    switch (type) {
        case 'success':
            return toast.success(message, { id: toastId });
        case 'error':
            return toast.error(message, { id: toastId });
        case 'loading':
            return toast.loading(message, { id: toastId });
        case 'info':
        default:
            return toast(message, { id: toastId });
    }
};
