import { msgSetConfig } from "@/message/runtime"
import { hashNumber } from "@/utils/base"
import { useDebounceCallback } from "@/utils/hooks"
import { Input, Typography } from "antd"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

export type OtherConfigProps = {
  config?: Partial<LocalStorageConfig>
}

export const OtherConfig = ({config}: OtherConfigProps) => {
  const [t] = useTranslation()
  const [customSeed, setCustomSeed] = useState<string>()

  useEffect(() => {
    config && setCustomSeed(String(config.customSeed ?? ''))
  }, [config])

  const changeSeed = useDebounceCallback((value: string) => {
    let seed = Number(value)
    if(isNaN(seed)){
      seed = hashNumber(value)
      setCustomSeed(String(seed))
    }
    msgSetConfig({
      customSeed: seed
    })
  })

  const onInputSeed = (value: string) => {
    setCustomSeed(value)
    changeSeed(value)
  }

  const onChangeLanguage = useDebounceCallback((value: string) => {
    
  })

  return <section className="flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <Typography.Text className="whitespace-nowrap">{t('e.seed')}</Typography.Text>
      <Input value={customSeed}
        onInput={({target}: any) => onInputSeed(target.value)} />
    </div>
    <div className="flex items-center gap-2">
      <Typography.Text className="whitespace-nowrap">{t('e.language')}</Typography.Text>
      <Input onInput={({target}: any) => onChangeLanguage(target.value)} />
    </div>
  </section>
}

export default OtherConfig