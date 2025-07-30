import { useStorageStore } from "@/popup/stores/storage"
import { memo, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import ConfigItem from "../item/base"
import TipIcon from "@/components/data/tip-icon"
import Markdown from "react-markdown"
import { hashNumberFromString } from "@/utils/base"
import { App, Spin, Switch } from "antd"
import { LoadingOutlined, WarningOutlined } from '@ant-design/icons'
import { sendRuntimeCheckApi } from "@/message/runtime"
import { checkPermission, getBrowserInfo, requestPermission } from "@/utils/browser"
import { ConfigItemX } from "../item"

export const ScriptConfigGroup = memo(() => {
  const [t] = useTranslation()
  const [fastInject, setFastInject] = useState(false)

  const { message } = App.useApp()

  const config = useStorageStore((state) => {
    state.config ?? state.loadStorage()
    return state.config
  })

  useEffect(() => {
    if (!config) return;
    setFastInject(config.action.fastInject)
  }, [config])

  const changeFastInjectCofnig = async (checked: boolean) => {
    if (!config) return;

    // 尝试启用
    if (checked === true) {
      const { name } = getBrowserInfo()

      if (name === 'firefox') {
        const res = await checkPermission('scripting')
        if (res === 'off') {
          await requestPermission('scripting')
          return;
        }
      }

      if (await sendRuntimeCheckApi('userScripts') !== true) {
        message.warning(t('tip.err.ns-fast-inject'))
        return;
      }
    }

    setFastInject(checked)
    if (config.action.fastInject !== checked) {
      config.action.fastInject = checked
    }
  }

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

    <ConfigItemX
      label="注入脚本"
      endContent={<>
        <TipIcon Icon={WarningOutlined} type='warning' content={<Markdown>test</Markdown>} />
        <TipIcon.Question content={<Markdown>{t('item.desc.inject-mode')}</Markdown>} />
      </>}
    >
      <Switch
        className="[&_.ant-switch-inner>span]:font-bold"
        title={t('item.title.inject.mode')}
        checkedChildren={t('item.title.inject.fast')}
        unCheckedChildren={t('item.title.inject.compat')}
        value={fastInject}
        onChange={changeFastInjectCofnig}
      />
    </ConfigItemX>

  </> : <Spin indicator={<LoadingOutlined spin />} />
})

export default ScriptConfigGroup