import { Sidebar } from '@/components/sidebar/Sidebar';
import { MyProjects } from './MyProjects';

export default function MyProjectsLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#05080f' }}>
      <Sidebar />
      <main style={{ flex: 1 }}>
        <MyProjects />
      </main>
    </div>
  );
}
