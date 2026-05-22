import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function LineGraph({ title, data, field, unit, color, range }) {
  if (!data || data.length < 2) return null;

  const POINTS = 7;
  const sampled = [];
  for (let i = 0; i < POINTS; i++) {
    const idx = Math.round((i / (POINTS - 1)) * (data.length - 1));
    sampled.push(data[idx]);
  }

  const formatted = sampled.map((d) => ({
    ...d,
    label: new Date(d.timestamp).toLocaleDateString(
      "cs-CZ",
      range === "hour"
        ? { hour: "2-digit", minute: "2-digit" }
        : { day: "numeric", month: "numeric" },
    ),
  }));

  return (
    <div className="ab-graph-card">
      <div className="ab-graph-title">{title}</div>
      <div style={{ width: "100%", height: 140 }}>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart
            data={formatted}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v} ${unit}`}
              width={60}
            />
            <Tooltip
              contentStyle={{
                background: "#2a2b2c",
                border: "none",
                borderRadius: 6,
              }}
              labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}
              itemStyle={{ color, fontSize: 12 }}
              formatter={(v) => [`${v} ${unit}`, title]}
            />
            <Line
              type="monotone"
              dataKey={field}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
