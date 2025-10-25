import { useLayoutEffect, useState } from 'react';

export function useDropdownPosition(open, btnRef, menuWidth = 330) {
    const [menuStyle, setMenuStyle] = useState({});

    useLayoutEffect(() => {
        function updateMenuPosition() {
            if (open && btnRef.current) {
                const rect = btnRef.current.getBoundingClientRect();
                const vw = window.innerWidth;

                if (rect.right < menuWidth + 5) {
                    setMenuStyle({
                        left: 5,
                        right: 'auto',
                        maxWidth: '100%',
                    });
                } else {
                    setMenuStyle({
                        right: vw - rect.right - 7,
                        left: 'auto',
                        maxWidth: `${menuWidth}px`, // matches w-80
                    });
                }
            }
        }

        updateMenuPosition();
        window.addEventListener('resize', updateMenuPosition);
        return () => window.removeEventListener('resize', updateMenuPosition);
    }, [open, btnRef, menuWidth]);

    return menuStyle;
}
