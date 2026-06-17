import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

window.addEventListener('error', (e) => {
  document.body.innerHTML = '<div style="color:red;padding:20px;font-family:monospace;z-index:9999;position:fixed;top:0;left:0;background:white;width:100%;height:100%;"><pre>Error: ' + e.message + '\n' + (e.error?.stack || '') + '</pre></div>';
});

window.addEventListener('unhandledrejection', (e) => {
  document.body.innerHTML = '<div style="color:red;padding:20px;font-family:monospace;z-index:9999;position:fixed;top:0;left:0;background:white;width:100%;height:100%;"><pre>Unhandled Promise Rejection: ' + e.reason + '\n' + (e.reason?.stack || '') + '</pre></div>';
});

createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>,
)
