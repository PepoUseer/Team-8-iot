import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Pevné intervaly podle rozsahu
const INTERVAL_MS = {
  hour: 10 * 60 * 1000, // každých 10 minut
  day: 4 * 60 * 60 * 1000, // každé 4 hodiny
  week: 24 * 60 * 60 * 1000, // každý den
  month: 5 * 24 * 60 * 60 * 1000, // každých 5 dní
};

function formatLabel(timestamp, range) {
  const d = new Date(timestamp);
  if (range === "hour" || range === "day") {
    return d.toLocaleTimeString("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (range === "week") {
    return d.toLocaleDateString("cs-CZ", {
      weekday: "short",
      day: "numeric",
      month: "numeric",
    });
  }
  return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" });
}

// Najde nejbližší datový bod k danému timestampu
function findNearest(data, timestamp) {
  return data.reduce((prev, curr) =>
    Math.abs(curr.timestamp - timestamp) < Math.abs(prev.timestamp - timestamp)
      ? curr
      : prev,
  );
}

export function LineGraph({ title, data, field, unit, color, range }) {
  if (!data || data.length < 2) return null;

  const interval = INTERVAL_MS[range] ?? INTERVAL_MS.day;
  const start = data[0].timestamp;
  const end = data[data.length - 1].timestamp;

  // Vygeneruj pevné časové body
  const ticks = [];
  for (let t = start; t <= end; t += interval) {
    ticks.push(t);
  }
  // Vždy zahrň poslední bod
  if (ticks[ticks.length - 1] < end) ticks.push(end);

  // Pro každý tick najdi nejbližší datový bod
  const formatted = ticks.map((t) => {
    const nearest = findNearest(data, t);
    return {
      ...nearest,
      timestamp: t,
      label: formatLabel(t, range),
    };
  });

  return (
    <div className="ab-graph-card">
      <div className="ab-graph-title">{title}</div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={formatted}
            margin={{ top: 8, right: 8, left: -25, bottom: 0 }}
          >
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 15 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 15 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v} ${unit}`}
              width={72}
            />
            <Tooltip
              contentStyle={{
                background: "#2a2b2c",
                border: "none",
                borderRadius: 6,
              }}
              labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}
              itemStyle={{ color, fontSize: 14 }}
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
