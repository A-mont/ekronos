import { Sidebar } from "@/components/sidebar/Sidebar";
import { AnalyticsPage } from "./AnalyticsPage";

export default function AnalitycsLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#05080f" }}>
      <Sidebar />
      <main style={{ flex: 1 }}>
        < AnalyticsPage />
      </main>
    </div>
  );
}
