import { useStorageStore } from "@/popup/stores/storage"
import { memo, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import TipIcon from "@/components/data/tip-icon"
import { genRandomSeed, hashNumberFromString } from "@/utils/base"
import { App, Button, Input, Spin, Switch, Tooltip } from "antd"
import { LoadingOutlined, RedoOutlined } from '@ant-design/icons'
import { requestPermission } from "@/utils/browser"
import { ConfigItemX, ConfigItemY } from "../item"
import { sendToBackground } from "@/utils/message"
import { useShallow } from "zustand/shallow"
import { Md } from "@/components/data/markdown"

export const ScriptConfigGroup = memo(() => {
  const [t] = useTranslation()
  const [fastInject, setFastInject] = useState(false)
  const [globalSeed, setGlobalSeed] = useState('')

  const { message } = App.useApp()

  const { config, version } = useStorageStore(useShallow((s) => ({
    config: s.config,
    version: s.version,
  })))

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
      if (await sendToBackground({
        type: 'api.check',
        api: 'userScripts',
      }) !== true) {
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

  return config ? <div key={version}>
    <ConfigItemY
      label={t('item.title.seed')}
      endContent={<TipIcon.Question content={<Md>{t('item.desc.seed')}</Md>} />}
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
        <TipIcon.Question content={<Md>{t('item.desc.inject-mode', { joinArrays: '\n\n' })}</Md>} />
      </>}
    >
      <Switch
        className="[&_.ant-switch-inner>span]:font-bold"
        title={t('item.title.inject.mode')}
        checkedChildren={t('item.title.inject.fast')}
        unCheckedChildren={t('item.title.inject.compat')}
        value={fastInject}
        onChange={async (v) => {
          await requestPermission('userScripts')
          onSetFastInject(v)
        }}
      />
    </ConfigItemX>

  </div> : <Spin indicator={<LoadingOutlined spin />} />
})

export default ScriptConfigGroup