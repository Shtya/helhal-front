import { z } from 'zod';

export const usernameSchema = z
    .string()
    .min(2, 'usernameMin')
    .max(50, 'usernameMax')
    .regex(/^[a-zA-Z0-9_ ]+$/, 'usernameInvalid')
    .transform(val => val.trim())
    .refine(val => val.length >= 3, 'usernameMin')
    .refine(val => !val.includes('  '), 'usernameSpaces');



export function validateUsername(value) {
    const result = usernameSchema.safeParse(value);
    if (!result.success) {
        const firstIssue = result.error.issues[0];
        return firstIssue?.message || 'Invalid username';
    }
    return null;
}

export function validatPhone(value) {
    const isInvalid = value.length < 6 || !/^[\d+\s]+$/.test(value);
    return isInvalid;
}

export function formatResponseTime(seconds) {
    if (!seconds || seconds <= 0) return '—';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}
