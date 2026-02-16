import { Sidebar } from '@/components/sidebar/Sidebar';
import { AgentsPage } from './AgentsPage';

export default function AgentsLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#05080f' }}>
      <Sidebar />
      <main style={{ flex: 1 }}>
        <AgentsPage />
      </main>
    </div>
  );
}
