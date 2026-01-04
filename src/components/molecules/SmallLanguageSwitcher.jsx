import { useLangSwitcher } from "@/hooks/useLangSwitcher";


export default function SmallLanguageSwitcher() {
    const { isPending, toggleLocale, locale } = useLangSwitcher()
    const isAr = locale === "ar";
    // Increased size and weight to make text feel like a solid icon
    const label = isAr ? "E" : "ع";

    return (
        <button
            onClick={toggleLocale}
            disabled={isPending}
            aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            title={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            className='text-lg  relative h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors'
        >
            <span className={`
        font-bold leading-none select-none
        ${isAr ? 'text-lg' : 'text-xl'} 
        text-slate-800 group-hover:text-black
      `}>
                {label}
            </span>
            <span className='sr-only'>{locale === 'ar' ? 'English' : 'العربية'}</span>
        </button>
    );
}