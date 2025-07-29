import { useStorageStore } from "@/popup/stores/storage"
import { memo } from "react"
import { useTranslation } from "react-i18next"
import ConfigItem from "../item/base"
import TipIcon from "@/components/data/tip-icon"
import Markdown from "react-markdown"
import { hashNumberFromString } from "@/utils/base"
import { Spin } from "antd"
import { LoadingOutlined } from '@ant-design/icons'

export const ScriptConfigGroup = memo(() => {
  const [t] = useTranslation()

  const config = useStorageStore((state) => {
    state.config ?? state.loadStorage()
    return state.config
  })

  return config ? <>
    <ConfigItem.Input
      title={t('item.title.seed')}
      action={<TipIcon.Question content={<Markdown>{t('item.desc.seed')}</Markdown>} />}
      currentValue={config.input.globalSeed}
      onDebouncedInput={(value) => {
        config.input.globalSeed = value
        const _value = Number(value)
        if (isNaN(_value)) {
          config.seed.global = hashNumberFromString(value)
        } else {
          config.seed.global = _value
        }
      }}
    />

    <ConfigItem.Switch
      className="[&_.ant-switch-inner>span]:font-bold"
      title={t('item.title.inject.mode')}
      checkedChildren={t('item.title.inject.fast')}
      unCheckedChildren={t('item.title.inject.compat')}
      action={<TipIcon.Question content={<Markdown>{t('item.desc.fast-inject')}</Markdown>} />}
      currentValue={config.action.fastInject}
      onChange={(checked) => config.action.fastInject = checked}
    />

  </> : <Spin indicator={<LoadingOutlined spin />} />
})

export default ScriptConfigGroup