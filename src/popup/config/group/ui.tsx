import { useTranslation } from "react-i18next"
import ConfigItem from "../item/base"
import { useStorageStore } from "@/popup/stores/storage"
import TipIcon from "@/components/data/tip-icon"
import Markdown from "react-markdown";
import { memo, useMemo } from "react";
import { Spin } from "antd";
import { LoadingOutlined } from '@ant-design/icons'

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

export const UiConfigGroup = memo(() => {
  const [t, i18n] = useTranslation()

  const config = useStorageStore((state) => {
    state.config ?? state.loadStorage()
    return state.config
  })

  const language = useMemo(() => {
    const values = LANG_OPTIONS.map((item) => item.value)
    if (!config?.language) return 'zh-CN'
    if (values.includes(config.language)) {
      return config.language
    } else {
      const prefix = config.language.split(':')[0]
      return values.find((item) => item.split(':')[0] === prefix) ?? 'zh-CN'
    }
  }, [config])

  return config ? <>
    <ConfigItem.Select
      title={t('item.title.e-language')}
      action={<TipIcon.Question content={<Markdown>{t('item.desc.e-language')}</Markdown>} />}
      options={LANG_OPTIONS}
      defaultValue={language}
      onChange={(value) => {
        config.language = value
        i18n.changeLanguage(value)
      }}
    />
  </> : <Spin indicator={<LoadingOutlined spin />} />
})

export default UiConfigGroup