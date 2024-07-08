import { Button, Collapse, type CollapseProps, Divider, Layout, Switch, Typography, theme } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import OtherConfig from "./components/module/other-config"
import FHookRecord from "./components/module/f-record"
import { FBaseConfig, FSpecialConfig } from "./components/module/f-config"
import { urlToHost } from "@/utils/base"

import {
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { msgGetNotice } from "@/message/runtime"

function App() {
  const [t, i18n] = useTranslation()
  const [enabled, setEnabled] = useState(false)
  const [tab, setTab] = useState<chrome.tabs.Tab>()
  const [hostPart, setHostPart] = useState<[string, string]>()
  const [config, setConfig] = useState<Partial<LocalStorageConfig>>()

  const [hookRecords, setHookRecords] = useState<ToolbarNoticeRecord['data']>()
  const [isWhitelist, setIsWhitelist] = useState(false)

  const { token } = theme.useToken();

  useEffect(() => {
    chrome.storage.local.get().then((data: Partial<LocalStorageConfig>) => {
      setConfig(data)
    })
    chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      const tab = tabs[0]
      setTab(tab)
      if (!tab?.url) return
      const host = urlToHost(tab.url)
      if (!host) return
      const temp = host.split(':')
      setHostPart([temp[0], temp[1]])
    })
    msgGetNotice().then((data) => {
      if(data.type === 'record'){
        setHookRecords(data.data)
      }else if(data.type === 'whitelist'){
        setIsWhitelist(true)
      }
    })
  }, [])

  const items = useMemo<CollapseProps['items']>(() => {
    const style: React.CSSProperties = {
      marginBottom: 8,
      // background: token.colorFillContent,
      borderRadius: token.borderRadiusSM,
      border: '2px solid',
      borderColor: token.colorBorder,
    }
    return [
      {
        label: <Typography.Text className="font-bold">{t('e.f-record')}</Typography.Text>,
        children: <FHookRecord tab={tab} config={config} records={hookRecords} />,
        style,
      },
      {
        label: <Typography.Text className="font-bold">{t('e.f-base-config')}</Typography.Text>,
        children: <FBaseConfig tab={tab} config={config} />,
        style,
      },
      {
        label: <Typography.Text className="font-bold">{t('e.f-special-config')}</Typography.Text>,
        children: <FSpecialConfig tab={tab} config={config} />,
        style,
      },
      {
        label: <Typography.Text className="font-bold">{t('e.other-config')}</Typography.Text>,
        children: <OtherConfig tab={tab} config={config} />,
        style,
      },
    ].map((item, key) => ({ ...item, key }))
  }, [i18n.language, config])

  return (
    <Layout className="overflow-auto p-2 w-60">

      <section className="flex items-stretch gap-2">

        <section className="grow flex flex-col items-center gap-1">
          <Button type={isWhitelist ? 'primary' : 'default'} className="font-mono font-bold" style={{width: '100%'}}>
            {isWhitelist ? <CheckOutlined /> : <CloseOutlined />} {hostPart?.[0]}
          </Button>
          <Typography.Text className="text-[13px]">{isWhitelist ? t('e.whitelist-in') : t('e.whitelist-not')}</Typography.Text>
        </section>

        <section className="flex flex-col items-center gap-1">
          <Button type={enabled ? 'primary' : 'default'} className="font-bold" onClick={() => { setEnabled(!enabled) }}>
            {enabled ? t('g.enabled') : t('g.disabled')}
          </Button>
          {/* <Switch value={enabled} onChange={setEnabled} /> */}
          <Typography.Text className="text-[13px]">{enabled ? t('e.enabled') : t('e.disabled')}</Typography.Text>
        </section>

      </section>

      <Divider style={{ margin: '4px 0 16px 0' }} />

      <Collapse size='small'
        style={{
          background: 'transparent',
        }}
        expandIconPosition='end'
        bordered={false}
        accordion
        items={items} />

    </Layout>
  )
}

export default App
