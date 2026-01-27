import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 开发环境加载调试工具
if (import.meta.env.DEV) {
  import('./utils/debugAuth.js');
  import('./utils/apiTest.js');
  import('./utils/couponIssueDebug.js');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
