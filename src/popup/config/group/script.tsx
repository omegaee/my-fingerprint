import { useStorageStore } from "@/popup/stores/storage"
import { memo, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import TipIcon from "@/components/data/tip-icon"
import Markdown from "react-markdown"
import { genRandomSeed, hashNumberFromString } from "@/utils/base"
import { App, Button, Input, Spin, Switch, Tooltip } from "antd"
import { LoadingOutlined, RedoOutlined, WarningOutlined } from '@ant-design/icons'
import { sendRuntimeCheckApi } from "@/message/runtime"
import { checkPermission, getBrowserInfo, requestPermission } from "@/utils/browser"
import { ConfigItemX, ConfigItemY } from "../item"

export const ScriptConfigGroup = memo(() => {
  const [t] = useTranslation()
  const [fastInject, setFastInject] = useState(false)
  const [globalSeed, setGlobalSeed] = useState('')

  const { message } = App.useApp()

  const config = useStorageStore((state) => {
    state.config ?? state.loadStorage()
    return state.config
  })

  useEffect(() => {
    if (!config) return;
    setGlobalSeed(config.input.globalSeed)
    setFastInject(config.action.fastInject)
  }, [config])

  /**
   * set global seed
   */
  const onSetGlobalSeed = (value: string) => {
    if (!config) return;
    if (value === '') {
      setGlobalSeed('')
      config.seed.global = 0
      config.input.globalSeed = ''
      return;
    }
    setGlobalSeed(value)
    config.input.globalSeed = value
    const _value = Number(value)
    if (isNaN(_value)) {
      config.seed.global = hashNumberFromString(value)
    } else {
      config.seed.global = _value
    }
  }

  /**
   * set fast inject mode
   */
  const onSetFastInject = async (checked: boolean) => {
    if (!config) return;
    /* 尝试启用 */
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
    /* set */
    setFastInject(checked)
    if (config.action.fastInject !== checked) {
      config.action.fastInject = checked
    }
  }

  return config ? <>
    <ConfigItemY
      label={t('item.title.seed')}
      endContent={<TipIcon.Question content={<Markdown>{t('item.desc.seed')}</Markdown>} />}
    >
      <div className="flex gap-1">
        <Input
          className="grow"
          value={globalSeed}
          onInput={({ target }: any) => onSetGlobalSeed(target.value)}
        />
        <Tooltip title={t('g.random')}>
          <Button icon={<RedoOutlined />} onClick={() => {
            const seed = genRandomSeed()
            onSetGlobalSeed(seed.toString())
          }} />
        </Tooltip>
      </div>
    </ConfigItemY>

    <ConfigItemX
      label={t('item.title.inject.mode')}
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
        onChange={onSetFastInject}
      />
    </ConfigItemX>

  </> : <Spin indicator={<LoadingOutlined spin />} />
})

export default ScriptConfigGroup