import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#05080f',
        color: '#e5eefc',
        padding: 24,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 560 }}>
        <div style={{ color: '#22d3ee', letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: 12 }}>404</div>
        <h1 style={{ margin: '10px 0 0', fontSize: 42 }}>Page not found</h1>
        <p style={{ marginTop: 10, color: '#94a3b8' }}>
          This route is not available in the current EkonOS demo build.
        </p>
        <Button asChild style={{ marginTop: 16 }} className="text-[#082032] [background:linear-gradient(135deg,#22d3ee,#60a5fa)]">
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
