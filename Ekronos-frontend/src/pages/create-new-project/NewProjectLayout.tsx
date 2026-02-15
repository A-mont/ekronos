import { Sidebar } from "@/components/sidebar/Sidebar";
import { CreateNewProject } from "./CreateNewProject";

export default function NewProjectLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#05080f" }}>
      <Sidebar />
      <main style={{ flex: 1 }}>
        < CreateNewProject />
      </main>
    </div>
  );
}
