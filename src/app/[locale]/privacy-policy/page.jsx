'use client'

import LegalSkeleton from "@/components/atoms/LegalSkeleton";
import RichTextRenderer from "@/components/molecules/editor/RichTextRenderer";
import { useValues } from "@/context/GlobalContext";
import { useLocale, useTranslations } from "next-intl";
import { FaRegFileAlt } from "react-icons/fa"; // 👈 example icon

export default function PrivacyPolicy() {
    const { settings, loadingSettings } = useValues();
    const locale = useLocale()
    const t = useTranslations("privacy");
    const privacyPolicy = locale === 'ar' ? settings?.privacyPolicy_ar || null : settings?.privacyPolicy_en || null;

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            {loadingSettings ? (
                <LegalSkeleton />
            ) : privacyPolicy ? (
                <RichTextRenderer
                    content={privacyPolicy}
                    className="text-lg leading-loose text-dark"
                    loader={<LegalSkeleton />}
                />
            ) : (
                <div className="flex flex-col items-center justify-center mt-8 p-6 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                    <FaRegFileAlt className="w-10 h-10 text-main-600 mb-3" />
                    <p className="text-lg font-semibold text-slate-700">
                        {t("notFoundTitle")}
                    </p>
                    <p className="text-sm text-slate-500 mt-1 text-center max-w-md">
                        {t("notFoundDescription")}
                    </p>
                </div>
            )}
        </div>
    );
}
