import { Link } from "@/i18n/navigation";
import { motion } from 'framer-motion';
import Image from "next/image";

const springy = { type: 'spring', stiffness: 500, damping: 30, mass: 0.6 };

export default function Logo({ textHideMobile = true }) {
    return (
        <Link href='/' className='flex items-center group'>
            <motion.div whileHover={{ rotate: -4, scale: 1.05 }} transition={springy}>
                <Image src='/images/helhal-logo.png' alt='Logo' width={42} height={42} priority className='rounded-xl shadow-sm' />
            </motion.div>
            <span className={`ml-2 text-slate-900 ${textHideMobile ? "hidden sm:block" : 'block'} font-semibold tracking-tight`}>Helhal</span>
        </Link>
    );
}