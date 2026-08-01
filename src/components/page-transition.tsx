'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Smooth route transition wrapper.
 * On pathname change: brief fade-out of the old page, then fade/rise-in
 * of the new one. CSS classes live in globals.css (.page-enter/.page-exit).
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState({ path: pathname, children });
  const [leaving, setLeaving] = useState(false);
  const [entered, setEntered] = useState(true);

  // Render-time sync on path change: keep showing old children, flag exit.
  if (state.path !== pathname && !leaving) {
    setLeaving(true);
  } else if (state.path === pathname && !leaving && state.children !== children) {
    setState({ path: pathname, children });
  }

  useEffect(() => {
    if (!leaving) return;
    // children from THIS render belong to the new path — capture for the swap.
    const incoming = children;
    const swap = setTimeout(() => {
      setState({ path: pathname, children: incoming });
      setLeaving(false);
      setEntered(false);
    }, 240);
    return () => clearTimeout(swap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving, pathname]);

  useEffect(() => {
    if (entered) return;
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(raf);
  }, [entered]);

  const cls = leaving ? 'page-exit-active' : entered ? 'page-enter-active' : 'page-enter';
  return <div className={cls}>{state.children}</div>;
}
