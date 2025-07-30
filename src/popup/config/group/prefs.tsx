import { useTranslation } from "react-i18next"
import ConfigItem from "../item/base"
import { useStorageStore } from "@/popup/stores/storage"
import TipIcon from "@/components/data/tip-icon"
import Markdown from "react-markdown";
import { memo, useEffect, useMemo, useState } from "react";
import { Select, Spin } from "antd";
import { LoadingOutlined } from '@ant-design/icons'
import { usePrefsStore } from "@/popup/stores/prefs";
import { ConfigItemY } from "../item";

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

  </> : <Spin indicator={<LoadingOutlined spin />} />
})

export default PrefsConfigGroup