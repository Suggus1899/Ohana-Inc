import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

declare global {
  interface Window {
    __clearAppFallback?: () => void;
  }
}

// Global error handler to avoid white screen on uncaught errors
window.addEventListener('error', (e) => {
  console.error('[Global Error]', e.error || e.message);
  const root = document.getElementById('root');
  if (!root || root.querySelector('[data-error-ui]')) return;

  root.innerHTML = '';
  const div = document.createElement('div');
  div.setAttribute('data-error-ui', '');
  div.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;padding:20px;text-align:center;background:#f9fafb';

  const icon = document.createElement('div');
  icon.style.cssText = 'width:64px;height:64px;border-radius:50%;background:#1a365d;display:flex;align-items:center;justify-content:center;margin-bottom:16px';
  icon.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  div.appendChild(icon);

  const h1 = document.createElement('h1');
  h1.textContent = 'Algo sali\u00f3 mal';
  h1.style.cssText = 'font-size:1.5rem;font-weight:700;color:#111827;margin-bottom:8px';
  div.appendChild(h1);

  const p = document.createElement('p');
  p.textContent = 'Ocurri\u00f3 un error inesperado. Intenta recargar la p\u00e1gina.';
  p.style.cssText = 'color:#6b7280;margin-bottom:24px;max-width:400px';
  div.appendChild(p);

  const btn1 = document.createElement('button');
  btn1.textContent = 'Recargar p\u00e1gina';
  btn1.style.cssText = 'padding:10px 24px;background:#1a365d;color:white;border:none;border-radius:8px;font-size:0.9rem;cursor:pointer;font-weight:600';
  btn1.addEventListener('click', () => location.reload());
  div.appendChild(btn1);

  const btn2 = document.createElement('button');
  btn2.textContent = 'Limpiar cach\u00e9 y reintentar';
  btn2.style.cssText = 'margin-top:8px;padding:8px 20px;background:transparent;color:#6b7280;border:1px solid #d1d5db;border-radius:8px;font-size:0.85rem;cursor:pointer';
  btn2.addEventListener('click', () => {
    if ('caches' in window) { caches.keys().then(names => names.forEach(n => caches.delete(n).catch(() => {}))).catch(() => {}); }
    localStorage.clear();
    location.reload();
  });
  div.appendChild(btn2);

  root.appendChild(div);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled Rejection]', e.reason);
});

// Clear the HTML fallback timer — app loaded successfully
if (typeof window.__clearAppFallback === 'function') window.__clearAppFallback();
// Remove the loading placeholder
const loadingEl = document.getElementById('app-loading');
if (loadingEl) loadingEl.remove();

createRoot(document.getElementById("root")!).render(<App />);
