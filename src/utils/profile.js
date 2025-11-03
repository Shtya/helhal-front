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
    const isInvalid = value && (value.length < 6 || !/^\d+$/.test(value));
    return isInvalid;
}