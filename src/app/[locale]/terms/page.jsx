'use client'

import { useValues } from "@/context/GlobalContext";

export default function TermsPage() {
    const { settings, loadingSettings } = useValues();
    const termsContent = settings?.termsOfService || "";


    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900">Terms of Service</h1>

            {loadingSettings ? (
                <div className="space-y-4 animate-pulse">
                    <div className="h-6 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-4 bg-slate-200 rounded w-5/6" />
                    <div className="h-4 bg-slate-200 rounded w-4/6" />
                </div>
            ) : (
                <div className="prose prose-slate max-w-none whitespace-break-spaces">
                    {termsContent}
                </div>
            )}
        </div>
    );
}