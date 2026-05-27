import { useTranslation } from "react-i18next"
import { useStorageStore } from "@/popup/stores/storage"
import TipIcon from "@/components/data/tip-icon"
import { memo, useMemo } from "react";
import { Select, Spin } from "antd";
import { LoadingOutlined } from '@ant-design/icons'
import { usePrefsStore } from "@/popup/stores/prefs";
import { ConfigDesc, ConfigItemY } from "../item";
import { useShallow } from "zustand/shallow";
import { logManager } from "@/utils/log";

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

const LOG_LEVEL_OPTIONS = [
  { label: '1 - DEBUG', value: 'DEBUG' },
  { label: '2 - INFO', value: 'INFO' },
  { label: '3 - WARN', value: 'WARN' },
  { label: '4 - ERROR', value: 'ERROR' },
  { label: '5 - NONE', value: 'NONE' }
]

const nsImportTag = ['unsupport-import']

export const PrefsConfigGroup = memo(() => {
  const [t, i18n] = useTranslation()

  const { config, saveConfig } = useStorageStore(useShallow((s) => ({
    version: s.version,
    config: s.config,
    saveConfig: s.saveConfig,
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

  return config ? <div key={String(!!config)}>

    <ConfigItemY
      label={t('item.title.e-language')}
      endContent={<TipIcon.Question content={<ConfigDesc tags={nsImportTag} desc={t('item.desc.e-language')} />} />}
    >
      <Select
        options={LANG_OPTIONS}
        value={prefs.language}
        onChange={(value) => {
          config.prefs.language = value
          saveConfig()
          prefs.setLanguage(value)
        }}
      />
    </ConfigItemY>

    <ConfigItemY
      label={t('item.title.theme')}
      endContent={<TipIcon.Question content={<ConfigDesc tags={nsImportTag} desc={t('item.desc.theme')} />} />}
    >
      <Select
        options={themeOptions}
        value={prefs.theme}
        onChange={(value) => {
          config.prefs.theme = value
          saveConfig()
          prefs.setTheme(value)
        }}
      />
    </ConfigItemY>

    <ConfigItemY
      label={t('item.title.log-level')}
      endContent={<TipIcon.Question content={<ConfigDesc tags={nsImportTag} desc={t('item.desc.log-level')} />} />}
    >
      <Select
        options={LOG_LEVEL_OPTIONS}
        value={config.prefs.logLevel}
        onChange={(value) => {
          config.prefs.logLevel = value
          saveConfig()
          logManager.setLevel(value);
        }}
      />
    </ConfigItemY>

  </div> : <Spin indicator={<LoadingOutlined spin />} />
})

export default PrefsConfigGroup