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

    /**
     * 获取支持的语言
     */
    const getLanguage = (lang?: string) => {
      if (lang?.startsWith('zh')) {
        return 'zh-CN';
      } else {
        return 'en-US';
      }
    }

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
      language: getLanguage(navigator.language),

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
        i18n.changeLanguage(getLanguage(get().language))
      },
      setLanguage: (language: string) => {
        const lang = getLanguage(language)
        i18n.changeLanguage(lang)
        set({ language: lang })
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