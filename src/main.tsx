import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthAdapter } from './components/AuthAdapter'
import App from './App.tsx'
import './index.css'
import { setWordPressAuthToken } from './services/api'

const WORDPRESS_ORIGINS = (import.meta.env.VITE_WORDPRESS_ORIGIN ||
  'http://sm-lms-test.local,https://sm-lms-test.local')
  .split(',')
  .map((o: string) => o.trim())
  .filter(Boolean)

window.addEventListener('message', (event: MessageEvent) => {
  if (!WORDPRESS_ORIGINS.includes(event.origin)) return

  const msg = event.data as { type?: string; token?: string; source?: string } | null
  if (!msg || msg.type !== 'LMS_WP_AUTH' || !msg.token || msg.source !== 'wordpress') return

  if (import.meta.env.DEV) {
    console.log('[LMS] WordPress token received via postMessage')
  }
  setWordPressAuthToken(msg.token)
  window.dispatchEvent(new CustomEvent('lms:wp-auth-updated'))
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthAdapter>
      <App />
    </AuthAdapter>
  </React.StrictMode>,
)
