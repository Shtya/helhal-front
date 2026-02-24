import DashboardLayout from "@/components/dashboard/Layout";


export default function layout({ children }) {
    return (
        <div>
            <DashboardLayout className='bg-gradient-to-b from-white via-slate-50 to-white dark:bg-gradient-to-b dark:from-dark-bg-base dark:via-dark-bg-card dark:to-dark-bg-base'>
                {children}
            </DashboardLayout>
        </div>
    );
}