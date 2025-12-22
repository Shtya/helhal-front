import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";



export function useLangSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'ar', label: 'العربية' },
    ];

    const toggleLocale = (code) => {
        const nextLocale = code && locale === 'ar' ? 'en' : 'ar';
        startTransition(() => {
            const queryString = searchParams.toString();
            const url = queryString ? `${pathname}?${queryString}` : pathname;
            router.push(url, { locale: nextLocale });
        });
    };


    return { toggleLocale, isPending, languages, locale }
}