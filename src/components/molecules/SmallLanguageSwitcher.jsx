import { useLangSwitcher } from "@/hooks/useLangSwitcher";
import { motion } from 'framer-motion';
import { Globe } from "lucide-react";

export default function SmallLanguageSwitcher() {
    const { isPending, toggleLocale, locale } = useLangSwitcher();
    const isAr = locale === "ar";

    // Switch to full words
    const label = isAr ? "English" : "العربية";

    // Define the same spring transition as your nav links
    const springy = { type: "spring", stiffness: 380, damping: 30 };

    return (
        <button
            onClick={toggleLocale}
            disabled={isPending}
            aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
            title={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
            // Used your exact Link classes here
            className={`relative px-3 py-2 text-[15px] font-medium rounded-xl inline-flex items-center gap-1.5 lg:gap-2 transition-colors text-slate-700 group hover:text-main-700`}
        >
            {/* The Label */}
            <span>{label}</span>
            <Globe className="h-5 w-5 text-slate-700 group-hover:text-main-700 transition-colors" />

            {/* The Underline (always transparent/inactive for a switcher, 
                or you can remove the bg-transparent logic if it's just a button) */}
            <motion.span
                layoutId='nav-underline'
                className="absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full bg-transparent"
                transition={springy}
            />

            <span className='sr-only'>{isAr ? 'English' : 'العربية'}</span>
        </button>
    );
}