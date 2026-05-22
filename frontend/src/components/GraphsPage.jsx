import { LineGraph } from "@/components/LineGraph";

/**
 * GraphsPage
 *
 * Props:
 *   history    – array of { timestamp, co2, temperature, humidity, pressure }
 *   graphRange – "day" | "week" | "month"
 *   onRangeChange – (range: string) => void
 *   loading    – boolean
 */
export function GraphsPage({ history, graphRange, onRangeChange, loading }) {
  const ranges = ["hour", "day", "week", "month"];

  return (
    <div style={{ padding: "0 24px 24px" }}>
      {/* Timeframe selector */}
      <div className="ab-graph-timeframe">
        <span className="ab-graph-timeframe-label">view</span>
        {ranges.map((range) => (
          <button
            key={range}
            onClick={() => onRangeChange && onRangeChange(range)}
            className={`ab-graph-range-btn${graphRange === range ? " active" : ""}`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && <div className="ab-graph-empty">Loading…</div>}

      {/* Empty state */}
      {!loading && (!history || history.length < 2) && (
        <div className="ab-graph-empty">
          No data for the selected range ({graphRange}).
        </div>
      )}

      {/* Grid of 4 graphs */}
      {!loading && history && history.length >= 2 && (
        <div className="ab-graph-grid">
          <LineGraph
            title="CO2 concentration"
            data={history}
            field="co2"
            unit="ppm"
            color="#f97316"
            range={graphRange}
          />
          <LineGraph
            title="Temperature"
            data={history}
            field="temperature"
            unit="°C"
            color="#3b82f6"
            range={graphRange}
          />
          <LineGraph
            title="Humidity"
            data={history}
            field="humidity"
            unit="%"
            color="#ef4444"
            range={graphRange}
          />
          <LineGraph
            title="Barometric pressure"
            data={history}
            field="pressure"
            unit="hPa"
            color="#22c55e"
            range={graphRange}
          />
        </div>
      )}
    </div>
  );
}
