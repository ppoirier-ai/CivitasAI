'use client';

/**
 * Pure-CSS satellite scene: Earth + two orbital rings, each carrying a
 * satellite (body + solar panels + blinking beacon), with signal ping arcs.
 * All animation lives in globals.css; respects prefers-reduced-motion.
 */
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

      {/* Orbit ring 1 (solid, outer) with satellite */}
      <div className="orbit-ring" style={{ width: ring1, height: ring1 }} />
      <div
        className="satellite"
        style={{ '--orbit-radius': `${ring1 / 2}px`, '--orbit-duration': '20s' } as React.CSSProperties}
      >
        <div className="satellite-body">
          <span className="satellite-beacon" />
        </div>
      </div>

      {/* Orbit ring 2 (dashed, inner) with faster satellite */}
      <div className="orbit-ring orbit-dashed" style={{ width: ring2, height: ring2 }} />
      <div
        className="satellite"
        style={{
          '--orbit-radius': `${ring2 / 2}px`,
          '--orbit-duration': '13s',
          animationDelay: '-6s',
        } as React.CSSProperties}
      >
        <div className="satellite-body" style={{ transform: 'scale(0.75)' }}>
          <span className="satellite-beacon" />
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
