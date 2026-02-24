import { Link } from "@/i18n/navigation";
import Img from "../atoms/Img";


export default function UserMini({ user, href }) {
    const letter = (user?.username?.[0] || '?').toUpperCase();
    const img = user?.profileImage || user?.avatarUrl;

    return (
        <div className='flex items-center gap-2 min-w-[220px]'>
            {/* Avatar Container */}
            <div className='h-9 w-9 rounded-full bg-slate-200 dark:bg-dark-bg-input overflow-hidden flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-dark-text-secondary'>
                {img ? (
                    <Img
                        src={img}
                        alt={user?.username || 'user'}
                        altSrc='/no-user.png'
                        className='h-full w-full object-cover'
                    />
                ) : (
                    letter
                )}
            </div>

            {/* User Info */}
            <div className='leading-tight'>
                {href ? (
                    <Link
                        href={href}
                        className='font-medium text-sm truncate max-w-[160px] hover:underline text-slate-900 dark:text-dark-text-primary block'
                    >
                        {user?.username || '—'}
                    </Link>
                ) : (
                    <h1 className='font-medium text-sm truncate max-w-[160px] text-slate-900 dark:text-dark-text-primary'>
                        {user?.username || '—'}
                    </h1>
                )}
                <p className='text-xs text-slate-500 dark:text-dark-text-secondary truncate max-w-[160px]'>
                    {user?.email || ''}
                </p>
            </div>
        </div>
    );
}