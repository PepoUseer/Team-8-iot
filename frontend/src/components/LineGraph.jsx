/**
 * LineGraph — charts.css powered line chart
 *
 * Props:
 *   title   – string
 *   data    – array of { timestamp: number, [field]: number }
 *   field   – key name in data items
 *   unit    – string suffix
 *   color   – CSS color string (used for the line accent)
 */
export function LineGraph({ title, data, field, unit, color }) {
  if (!data || data.length < 2) return null;

  // Downsample to exactly 7 evenly-spaced points for the chart
  const POINTS = 7;
  const sampled = [];
  for (let i = 0; i < POINTS; i++) {
    const idx = Math.round((i / (POINTS - 1)) * (data.length - 1));
    sampled.push(data[idx]);
  }

  const values = sampled.map((d) => d[field]).filter((v) => v != null);
  if (values.length < 2) return null;

  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  // charts.css needs --size: value between 0 and 1 (relative to chart height)
  // We add a 10% padding so the line doesn't clip at edges
  const PAD = 0.1;
  const normalize = (v) => PAD + ((v - minV) / range) * (1 - 2 * PAD);

  // Y-axis labels: 5 ticks from min to max
  const TICKS = 5;
  const yTicks = Array.from({ length: TICKS }, (_, i) => {
    const v = minV + (i / (TICKS - 1)) * range;
    return Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1);
  });

  // X-axis labels: timestamps from sampled points
  const xLabels = sampled.map((d) =>
    new Date(d.timestamp).toLocaleDateString("cs-CZ", {
      day: "numeric",
      month: "numeric",
    }),
  );

  const cssId = `chart-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="ab-graph-card">
      <div className="ab-graph-title">{title}</div>

      <div className="ab-linegraph-wrap">
        {/* Y-axis labels */}
        <div className="ab-linegraph-yaxis">
          {[...yTicks].reverse().map((label, i) => (
            <span key={i} className="ab-linegraph-ylabel">
              {label} {unit}
            </span>
          ))}
        </div>

        {/* charts.css table */}
        <div className="ab-linegraph-chart-wrap">
          <style>{`
            #${cssId} {
              --color: ${color};
              --labels-size: 0px;
              --legend-inline-size: 0px;
            }
            #${cssId} tbody td {
              color: ${color};
            }
          `}</style>

          <table
            id={cssId}
            className="charts-css line show-data-axes show-primary-axis"
          >
            <caption style={{ display: "none" }}>{title}</caption>
            <thead>
              <tr>
                <th scope="col">Label</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {sampled.map((d, i) => {
                const val = d[field];
                const size = val != null ? normalize(val) : 0;
                const prevVal = i > 0 ? sampled[i - 1][field] : val;
                const prevSize = prevVal != null ? normalize(prevVal) : size;
                return (
                  <tr key={i}>
                    <th scope="row">{xLabels[i]}</th>
                    <td
                      style={{
                        "--size": size,
                        "--start": prevSize,
                      }}
                    >
                      <span className="data">
                        {val != null
                          ? Number.isInteger(val)
                            ? val.toFixed(0)
                            : val.toFixed(1)
                          : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* X-axis labels below */}
          <div className="ab-linegraph-xaxis">
            {xLabels.map((label, i) => (
              <span key={i} className="ab-linegraph-xlabel">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
