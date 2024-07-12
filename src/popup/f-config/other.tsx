import { useDebounceCallback } from "@/utils/hooks"
import { Input, Typography } from "antd"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import FWorkInputItem from "./item/work-input"
import FConfigItem from "./item/base"
import FWorkSwitchItem from "./item/work-switch"

export type OtherConfigProps = {
  tab?: chrome.tabs.Tab
  config?: Partial<LocalStorageConfig>
}

export const OtherConfig = ({ config }: OtherConfigProps) => {
  const [t] = useTranslation()
  const [customSeed, setCustomSeed] = useState<string>()

  useEffect(() => {
    config && setCustomSeed(String(config.customSeed ?? ''))
  }, [config])

  const onChangeLanguage = useDebounceCallback((value: string) => {

  })

  return <section className="flex flex-col gap-2">
    {/* <FConfigItem.Input /> */}

    <div className="flex items-center gap-2">
      <Typography.Text className="whitespace-nowrap">{t('e.language')}</Typography.Text>
      <Input onInput={({ target }: any) => onChangeLanguage(target.value)} />
    </div>

    <FWorkInputItem keyPrefix='customSeed'
      title={t('item.title.seed')}
      desc={t('item.desc.seed')}
      value={config?.customSeed} />

    <FWorkSwitchItem keyPrefix='hookNetRequest'
      title={t('item.title.hook-net-request')}
      desc={t('item.desc.hook-net-request')}
      value={config?.hookNetRequest} />
  </section>
}

export default OtherConfig