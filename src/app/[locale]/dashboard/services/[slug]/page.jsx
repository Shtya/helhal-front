'use client';

import GigCreationWizard from "@/app/[locale]/create-gig/page";
import { useParams } from "next/navigation";

export default function Page() {
    const params = useParams();
    const slug = params.slug;
    const isAdmin = true;

    return (
        <div>
            <GigCreationWizard gigSlug={slug} isAdmin={isAdmin} />
        </div>
    );
}
