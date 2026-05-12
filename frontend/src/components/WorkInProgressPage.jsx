/**
 * WorkInProgressPage
 *
 * Placeholder displayed on the /graphs route while the feature is not yet
 * ready for production. Import and use this component ONLY in development /
 * staging builds — never ship it to production.
 *
 * Usage in App.jsx (dev only):
 *   import { WorkInProgressPage } from "@/components/WorkInProgressPage";
 *   // replace <DashboardPage> on the /graphs route with <WorkInProgressPage>
 */
export function WorkInProgressPage() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "64px 24px",
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: 48 }}>🚧</span>
      <h2
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "22px",
          fontWeight: 700,
          color: "var(--ab-text)",
          margin: 0,
        }}
      >
        Work in progress
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "15px",
          color: "var(--ab-placeholder)",
          maxWidth: 380,
          margin: 0,
        }}
      >
        The graphs view is still being worked on. Check back later!
      </p>
    </div>
  );
}
