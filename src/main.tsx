import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { WorkbenchProvider } from './context/WorkbenchContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <WorkbenchProvider>
    <App />
  </WorkbenchProvider>
);
