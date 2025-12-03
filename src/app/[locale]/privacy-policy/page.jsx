'use client'

import { useValues } from "@/context/GlobalContext";
import { useTranslations } from "next-intl";
import { FaRegFileAlt } from "react-icons/fa"; // 👈 example icon

export default function PrivacyPolicy() {
    const { settings, loadingSettings } = useValues();
    const t = useTranslations("privacy");
    const privacyPolicy = settings?.privacyPolicy || "";

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900">
                {t("title")}
            </h1>

            {loadingSettings ? (
                <div className="space-y-4 animate-pulse">
                    <div className="h-6 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-4 bg-slate-200 rounded w-5/6" />
                    <div className="h-4 bg-slate-200 rounded w-4/6" />
                </div>
            ) : !privacyPolicy ? (
                <div className="prose prose-slate max-w-none whitespace-break-spaces">
                    {privacyPolicy}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center mt-8 p-6 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                    <FaRegFileAlt className="w-10 h-10 text-emerald-600 mb-3" />
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
