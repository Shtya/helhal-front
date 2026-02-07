import React from "react";

export default function LegalSkeleton() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl animate-pulse">
            {/* Title Block */}
            <div className="mb-10">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
                <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                <div className="h-4 bg-gray-100 rounded w-5/6" />
            </div>

            {/* Repeated Sections */}
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mb-12">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-100 rounded w-full" />
                        <div className="h-4 bg-gray-100 rounded w-full" />
                        <div className="h-4 bg-gray-100 rounded w-4/6" />
                    </div>
                </div>
            ))}
        </div>
    );
}