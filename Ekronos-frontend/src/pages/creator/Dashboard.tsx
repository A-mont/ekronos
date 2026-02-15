import { Sidebar } from "@/components/sidebar/Sidebar";
import { CreatorStudio } from "./CreatorStudio";

export default function CreatorStudioDashboard() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#05080f" }}>
      <Sidebar />
      <main style={{ flex: 1 }}>
        <CreatorStudio />
      </main>
    </div>
  );
}
