import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
// 提前导入主题 store，确保在 React 渲染前应用主题，避免暗色模式白闪
import './store/useThemeStore'
import App from './app/App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
