/* ── Gauge card with SVG arc ─────────────────────────── */
export function GaugeCard({ label, value, unit, color, max, current }) {
  const pct = Math.min(current / max, 1);

  const r = 68,
    cx = 84,
    cy = 88;
  const startAngle = -210,
    endAngle = 30;
  const toRad = (d) => (d * Math.PI) / 180;
  const arc = (a) => [cx + r * Math.cos(toRad(a)), cy + r * Math.sin(toRad(a))];
  const totalAngle = endAngle - startAngle;
  const currentAngle = startAngle + totalAngle * pct;

  const [sx, sy] = arc(startAngle);
  const [ex, ey] = arc(currentAngle);
  const largeArc = totalAngle * pct > 180 ? 1 : 0;

  const [tsx, tsy] = arc(startAngle);
  const [tex, tey] = arc(endAngle);

  return (
    <div className="ab-gauge-wrapper" style={{ userSelect: "none" }}>
      {/* Label nad rámečkem */}
      <span className="ab-gauge-label-above" style={{ userSelect: "none" }}>
        {label}
      </span>

      <div className="ab-gauge-card" style={{ userSelect: "none" }}>
        {/* SVG arc */}
        <svg
          width="168"
          height="108"
          viewBox="0 0 168 108"
          style={{ overflow: "visible", userSelect: "none", display: "block" }}
        >
          {/* Track */}
          <path
            d={`M ${tsx} ${tsy} A ${r} ${r} 0 1 1 ${tex} ${tey}`}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Progress */}
          {pct > 0 && (
            <path
              d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Value + unit inline below the arc */}
        <div className="ab-gauge-value" style={{ userSelect: "none" }}>
          {value} <span className="ab-gauge-unit">{unit}</span>
        </div>
      </div>
    </div>
  );
}
