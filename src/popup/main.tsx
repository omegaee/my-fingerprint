import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import '@/locales'
import { ConfigProvider, theme } from 'antd'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider theme={{
      // token: {
      //   colorBgBase: "#4a4a4a"
      // },
      // algorithm: theme.darkAlgorithm
    }}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
