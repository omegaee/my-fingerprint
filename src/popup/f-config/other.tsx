import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import FWorkItem from "./item/work"
import FConfigItem from "./item/base"
import { msgSetConfig } from "@/message/runtime"

const langOptions = [
  {
    label: '中文',
    value: 'zh-CN'
  },
  {
    label: 'English',
    value: 'en-US'
  }
]

export type OtherConfigProps = {
  tab?: chrome.tabs.Tab
  config?: Partial<LocalStorageConfig>
}

export const OtherConfig = ({ config }: OtherConfigProps) => {
  const [t, i18n] = useTranslation()

  const langValue = useMemo(() => {
    const langValues = langOptions.map((item) => item.value)
    if (!config?.language) return 'zh-CN'
    if (langValues.includes(config.language)) {
      return config.language
    } else {
      const prefix = config.language.split(':')[0]
      return langValues.find((item) => item.split(':')[0] === prefix) ?? 'zh-CN'
    }
  }, [config])

  return <section className="flex flex-col gap-2">
    <FConfigItem.Select<string> title={t('item.title.e-language')}
      desc={t('item.desc.e-language')}
      options={langOptions}
      defaultValue={langValue}
      onChangeOption={(value) => {
        msgSetConfig({ language: value })
        i18n.changeLanguage(value)
      }} />

    <FWorkItem.Input keyPrefix='customSeed'
      title={t('item.title.seed')}
      desc={t('item.desc.seed')}
      value={config?.customSeed} />

    <FWorkItem.Switch keyPrefix='hookNetRequest'
      title={t('item.title.hook-net-request')}
      desc={t('item.desc.hook-net-request')}
      value={config?.hookNetRequest} />

    <FWorkItem.Switch keyPrefix='hookBlankIframe'
      title={t('item.title.hook-blank-iframe')}
      desc={t('item.desc.hook-blank-iframe')}
      value={config?.hookBlankIframe} />
  </section>
}

export default OtherConfig