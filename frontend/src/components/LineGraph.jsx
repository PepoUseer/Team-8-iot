/**
 * Lightweight SVG line graph – no external charting lib needed.
 * Props:
 *   title   – string
 *   data    – array of { timestamp, [field]: number }
 *   field   – key name in data items
 *   unit    – string suffix
 *   color   – stroke colour
 */
export function LineGraph({ title, data, field, unit, color }) {
  if (!data || data.length < 2) return null;

  const W = 360,
    H = 160,
    PAD = { top: 12, right: 12, bottom: 28, left: 44 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const values = data.map((d) => d[field]);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const xScale = (i) => PAD.left + (i / (data.length - 1)) * innerW;
  const yScale = (v) => PAD.top + innerH - ((v - minV) / range) * innerH;

  // Build polyline points
  const points = data
    .map((d, i) => `${xScale(i)},${yScale(d[field])}`)
    .join(" ");

  // Y-axis labels (3 ticks)
  const ticks = [minV, minV + range / 2, maxV].map((v, i) => ({
    y: yScale(v),
    label: Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1),
  }));

  // X-axis labels (first, mid, last)
  const xLabels = [0, Math.floor((data.length - 1) / 2), data.length - 1].map(
    (i) => ({
      x: xScale(i),
      label: new Date(data[i].timestamp).toLocaleDateString("cs-CZ", {
        day: "numeric",
        month: "numeric",
      }),
    }),
  );

  return (
    <div className="ab-graph-card">
      <div className="ab-graph-title">{title}</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        {/* Grid lines */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={t.y}
            y2={t.y}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
          />
        ))}

        {/* Y labels */}
        {ticks.map((t, i) => (
          <text
            key={i}
            x={PAD.left - 6}
            y={t.y + 4}
            textAnchor="end"
            fill="rgba(255,255,255,0.4)"
            fontSize="10"
            fontFamily="var(--font-body)"
          >
            {t.label} {unit}
          </text>
        ))}

        {/* X labels */}
        {xLabels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={H - 4}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="10"
            fontFamily="var(--font-body)"
          >
            {l.label}
          </text>
        ))}

        {/* Area fill */}
        <polyline
          points={`${xScale(0)},${PAD.top + innerH} ${points} ${xScale(data.length - 1)},${PAD.top + innerH}`}
          fill={color}
          fillOpacity="0.08"
          stroke="none"
        />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Last point dot */}
        <circle
          cx={xScale(data.length - 1)}
          cy={yScale(values[values.length - 1])}
          r="4"
          fill={color}
        />
      </svg>
    </div>
  );
}
