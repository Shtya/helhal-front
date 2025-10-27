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
