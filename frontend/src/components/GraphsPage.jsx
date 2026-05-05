import { LineGraph } from "@/components/LineGraph";

export function GraphsPage({ history, graphRange }) {
  // Show an empty-state message when the filtered window has no data yet.
  // With mock data this only appears briefly on "day" since all points are
  // generated within the last few minutes; with real data it covers gaps.
  if (!history || history.length < 2) {
    return (
      <div
        style={{
          padding: "48px 24px",
          textAlign: "center",
          fontFamily: "var(--font-body)",
          fontSize: "14px",
          color: "var(--ab-text-dim)",
        }}
      >
        No data for the selected range ({graphRange}).
      </div>
    );
  }

  return (
    <div className="ab-graph-grid">
      <LineGraph
        title="CO2 concentration"
        data={history}
        field="co2"
        unit="ppm"
        color="#f97316"
      />
      <LineGraph
        title="Temperature"
        data={history}
        field="temperature"
        unit="°C"
        color="#3b82f6"
      />
      <LineGraph
        title="Humidity"
        data={history}
        field="humidity"
        unit="%"
        color="#ef4444"
      />
      <LineGraph
        title="Barometric pressure"
        data={history}
        field="pressure"
        unit="hPa"
        color="#22c55e"
      />
    </div>
  );
}
