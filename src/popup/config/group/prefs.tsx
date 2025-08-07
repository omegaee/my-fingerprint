import { useTranslation } from "react-i18next"
import { useStorageStore } from "@/popup/stores/storage"
import TipIcon from "@/components/data/tip-icon"
import Markdown from "react-markdown";
import { memo, useMemo } from "react";
import { Select, Spin } from "antd";
import { LoadingOutlined } from '@ant-design/icons'
import { usePrefsStore } from "@/popup/stores/prefs";
import { ConfigItemY } from "../item";
import { useShallow } from "zustand/shallow";

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

  const { config, version } = useStorageStore(useShallow((s) => ({
    config: s.config,
    version: s.version,
  })))

  const prefs = usePrefsStore()

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

  return config ? <div key={version}>

    <ConfigItemY
      label={t('item.title.e-language')}
      endContent={<TipIcon.Question content={<Markdown>{t('item.desc.e-language')}</Markdown>} />}
    >
      <Select
        options={LANG_OPTIONS}
        value={prefs.language}
        onChange={(value) => {
          config.prefs.language = value
          prefs.setLanguage(value)
        }}
      />
    </ConfigItemY>

    <ConfigItemY
      label={t('item.title.theme')}
      endContent={<TipIcon.Question content={<Markdown>{t('item.desc.theme')}</Markdown>} />}
    >
      <Select
        options={themeOptions}
        value={prefs.theme}
        onChange={(value) => {
          config.prefs.theme = value
          prefs.setTheme(value)
        }}
      />
    </ConfigItemY>

  </div> : <Spin indicator={<LoadingOutlined spin />} />
})

export default PrefsConfigGroup