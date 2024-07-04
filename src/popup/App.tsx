import { Collapse, type CollapseProps, Divider, Layout, Switch, Typography, theme } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import OtherConfig from "./components/module/other-config"
import FHookRecord from "./components/module/f-record"
import { FBaseConfig, FSpecialConfig } from "./components/module/f-config"

function App() {
  const [t, i18n] = useTranslation()
  const [enabled, setEnabled] = useState(false)
  const [config, setConfig] = useState<Partial<LocalStorageConfig>>()
  const { token } = theme.useToken();
  
  useEffect(() => {
    chrome.storage.local.get().then((data: Partial<LocalStorageConfig>) => {
      setConfig(data)
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
        children: <FHookRecord config={config} />,
        style,
      },
      {
        label: <Typography.Text className="font-bold">{t('e.f-base-config')}</Typography.Text>,
        children: <FBaseConfig config={config} />,
        style,
      },
      {
        label: <Typography.Text className="font-bold">{t('e.f-special-config')}</Typography.Text>,
        children: <FSpecialConfig config={config} />,
        style,
      },
      {
        label: <Typography.Text className="font-bold">{t('e.other-config')}</Typography.Text>,
        children: <OtherConfig config={config} />,
        style,
      },
    ].map((item, key) => ({...item, key}))
  }, [i18n.language, config])

  return (
    <Layout className="overflow-auto p-2 w-60">

      <section className="flex justify-end items-center gap-2">
        <Typography.Text className="font-bold">{enabled ? t('e.enabled') : t('e.disabled')}</Typography.Text>
        <Switch value={enabled} onChange={setEnabled} />
      </section>

      <Divider style={{ margin: '16px 0' }} />

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
