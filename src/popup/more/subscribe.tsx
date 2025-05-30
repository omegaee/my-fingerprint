import { useTranslation } from "react-i18next"
import { useStorageStore } from "../stores/storage"
import { App, Button, Input, Tooltip } from "antd"
import { ApiOutlined, CheckOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react";

type SubscribeViewProps = {
  className?: string
}

export const SubscribeView = ({ className }: SubscribeViewProps) => {
  const [t] = useTranslation()
  const [input, setInput] = useState<string>('')
  const { message } = App.useApp()

  const config = useStorageStore((state) => state.config)

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
      .then(_ => message.success(t('tip.ok.subscribe-test')))
      .catch(e => message.error(`${t('tip.err.subscribe-test')}: ${e}`))
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
          <Button
            icon={<CheckOutlined />}
            disabled={input === config?.subscribe.url}
            onClick={() => {
              if (config) config.subscribe.url = input;
            }}
          />
        </Tooltip>
      </div>
      <div>
        <Tooltip
          title={t('tip.label.subscribe-test')}
          children={<Button icon={<ApiOutlined />} onClick={testTarget} />}
        />
      </div>
    </div>
  </section>
}

export default SubscribeView