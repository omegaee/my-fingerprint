import { Badge, Button, Divider, Layout, Tabs, type TabsProps, Typography, message, theme } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  GithubOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';

import FHookRecord from "./record"
import FConfig from "./config"
import WhitelistView from "./whitelist"

import { compareVersions, tryUrl } from "@/utils/base"
import { sendRuntimeGetNewVersion, sendRuntimeGetNotice, sendRuntimeSetConfig } from "@/message/runtime"
import { useStorageStore } from "./stores/storage";
import MoreView from "./more";
import { useShallow } from "zustand/shallow";

function App() {
  const [t, i18n] = useTranslation()
  const [enabled, setEnabled] = useState(false)
  const [tab, setTab] = useState<chrome.tabs.Tab>()
  const [hostname, setHostname] = useState<string>()

  const [hookRecords, setHookRecords] = useState<Partial<Record<string, number>>>()
  const [isWhitelist, setIsWhitelist] = useState(false)

  const [hasNewVersion, setHasNewVersion] = useState(false)

  const [messageApi, contextHolder] = message.useMessage();

  const manifest = useMemo<chrome.runtime.Manifest>(() => chrome.runtime.getManifest(), [])

  const { config, addWhitelist, deleteWhitelist } = useStorageStore(useShallow((state) => {
    state.config ?? state.loadStorage()
    return {
      config: state.config,
      addWhitelist: state.addWhitelist,
      deleteWhitelist: state.deleteWhitelist,
    }
  }))

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      const tab = tabs[0]
      setTab(tab)
      if (!tab || !tab.url || !tab.id) return;
      const _url = tryUrl(tab.url)
      if(_url && (_url.protocol === 'http:' || _url.protocol === 'https:')){
        /* 允许白名单 */
        setHostname(_url.hostname)
        sendRuntimeGetNotice(tab.id, _url.hostname).then((data) => {
          data ? setHookRecords(data) : setIsWhitelist(true)
        })
      }
    })
    sendRuntimeGetNewVersion().then((version) => {
      if (!version) return
      setHasNewVersion(compareVersions(manifest.version, version) === -1)
    })
  }, [])

  useEffect(() => {
    if (!config) return
    setEnabled(config.enable)
    i18n.changeLanguage(config.language)
  }, [config])

  const switchEnable = () => {
    if (enabled) {
      sendRuntimeSetConfig({ enable: false })
      setEnabled(false)
    } else {
      sendRuntimeSetConfig({ enable: true })
      setEnabled(true)
    }
  }

  const switchWhitelist = () => {
    if (!hostname) return;
    if (isWhitelist) {
      deleteWhitelist(hostname)
      setIsWhitelist(false)
    } else {
      addWhitelist(hostname)
      setIsWhitelist(true)
    }
  }

  const tabItems = useMemo<TabsProps['items']>(() => {
    return [
      {
        label: t('e.record'),
        // icon: <AlertOutlined />,
        children: <FHookRecord records={hookRecords} />,
      },
      {
        label: t('e.config'),
        // icon: <SettingOutlined />,
        children: <FConfig />,
      },
      {
        label: t('e.whitelist'),
        // icon: <SafetyOutlined />,
        children: <WhitelistView msgApi={messageApi} />,
      },
      {
        label: t('e.more'),
        // icon: <MoreOutlined />,
        children: <MoreView msgApi={messageApi} />,
      }
    ].map((item, index) => ({ ...item, key: String(index) }))
  }, [i18n.language, tab, hookRecords])

  return (
    <Layout className="overflow-y-auto no-scrollbar p-2 w-72 flex flex-col">
      {contextHolder}

      <section className='relative'>
        <Typography.Text className="relative flex justify-center text-xl font-black">
          My Fingerprint
        </Typography.Text>
        <Badge dot={hasNewVersion} offset={[-2, 2]} style={{ width: '8px', height: '8px' }} className="absolute left-0 top-0 cursor-pointer">
          <GithubOutlined className="text-lg" onClick={() => window.open(hasNewVersion ? 'https://github.com/omegaee/my-fingerprint/releases' : 'https://github.com/omegaee/my-fingerprint')} />
        </Badge>
        <Typography.Text className="absolute right-0 bottom-0 text-xs font-mono font-bold">v{manifest.version}</Typography.Text>
      </section>

      <Divider style={{ margin: '8px 0' }} />

      <section className="flex items-stretch gap-2">

        {/* 白名单开关 */}
        <section className="grow flex flex-col items-center gap-1">
          <Button type={isWhitelist ? 'primary' : 'default'}
            danger={!hostname}
            className="font-mono font-bold"
            style={{ width: '100%' }}
            onClick={switchWhitelist} >
            {isWhitelist ? <CheckOutlined /> : <CloseOutlined />} {hostname ?? t('tip.label.not-support-whitelist')}
          </Button>
          <Typography.Text className="text-[13px]">{isWhitelist ? t('e.whitelist-in') : t('e.whitelist-click-in')}</Typography.Text>
        </section>

        {/* 插件开关 */}
        <section className="flex flex-col items-center gap-1">
          <Button type={enabled ? 'primary' : 'default'} className="font-bold" onClick={switchEnable}>
            {enabled ? t('g.enabled') : t('g.disabled')}
          </Button>
          {/* <Switch value={enabled} onChange={setEnabled} /> */}
          <Typography.Text className="text-[13px]">{enabled ? t('e.enabled') : t('e.disabled')}</Typography.Text>
        </section>

      </section>

      <Divider style={{ margin: '8px 0 0 0' }} />

      <Tabs className="h-[450px] grow" type="line" size='small' centered
        items={tabItems}
        tabBarStyle={{ marginBottom: '8px' }} />

    </Layout>
  )
}

export default App
