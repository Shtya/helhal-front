'use client';

import CreateJobPage from "@/app/[locale]/share-job-description/page";
import { useParams } from "next/navigation";

export default function Page() {
    const params = useParams();
    const id = params.id;
    const isAdmin = true;

    return (
        <div>
            <CreateJobPage jobId={id} isAdmin={isAdmin} />
        </div>
    );
}
