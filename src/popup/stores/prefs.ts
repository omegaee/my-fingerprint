import i18n from "@/locales"
import { theme, type ThemeConfig } from "antd"
import { create } from "zustand"
import { persist, createJSONStorage } from 'zustand/middleware'

type Theme = LocalStorageConfig['prefs']['theme']

type State = {
  theme: Theme
  language: string
}

type Actions = {
  setTheme: (theme: Theme) => void
  getThemeConfig: () => ThemeConfig

  initLanguage: () => void
  setLanguage: (language: string) => void
}

export const usePrefsStore = create<State & Actions>()(
  persist((set, get) => {

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
    const isDarkTheme = () => {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
    }

    return {
      theme: 'system',
      language: navigator.language,

      setTheme: (theme: Theme) => set({ theme }),
      getThemeConfig: () => {
        switch (get().theme) {
          case 'dark':
            return darkTheme
          case 'light':
            return lightTheme
          default:
            return isDarkTheme() ? darkTheme : lightTheme
        }
      },

      initLanguage: () => {
        if (get().language?.startsWith('zh')) {
          i18n.changeLanguage('zh-CN')
        } else {
          i18n.changeLanguage('en-US')
        }
      },
      setLanguage: (language: string) => {
        if (language?.startsWith('zh')) {
          i18n.changeLanguage('zh-CN')
        } else {
          i18n.changeLanguage('en-US')
        }
        set({ language })
      }
    }
  }, {
    version: 1,
    name: "prefs",
    storage: createJSONStorage(() => localStorage),
    partialize: (s) => ({
      theme: s.theme,
      language: s.language
    }) as any
  })
)