import { useState, useEffect } from 'react';

const BREAKPOINT = 768;

export default function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => window.innerWidth <= BREAKPOINT);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BREAKPOINT}px)`);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return mobile;
}
