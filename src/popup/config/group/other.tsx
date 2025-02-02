import { useTranslation } from "react-i18next"
import ConfigItem from "../item/base"
import { useConfigStore } from "@/popup/stores/config"
import TipIcon from "@/components/data/tip-icon"
import Markdown from "react-markdown";
import { memo, useMemo } from "react";
import { hashNumberFromString } from "@/utils/base";
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

// export type OtherConfigGroupProps = {
// }

export const OtherConfigGroup = memo(() => {
  const [t] = useTranslation()

  const config = useConfigStore((state) => {
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
      onChange={(value) => config.language = value}
    />

    <ConfigItem.Input
      title={t('item.title.seed')}
      action={<TipIcon.Question content={<Markdown>{t('item.desc.seed')}</Markdown>} />}
      defaultValue={config.customSeedInput}
      onDebouncedInput={(value) => {
        config.customSeedInput = value

        const _value = Number(value)
        if (isNaN(_value)) {
          config.customSeed = hashNumberFromString(value)
        } else {
          config.customSeed = _value
        }
      }}
    />

    <ConfigItem.Switch
      title={t('item.title.hook-net-request')}
      action={<TipIcon.Question content={<Markdown>{t('item.desc.hook-net-request')}</Markdown>} />}
      defaultChecked={config.hookNetRequest}
      onChange={(checked) => config.hookNetRequest = checked}
    />

    <ConfigItem.Switch
      title={t('item.title.hook-iframe')}
      action={<TipIcon.Question content={<Markdown>{t('item.desc.hook-iframe')}</Markdown>} />}
      defaultChecked={config.hookNetRequest}
      onChange={(checked) => config.hookNetRequest = checked}
    />
  </> : <Spin indicator={<LoadingOutlined spin />} />
})

export default OtherConfigGroup