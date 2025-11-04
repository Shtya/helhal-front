import { Link } from "@/i18n/navigation";
import Img from "../atoms/Img";



export default function UserMini({ user, href }) {
    const letter = (user?.username?.[0] || '?').toUpperCase();
    const img = user?.profileImage || user?.avatarUrl;

    return (
        <div className='flex items-center gap-2 min-w-[220px]'>
            <div className='h-9 w-9 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-sm font-semibold'>
                {img ? (
                    // استخدم next/image لو حابب
                    <Img src={img} alt={user?.username || 'user'} altSrc='/no-user.png' className='h-full w-full object-cover' />
                ) : (
                    letter
                )}
            </div>
            <div className='leading-tight'>
                {href ? <Link href={href} className='font-medium text-sm truncate max-w-[160px]  hover:underline' >{user?.username || '—'}</Link>
                    : <h1 className='font-medium text-sm truncate max-w-[160px]'>{user?.username || '—'}</h1>}
                <p className='text-xs text-gray-500 truncate max-w-[160px]'>{user?.email || ''}</p>
            </div>
        </div>
    );
}
