'use client';

/**
 * Pure-CSS orbital scene: Earth + two orbital rings, each carrying a
 * detailed SVG communications satellite, with signal ping arcs.
 * All animation lives in globals.css; respects prefers-reduced-motion.
 */

/** Detailed communications satellite — bus, twin solar wings, dish, beacon. */
function SatelliteArt({
  id,
  width = 52,
  height = 32,
}: {
  id: string;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 60"
      width={width}
      height={height}
      className="satellite-art"
      aria-hidden
    >
      <defs>
        <linearGradient id={`bus-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8fafc" />
          <stop offset="0.5" stopColor="#94a3b8" />
          <stop offset="1" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`panel-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e3a8a" />
          <stop offset="0.55" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>

      {/* Solar panel wings */}
      <g fill={`url(#panel-${id})`} stroke="rgba(10,18,34,0.45)" strokeWidth="1">
        <rect x="4" y="20" width="24" height="22" rx="1.5" />
        <rect x="72" y="20" width="24" height="22" rx="1.5" />
      </g>
      {/* Photovoltaic cell grid */}
      <g stroke="rgba(255,255,255,0.26)" strokeWidth="0.8">
        <path d="M10 20v22M16 20v22M22 20v22" />
        <path d="M78 20v22M84 20v22M90 20v22" />
        <path d="M4 27h24M4 34h24M72 27h24M72 34h24" />
      </g>

      {/* Wing mounting arms */}
      <g stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round">
        <path d="M28 31h8M64 31h8" />
      </g>

      {/* Central bus */}
      <rect x="36" y="22" width="28" height="16" rx="3" fill={`url(#bus-${id})`} stroke="rgba(10,18,34,0.5)" strokeWidth="1" />
      {/* Teal instrument stripe */}
      <rect x="47" y="24" width="6" height="12" rx="1" fill="rgba(46,196,198,0.85)" />
      {/* Sensor dots */}
      <circle cx="40" cy="27" r="1.1" fill="rgba(10,18,34,0.45)" />
      <circle cx="40" cy="33" r="1.1" fill="rgba(10,18,34,0.45)" />

      {/* Dish antenna (mounted on bus, facing up) */}
      <g stroke="#cbd5e1" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path d="M36 16a10 10 0 0 1 18 0" />
        <path d="M45 16V11" />
      </g>
      <circle cx="45" cy="10" r="1.3" fill="#e2e8f0" />

      {/* Downlink antenna */}
      <path d="M50 38v6" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
      <circle className="sat-beacon" cx="50" cy="45.5" r="1.5" fill="#2ec4c6" />

      {/* Blinking beacon on the bus */}
      <circle className="sat-beacon" cx="50" cy="19" r="1.9" fill="#5eead4" />
    </svg>
  );
}

export default function SatelliteScene({ size = 340, className = '' }: { size?: number; className?: string }) {
  const earthSize = Math.round(size * 0.52);
  const ring1 = size;
  const ring2 = Math.round(size * 0.78);

  return (
    <div className={`satellite-scene relative ${className}`} style={{ width: size, height: size }} aria-hidden>
      {/* Earth */}
      <div
        className="earth absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: earthSize, height: earthSize }}
      />

      {/* Orbit ring 1 (solid, outer) with detailed satellite */}
      <div className="orbit-ring" style={{ width: ring1, height: ring1 }} />
      <div
        className="satellite"
        style={{ '--orbit-radius': `${ring1 / 2}px`, '--orbit-duration': '20s' } as React.CSSProperties}
      >
        {/* Counter-rotate out of the ring plane so the satellite faces the viewer */}
        <div className="satellite-node" style={{ transform: 'rotateX(68deg)', width: 64, height: 40, margin: '-20px 0 0 -32px' }}>
          <SatelliteArt id="sat-a" width={64} height={40} />
        </div>
      </div>

      {/* Orbit ring 2 (dashed, inner) with smaller satellite */}
      <div className="orbit-ring orbit-dashed" style={{ width: ring2, height: ring2 }} />
      <div
        className="satellite"
        style={{
          '--orbit-radius': `${ring2 / 2}px`,
          '--orbit-duration': '13s',
          animationDelay: '-6s',
        } as React.CSSProperties}
      >
        <div className="satellite-node" style={{ transform: 'rotateX(68deg)', width: 48, height: 30, margin: '-15px 0 0 -24px' }}>
          <SatelliteArt id="sat-b" width={48} height={30} />
        </div>
      </div>

      {/* Signal pings from earth */}
      <div
        className="signal-arc top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: earthSize + 26, height: earthSize + 26 }}
      />
      <div
        className="signal-arc top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: earthSize + 26, height: earthSize + 26, animationDelay: '-1.6s' }}
      />
    </div>
  );
}
