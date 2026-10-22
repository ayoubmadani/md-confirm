import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App.jsx'
import { AuthProvider } from './lib/auth.jsx'
import './index.css'

// خانات الأرقام: عجلة الفأرة لا تغيّر القيمة — نُخرج التركيز فتتحرك الصفحة بدلها
document.addEventListener('wheel', () => {
  const el = document.activeElement;
  if (el instanceof HTMLInputElement && el.type === 'number') el.blur();
}, { passive: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-center" richColors dir="rtl" />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
