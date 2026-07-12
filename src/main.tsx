import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

document.documentElement.lang = 'ar';
document.documentElement.dir = 'rtl';

document.body.style.direction = 'rtl';

document.body.style.textAlign = 'right';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
