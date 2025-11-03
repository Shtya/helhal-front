import { useOutsideClick } from "@/hooks/useOutsideClick";
import { MoreVertical } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";



export default function ActionMenuPortal({ children }) {
    const menuRef = useRef(null);
    const anchorRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [menuOpen, setMenuOpen] = useState(false);
    useOutsideClick([menuRef, anchorRef], () => setMenuOpen(false))

    useLayoutEffect(() => {
        const updatePosition = () => {
            if (anchorRef.current) {
                const rect = anchorRef.current.getBoundingClientRect();
                setPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.right - 192 + window.scrollX, // 192px = menu width
                });
            }
        };


        updatePosition(); // Position before paint

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);


        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [anchorRef]);

    return (
        <div>
            <button
                ref={anchorRef}
                onClick={() => setMenuOpen(prev => !prev)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-full"
            >
                <MoreVertical size={16} />
            </button>
            {menuOpen && createPortal(
                <div
                    ref={menuRef}
                    className="absolute z-50 w-48 bg-white rounded-xl shadow-lg border border-slate-200"
                    style={{ top: position.top, left: position.left }}
                >
                    <div className="py-1">
                        {children}
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
