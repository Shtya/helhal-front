import DashboardLayout from "@/components/dashboard/Layout";


export default function layout({ children }) {
    return (
        <div>
            <DashboardLayout className='bg-gradient-to-b from-white via-slate-50 to-white'>
                {children}
            </DashboardLayout>
        </div>
    );
}