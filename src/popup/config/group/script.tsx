import { useStorageStore } from "@/popup/stores/storage"
import { memo } from "react"
import { useTranslation } from "react-i18next"
import TipIcon from "@/components/data/tip-icon"
import { genRandomSeed, hashNumberFromString } from "@/utils/base"
import { App, Badge, Button, Input, Spin, Switch, Tooltip } from "antd"
import { LoadingOutlined, RedoOutlined } from '@ant-design/icons'
import { requestPermission } from "@/utils/browser"
import { ConfigDesc, ConfigItemX, ConfigItemY } from "../item"
import { sendToBackground } from "@/utils/message"
import { useShallow } from "zustand/shallow"
import { Md } from "@/components/data/markdown"

const nsImportTag = ['unsupport-import']

export const ScriptConfigGroup = memo(() => {
  const [t] = useTranslation()

  const { message } = App.useApp()

  const { config, saveConfig } = useStorageStore(useShallow((s) => ({
    version: s.version,
    config: s.config,
    saveConfig: s.saveConfig,
  })))

  const isShowBadge = !config?.action.fastInject;

  /**
   * set global seed
   */
  const onSetGlobalSeed = (value: string) => {
    if (!config) return;

    if (value === '') {
      config.seed.global = 0
      config.input.globalSeed = ''
      return;
    }

    config.input.globalSeed = value
    const _value = Number(value)
    if (isNaN(_value)) {
      config.seed.global = hashNumberFromString(value)
    } else {
      config.seed.global = _value
    }

    saveConfig()
  }

  /**
   * set fast inject mode
   */
  const onSetFastInject = async (checked: boolean) => {
    if (!config) return;

    /* try */
    if (checked === true) {
      if (await sendToBackground({
        type: 'api.check',
        api: 'userScripts',
      }) !== true) {
        message.warning(t('tip.action.enable-fail'))
        return;
      }
    }

    /* set */
    if (config.action.fastInject !== checked) {
      config.action.fastInject = checked
    }

    saveConfig()
  }

  return config ? <div key={String(!!config)}>
    <ConfigItemY
      label={t('item.title.seed')}
      endContent={<TipIcon.Question content={<Md>{t('item.desc.seed')}</Md>} />}
    >
      <div className="flex gap-1">
        <Input
          className="grow"
          value={config.seed.global}
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
      label={<Badge dot={isShowBadge}>{t('item.title.fast-inject')}</Badge>}
      endContent={<TipIcon.Question content={<ConfigDesc tags={nsImportTag} desc={t('item.desc.fast-inject', { joinArrays: '\n\n' })} />} />}
    >
      <Switch
        className="[&_.ant-switch-inner>span]:font-bold"
        checked={config.action.fastInject}
        onChange={async (v) => {
          await requestPermission('userScripts')
          onSetFastInject(v)
        }}
      />
    </ConfigItemX>

  </div> : <Spin indicator={<LoadingOutlined spin />} />
})

export default ScriptConfigGroup