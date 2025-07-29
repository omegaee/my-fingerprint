import { useTranslation } from "react-i18next"
import ConfigItem from "../item/base"
import { useStorageStore } from "@/popup/stores/storage"
import TipIcon from "@/components/data/tip-icon"
import Markdown from "react-markdown";
import { memo, useMemo } from "react";
import { Spin } from "antd";
import { LoadingOutlined } from '@ant-design/icons'
import { usePrefsStore } from "@/popup/stores/prefs";

const LANG_OPTIONS = [
  {
    label: '中文',
    value: 'zh-CN'
  },
  {
    label: 'English',
    value: 'en-US'
  }
]

export const PrefsConfigGroup = memo(() => {
  const [t, i18n] = useTranslation()

  const config = useStorageStore((state) => {
    state.config ?? state.loadStorage()
    return state.config
  })

  const prefs = usePrefsStore()

  const language = useMemo(() => {
    const lang = config?.prefs?.language
    if (lang?.startsWith('zh')) {
      return 'zh-CN';
    } else {
      return 'en-US';
    }
  }, [config])

  const themeOptions = useMemo(() => [
    {
      label: t('item.theme.system'),
      value: 'system'
    }, {
      label: t('item.theme.light'),
      value: 'light'
    }, {
      label: t('item.theme.dark'),
      value: 'dark'
    }
  ], [i18n.language])

  return config ? <>
    <ConfigItem.Select
      title={t('item.title.e-language')}
      action={<TipIcon.Question content={<Markdown>{t('item.desc.e-language')}</Markdown>} />}
      options={LANG_OPTIONS}
      defaultValue={language}
      onChange={(value) => {
        config.prefs.language = value
        prefs.setLanguage(value)
      }}
    />

    <ConfigItem.Select
      title={t('item.title.theme')}
      action={<TipIcon.Question content={<Markdown>{t('item.desc.theme')}</Markdown>} />}
      options={themeOptions}
      defaultValue={config.prefs.theme}
      onChange={(value) => {
        config.prefs.theme = value
        prefs.setTheme(value)
      }}
    />
  </> : <Spin indicator={<LoadingOutlined spin />} />
})

export default PrefsConfigGroup