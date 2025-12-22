import { useLangSwitcher } from "@/hooks/useLangSwitcher";
import { Globe2 } from "lucide-react";

export default function SmallLanguageSwitcher() {
    const { isPending, toggleLocale, locale } = useLangSwitcher()

    return (
        <button
            onClick={toggleLocale}
            disabled={isPending}
            aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            title={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            className='relative h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors'
        >
            <Globe2 className='h-5 w-5 text-slate-600' />
            <span className='sr-only'>{locale === 'ar' ? 'English' : 'العربية'}</span>
        </button>
    );
}