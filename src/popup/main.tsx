import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import '@/locales'
import { ConfigProvider, theme, type ThemeConfig } from 'antd'

const darkTheme: ThemeConfig = {
  cssVar: true,
  token: {
    borderRadius: 4,
    wireframe: false,
    // colorBgBase: "#4a4a4a",
    colorPrimary: "#3ddca6",
    colorInfo: "#3ddca6",
  },
  algorithm: theme.darkAlgorithm,
}

const lightTheme: ThemeConfig = {
  cssVar: true,
  token: {
    borderRadius: 4,
    wireframe: false,
    colorPrimary: "#1fc18a",
    colorInfo: "#1fc18a",
  },
}

/**
 * 获取当前系统是否黑暗模式
 */
const isDarkTheme = function () {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider theme={isDarkTheme() ? darkTheme : lightTheme}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
