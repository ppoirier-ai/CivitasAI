'use client';

/**
 * Custom Spacenomics icon set — refined monoline, 24px grid, round caps,
 * teal gradient stroke (theme-aware stops). Replaces generic line icons.
 */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

function IconShell({ children, className, id }: { children: React.ReactNode; className?: string; id: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="url(#spx-grad)"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={`spx-grad-${id}`} x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--icon-grad-a, #2EC4C6)" />
          <stop offset="1" stopColor="var(--icon-grad-b, #5EEAD4)" />
        </linearGradient>
      </defs>
      <g stroke={`url(#spx-grad-${id})`}>{children}</g>
    </svg>
  );
}

/* ————— Executive Summary: brief with orbital check ————— */
export function IconExecutive({ className }: IconProps) {
  return (
    <IconShell id="exec" className={className}>
      <path d="M6.8 3.8h7.4L18 7.6v11.1a1.6 1.6 0 0 1-1.6 1.6H6.8a1.6 1.6 0 0 1-1.6-1.6V5.4a1.6 1.6 0 0 1 1.6-1.6Z" />
      <path d="M14.2 3.8v3.8h3.8" />
      <path d="M8.8 13.2l1.9 1.9 3.9-4.2" />
      <circle cx="17.6" cy="16.6" r="2.6" strokeDasharray="1.2 2.2" />
    </IconShell>
  );
}

/* ————— Problem & Solution: target with approach arrow ————— */
export function IconProblem({ className }: IconProps) {
  return (
    <IconShell id="problem" className={className}>
      <circle cx="11.4" cy="11.4" r="8" />
      <circle cx="11.4" cy="11.4" r="4.3" />
      <circle cx="11.4" cy="11.4" r="1.1" fill="url(#spx-grad-problem)" stroke="none" />
      <path d="M16.6 7.4 20 4M20 4h-3.1M20 4v3.1" />
    </IconShell>
  );
}

/* ————— Market Sizing: bars inside an orbit ————— */
export function IconMarket({ className }: IconProps) {
  return (
    <IconShell id="market" className={className}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M7.8 15.8v-3.4M12 15.8v-5.8M16.2 15.8v-4.6" />
      <path d="M7 16.4h10" />
    </IconShell>
  );
}

/* ————— Growth Outlook: rising signal ————— */
export function IconGrowth({ className }: IconProps) {
  return (
    <IconShell id="growth" className={className}>
      <path d="M3.5 17.2c2.6-5.6 4.4-2.4 7.4-5.4s4-1.6 5.8-.4" />
      <path d="M16.4 8.4 20 4.6M20 4.6h-3M20 4.6v3" />
      <circle cx="19.9" cy="14.6" r="1.1" fill="url(#spx-grad-growth)" stroke="none" />
    </IconShell>
  );
}

/* ————— Capital Requirements: stacked layers ————— */
export function IconCapital({ className }: IconProps) {
  return (
    <IconShell id="capital" className={className}>
      <path d="M4.6 8.6 12 4.8l7.4 3.8L12 12.4 4.6 8.6Z" />
      <path d="M4.6 12.4 12 16.2l7.4-3.8" />
      <path d="M4.6 16.2 12 20l7.4-3.8" />
    </IconShell>
  );
}

/* ————— ROI Outlook: gauge ————— */
export function IconRoi({ className }: IconProps) {
  return (
    <IconShell id="roi" className={className}>
      <path d="M5 16.6a7 7 0 1 1 14 0" />
      <path d="M12 16.6 15.4 11.2" />
      <circle cx="12" cy="16.6" r="1.2" fill="url(#spx-grad-roi)" stroke="none" />
      <path d="M8.4 16.6h.01M15.6 16.6h.01" />
    </IconShell>
  );
}

/* ————— Lifetime Access: infinity ————— */
export function IconLifetime({ className }: IconProps) {
  return (
    <IconShell id="life" className={className}>
      <path d="M12 12c-1.9-2.6-3.9-3.9-5.9-3.9a3.9 3.9 0 1 0 0 7.8c2 0 4-1.3 5.9-3.9Zm0 0c1.9 2.6 3.9 3.9 5.9 3.9a3.9 3.9 0 0 0 0-7.8c-2 0-4 1.3-5.9 3.9Z" />
    </IconShell>
  );
}

/* ————— Browse marketplace: compass ————— */
export function IconBrowse({ className }: IconProps) {
  return (
    <IconShell id="browse" className={className}>
      <circle cx="12" cy="12" r="8.3" />
      <path d="M14.6 9.4 12.4 14.2 7.6 16.4 9.8 11.6 14.6 9.4Z" />
    </IconShell>
  );
}

/* ————— Preview every brief: open book ————— */
export function IconPreview({ className }: IconProps) {
  return (
    <IconShell id="preview" className={className}>
      <path d="M12 6.6C10.5 5.2 8.6 4.6 6.2 4.6c-1.6 0-2.7.3-3.2.6v11.6c.5-.3 1.6-.6 3.2-.6 2.4 0 4.3.6 5.8 2 1.5-1.4 3.4-2 5.8-2 1.6 0 2.7.3 3.2.6V5.2c-.5-.3-1.6-.6-3.2-.6-2.4 0-4.3.6-5.8 2Z" />
      <path d="M12 6.6v12" />
    </IconShell>
  );
}

/* ————— Purchase once: bag on an orbit ————— */
export function IconPurchase({ className }: IconProps) {
  return (
    <IconShell id="purchase" className={className}>
      <path d="M6.2 8.6h11.6l-.9 9.9a1.7 1.7 0 0 1-1.7 1.5H8.8a1.7 1.7 0 0 1-1.7-1.5l-.9-9.9Z" />
      <path d="M9.2 8.6V7.2a2.8 2.8 0 0 1 5.6 0v1.4" />
      <path d="M6.6 16.8c0 1.3 2.4 2.4 5.4 2.4s5.4-1.1 5.4-2.4" />
    </IconShell>
  );
}

/* ————— Hero CTA: rocket ————— */
export function IconRocket({ className }: IconProps) {
  return (
    <IconShell id="rocket" className={className}>
      <path d="M12 3.4c2.4 1.4 3.9 3.9 3.9 6.8l.9 3.3a1.9 1.9 0 0 1-1.9 2.3h-5.8a1.9 1.9 0 0 1-1.9-2.3l.9-3.3c0-2.9 1.5-5.4 3.9-6.8Z" />
      <circle cx="12" cy="9.2" r="1.5" />
      <path d="M9.2 14.2 7.6 18l2.2-.9M14.8 14.2l1.6 3.8-2.2-.9" />
      <path d="M12 19.6v1.8" />
    </IconShell>
  );
}

/* ————— Hero CTA: see inside (book) ————— */
export function IconBook({ className }: IconProps) {
  return (
    <IconShell id="book" className={className}>
      <path d="M4 6.4c1.4-.7 3-.9 4.8-.6 1.2.2 2.2.7 3.2 1.5 1-0.8 2-1.3 3.2-1.5 1.8-.3 3.4-.1 4.8.6v11.4c-1.4-.7-3-.9-4.8-.6-1.2.2-2.2.7-3.2 1.5-1-.8-2-1.3-3.2-1.5-1.8-.3-3.4-.1-4.8.6V6.4Z" />
      <path d="M12 7.3v11.1" />
    </IconShell>
  );
}
