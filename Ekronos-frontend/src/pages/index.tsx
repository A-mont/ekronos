import { Route, Routes } from 'react-router-dom';
import LandingPage from './landing/Landing';
import { CreatorStudioDashboard } from './creator';
import { NewProjectLayout } from './create-new-project';
import { SettingsLayout } from './settings';
import { AnalitycsLayout } from './analytics';
import { MyProjectsLayout } from './my-projects';
import AgentsLayout from './agentic-ai/AgentLayout';
import { NotFoundPage } from './NotFound';

const routes = [
  { path: '/', Page: LandingPage },
  { path: '/dashboard', Page: CreatorStudioDashboard },
  { path: '/dashboard/new', Page: NewProjectLayout },
  { path: '/dashboard/settings', Page: SettingsLayout },
  { path: '/dashboard/analytics', Page: AnalitycsLayout },
  { path: '/dashboard/projects', Page: MyProjectsLayout },
  { path: '/dashboard/agents', Page: AgentsLayout },
];

function Routing() {
  const getRoutes = () => routes.map(({ path, Page }) => <Route key={path} path={path} element={<Page />} />);

  return (
    <Routes>
      {getRoutes()}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export { Routing };
