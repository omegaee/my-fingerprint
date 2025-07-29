import React from 'react'
import ReactDOM from 'react-dom/client'
import Application from './App'
import './index.css'
import '@/locales'
import { App, ConfigProvider } from 'antd'
import { usePrefsStore } from './stores/prefs'

function MainApp() {
  const prefs = usePrefsStore()

  return <ConfigProvider theme={prefs.getThemeConfig()}>
    <App>
      <Application />
    </App>
  </ConfigProvider>
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>,
)
