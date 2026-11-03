import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { CivilLabProvider } from './context/CivilLabContext';
import { WorkbenchProvider } from './context/WorkbenchContext';
import { ThemeProvider } from './context/ThemeContext';
import { SiteManagementProvider } from './context/SiteManagementContext';
import { OfflineSyncProvider } from './context/OfflineSyncContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <CivilLabProvider>
      <OfflineSyncProvider>
        <SiteManagementProvider>
          <WorkbenchProvider>
            <App />
          </WorkbenchProvider>
        </SiteManagementProvider>
      </OfflineSyncProvider>
    </CivilLabProvider>
  </ThemeProvider>
);

