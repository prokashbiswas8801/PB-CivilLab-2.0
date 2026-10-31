import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { WorkbenchProvider } from './context/WorkbenchContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <WorkbenchProvider>
      <App />
    </WorkbenchProvider>
  </ThemeProvider>
);
