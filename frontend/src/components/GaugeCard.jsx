/* ── Gauge card with SVG arc ─────────────────────────── */
export function GaugeCard({ label, value, unit, color, max, current }) {
  const pct = Math.min(current / max, 1);
  // Arc params
  const r = 52,
    cx = 64,
    cy = 64;
  const startAngle = -210,
    endAngle = 30; // degrees
  const toRad = (d) => (d * Math.PI) / 180;
  const arc = (a) => [cx + r * Math.cos(toRad(a)), cy + r * Math.sin(toRad(a))];
  const totalAngle = endAngle - startAngle; // 240
  const currentAngle = startAngle + totalAngle * pct;

  const [sx, sy] = arc(startAngle);
  const [ex, ey] = arc(currentAngle);
  const largeArc = totalAngle * pct > 180 ? 1 : 0;

  // Track arc (grey)
  const [tsx, tsy] = arc(startAngle);
  const [tex, tey] = arc(endAngle);

  return (
    <div className="ab-gauge-card">
      <span className="ab-gauge-label">{label}</span>
      <svg
        width="128"
        height="90"
        viewBox="0 0 128 90"
        style={{ overflow: "visible" }}
      >
        {/* Track */}
        <path
          d={`M ${tsx} ${tsy} A ${r} ${r} 0 1 1 ${tex} ${tey}`}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Progress */}
        {pct > 0 && (
          <path
            d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
          />
        )}
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fill="#fff"
          fontSize="20"
          fontWeight="700"
          fontFamily="var(--font-body)"
        >
          {value}
        </text>
        <text
          x={cx}
          y={cy + 22}
          textAnchor="middle"
          fill="var(--ab-placeholder)"
          fontSize="11"
          fontFamily="var(--font-body)"
        >
          {unit}
        </text>
      </svg>
    </div>
  );
}
