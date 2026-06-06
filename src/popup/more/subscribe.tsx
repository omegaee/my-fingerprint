import { useTranslation } from "react-i18next"
import { useStorageStore } from "../stores/storage"
import { App, Button, Input, Tooltip } from "antd"
import { ApiOutlined, CheckOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

type SubscribeViewProps = {
  className?: string
}

export const SubscribeView = ({ className }: SubscribeViewProps) => {
  const [t] = useTranslation()
  const [input, setInput] = useState<string>('')
  const [saveable, setSaveable] = useState(true)
  const { message } = App.useApp()

  const { config, importStorage } = useStorageStore(useShallow((s) => ({
    config: s.config,
    importStorage: s.importStorage,
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
    fetch(url)
      .then(v => v.json())
      .then(() => message.success(t('tip.subscribe.test-ok')))
      .catch(e => message.error(`${t('tip.subscribe.test-fail')}: ${e}`))
  }

  /**
   * 订阅目标
   */
  const subscribeTarget = () => {
    if (!config) return;
    let url = config.subscribe.url
    if (!url.includes("://")) url = chrome.runtime.getURL(url);
    fetch(url)
      .then(v => v.json())
      .then(async (v) => {
        await importStorage(v)
        message.success(t('tip.subscribe.save-ok'))
      })
      .catch(e => message.error(`${t('tip.subscribe.save-fail')}: ${e}`))
  }

  return <section className={className}>
    <div className="flex justify-center items-center gap-1">
      <Input
        placeholder="config.json"
        value={input}
        onChange={({ target }) => setInput(target.value)}
      />
      <div>
        <Tooltip title={t('tip.subscribe.save')}>
          <Button icon={<CheckOutlined />} disabled={!saveable} onClick={() => {
            setTimeout(() => setSaveable(true), 1000);
            setSaveable(false);
            subscribeTarget()
          }} />
        </Tooltip>
      </div>
      <div>
        <Tooltip title={t('tip.subscribe.test')} >
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