import './my-projects.css';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type ProjectStatus = 'Live' | 'Beta' | 'Planned';

type ProjectItem = {
  id: string;
  name: string;
  type: string;
  status: ProjectStatus;
  tvl: string;
  holders: number;
  updatedAt: string;
};

const projects: ProjectItem[] = [
  {
    id: 'ekr-001',
    name: 'NexToken Economy',
    type: 'DeFi',
    status: 'Live',
    tvl: '$1.2M',
    holders: 1284,
    updatedAt: 'Feb 16, 2026',
  },
  {
    id: 'ekr-002',
    name: 'GuildPulse Rewards',
    type: 'Community',
    status: 'Beta',
    tvl: '$410K',
    holders: 683,
    updatedAt: 'Feb 15, 2026',
  },
  {
    id: 'ekr-003',
    name: 'Arcade Credits',
    type: 'Game',
    status: 'Planned',
    tvl: '$0',
    holders: 0,
    updatedAt: 'Feb 14, 2026',
  },
];

function statusClass(status: ProjectStatus) {
  if (status === 'Live') return 'is-live';
  if (status === 'Beta') return 'is-beta';
  return 'is-planned';
}

function MyProjects() {
  return (
    <section className="mp">
      <header className="mp__head">
        <div>
          <div className="mp__kicker">Portfolio</div>
          <h1>My Projects</h1>
          <p>Track launched and upcoming token economies in one place.</p>
        </div>
      </header>

      <div className="mp__tableWrap">
        <Table className="mp__table" aria-label="Project list">
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>TVL</TableHead>
              <TableHead>Holders</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <div className="mp__projectName">{project.name}</div>
                  <div className="mp__projectId">{project.id}</div>
                </TableCell>
                <TableCell>{project.type}</TableCell>
                <TableCell>
                  <span className={`mp__status ${statusClass(project.status)}`}>{project.status}</span>
                </TableCell>
                <TableCell>{project.tvl}</TableCell>
                <TableCell>{project.holders.toLocaleString()}</TableCell>
                <TableCell>{project.updatedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export { MyProjects };
