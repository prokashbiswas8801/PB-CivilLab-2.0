import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { CivilLabProvider } from './context/CivilLabContext';
import { WorkbenchProvider } from './context/WorkbenchContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <CivilLabProvider>
      <WorkbenchProvider>
        <App />
      </WorkbenchProvider>
    </CivilLabProvider>
  </ThemeProvider>
);

