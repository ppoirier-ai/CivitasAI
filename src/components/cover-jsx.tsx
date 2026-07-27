import type { VentureBrief } from '@/lib/types';

export function CoverJSX({ brief, today }: { brief: VentureBrief; today: string }) {
  return (
    <div
      style={{
        width: '1200px',
        height: '1554px',
        backgroundColor: '#0A1222',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: '0px',
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(46, 196, 198, 0.08) 0%, transparent 70%), radial-gradient(ellipse at 80% 80%, rgba(10, 18, 34, 0.9) 0%, transparent 50%)',
        }}
      />
      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: '0px',
          boxShadow: 'inset 0 0 200px rgba(0,0,0,0.7)',
        }}
      />
      {/* Teal accent line */}
      <div
        style={{
          position: 'absolute',
          top: '520px',
          left: '80px',
          right: '80px',
          height: '1px',
          backgroundColor: '#2EC4C6',
          opacity: 0.4,
        }}
      />
      {/* Logo */}
      <div
        style={{
          position: 'absolute',
          top: '40px',
          left: '60px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '6px', color: '#FFFFFF' }}>
          SPACENOMICS
        </span>
      </div>
      {/* Typography zone */}
      <div
        style={{
          position: 'absolute',
          bottom: '340px',
          left: '80px',
          right: '80px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            letterSpacing: '4px',
            color: '#2EC4C6',
            textTransform: 'uppercase',
            marginBottom: '24px',
          }}
        >
          SMOOTH CAPITAL LLC
        </span>
        <span
          style={{
            fontSize: '64px',
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: 1.1,
            marginBottom: '16px',
          }}
        >
          {brief.title}
        </span>
        {brief.subtitle && (
          <span
            style={{
              fontSize: '24px',
              color: '#8B949E',
              lineHeight: 1.3,
              marginBottom: '32px',
            }}
          >
            {brief.subtitle}
          </span>
        )}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            fontSize: '13px',
            color: '#6B7280',
            letterSpacing: '1px',
          }}
        >
          <span>{today}</span>
          <span>Prepared by Smooth Capital LLC</span>
          <span>Spacenomics Venture Brief</span>
        </div>
      </div>
      {/* Bottom shadow */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '300px',
          background: 'linear-gradient(to top, #0A1222 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
