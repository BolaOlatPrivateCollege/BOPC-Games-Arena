import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      // If there's an active waiting service worker, tell it to skip waiting so it can activate
      if (registration.waiting) {
        try { registration.waiting.postMessage({ type: 'SKIP_WAITING' }) } catch (e) {}
      }

      registration.addEventListener('updatefound', () => {
        const newSW = registration.installing
        if (!newSW) return
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            // New update available; ask it to skip waiting
            try { newSW.postMessage({ type: 'SKIP_WAITING' }) } catch (e) {}
          }
        })
      })

      // When the new SW takes control, refresh the page to load the new assets
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return
        refreshing = true
        try {
          const notice = document.createElement('div')
          notice.style = 'position:fixed;left:50%;transform:translateX(-50%);top:8px;z-index:9999;padding:10px 14px;background:#111827;color:#fff;border-radius:8px;font-weight:600;box-shadow:0 6px 18px rgba(15,23,42,0.4)'
          notice.innerText = 'New version available. Refreshing...'
          document.body.appendChild(notice)
        } catch (e) {}
        setTimeout(() => window.location.reload(true), 1200)
      })
    }).catch((error) => {
      console.warn('Service worker registration failed:', error)
    })
  })
}
