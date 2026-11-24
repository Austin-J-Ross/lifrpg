import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { AppProvider } from '../state/AppProvider';
import type { AppState } from '../domain/models';
import { AppLayout } from './AppLayout';
import { HomePage } from '../pages/HomePage';
import { AboutPage } from '../pages/AboutPage';
import { BackupsPage } from '../pages/BackupsPage';
import { ClassesPage } from '../pages/ClassesPage';
import { QuestsPage } from '../pages/QuestsPage';
import { PhysicalStatsPage } from '../pages/PhysicalStatsPage';
import { MentalStatsPage } from '../pages/MentalStatsPage';
export function App({ demoState }: { demoState?: AppState }) {
  return (
    <AppProvider demoState={demoState}>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home" element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="backups" element={<BackupsPage />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="quests" element={<QuestsPage />} />
            <Route path="physical" element={<PhysicalStatsPage />} />
            <Route path="mental" element={<MentalStatsPage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
