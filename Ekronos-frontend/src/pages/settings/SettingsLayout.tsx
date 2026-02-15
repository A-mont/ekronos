import { Sidebar } from "@/components/sidebar/Sidebar";
import { SettingsPage } from "./SettingsPage";

export default function SettingsLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#05080f" }}>
      <Sidebar />
      <main style={{ flex: 1 }}>
        <SettingsPage/>
      </main>
    </div>
  );
}
