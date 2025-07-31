import { useTranslation } from "react-i18next"
import { useStorageStore } from "../stores/storage"
import { App, Button, Input, Tooltip } from "antd"
import { ApiOutlined, CheckOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import { sendToBackground } from "@/utils/message";

type SubscribeViewProps = {
  className?: string
}

export const SubscribeView = ({ className }: SubscribeViewProps) => {
  const [t] = useTranslation()
  const [input, setInput] = useState<string>('')
  const [saveable, setSaveable] = useState(true)
  const { message } = App.useApp()

  const { config, syncLoadStorage } = useStorageStore(useShallow((state) => ({
    config: state.config,
    syncLoadStorage: state.syncLoadStorage,
  })))

  useEffect(() => {
    const url = config?.subscribe.url
    if (input !== url) {
      setInput(url ?? '')
    }
  }, [config])

  /**
   * 测试订阅目标
   */
  const testTarget = () => {
    if (!config) return;
    let url = input
    if (!url.includes("://")) url = chrome.runtime.getURL(url);
    console.log(url);
    fetch(url)
      .then(v => v.json())
      .then(() => message.success(t('tip.ok.subscribe-test')))
      .catch(e => message.error(`${t('tip.err.subscribe-test')}: ${e}`))
  }

  const subscribeTarget = () => {
    if (!config) return;
    let url: string | undefined = undefined
    if (config.subscribe.url !== input.trim()) {
      url = input.trim()
      config.subscribe.url = url
    }
    sendToBackground({
      type: 'config.subscribe',
      url,
    }).then((v: LocalStorage | void) => {
      if (v) {
        syncLoadStorage(v)
        message.success(t('tip.ok.subscribe'))
      } else {
        message.error(t('tip.err.subscribe'))
      }
    })
  }

  return <section className={className}>
    <div className="mx-2 flex justify-center items-center gap-1">
      <Input
        placeholder="config.json"
        value={input}
        onChange={({ target }) => setInput(target.value)}
      />
      <div>
        <Tooltip title={t('tip.label.subscribe-save')}>
          <Button icon={<CheckOutlined />} disabled={!saveable} onClick={() => {
            setTimeout(() => setSaveable(true), 1000);
            setSaveable(false);
            subscribeTarget()
          }} />
        </Tooltip>
      </div>
      <div>
        <Tooltip title={t('tip.label.subscribe-test')} >
          <Button
            icon={<ApiOutlined />}
            disabled={input.trim() === ''}
            onClick={testTarget}
          />
        </Tooltip>
      </div>
    </div>
  </section>
}

export default SubscribeView