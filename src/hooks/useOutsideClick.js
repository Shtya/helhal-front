import { useEffect } from 'react';

export const useOutsideClick = (refs, handler) => {
  useEffect(() => {
    const listener = (event) => {
      const refsArray = Array.isArray(refs) ? refs : [refs];
      const isInsideAny = refsArray.some(ref => {
        return ref?.current?.contains?.(event.target);
      });

      if (isInsideAny) return;

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [refs, handler]);
};
