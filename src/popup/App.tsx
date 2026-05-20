import { Badge, Button, Divider, Layout, Popconfirm, Tabs, type TabsProps, Typography, message } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  GithubOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';

import FConfig from "./config"
import WhitelistView from "./whitelist"
import BlacklistView from "./blacklist"

import { compareVersions, tryUrl, existParentDomain, selectParentDomains } from "@/utils/base"
import { useStorageStore } from "./stores/storage";
import MoreView from "./more";
import { useShallow } from "zustand/shallow";
import { sendToBackground } from "@/utils/message";
import { NoticePanel } from "./record";

function Application() {
  const [t, i18n] = useTranslation()
  const [enabled, setEnabled] = useState(false)
  const [tab, setTab] = useState<chrome.tabs.Tab>()
  const [hostname, setHostname] = useState<string>()
  const [whitelistMode, setWhitelistMode] = useState<'none' | 'self' | 'sub'>('none')
  const [blacklistMode, setBlacklistMode] = useState<'none' | 'self' | 'sub'>('none')
  const [hasNewVersion, setHasNewVersion] = useState(false)

  const [messageApi, contextHolder] = message.useMessage();

  const manifest = useMemo<chrome.runtime.Manifest>(() => chrome.runtime.getManifest(), [])

  const { config, whitelist, blacklist, addWhitelist, deleteWhitelist, addBlacklist, deleteBlacklist } = useStorageStore(useShallow((state) => {
    state.config ?? state.loadStorage()
    return {
      config: state.config,
      whitelist: state.whitelist,
      blacklist: state.blacklist,
      addWhitelist: state.addWhitelist,
      deleteWhitelist: state.deleteWhitelist,
      addBlacklist: state.addBlacklist,
      deleteBlacklist: state.deleteBlacklist,
    }
  }))
  const isShowConfigBadge = !config?.action.fastInject;

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      const tab = tabs[0]
      setTab(tab)
      if (!tab || !tab.url || !tab.id) return;
      const _url = tryUrl(tab.url)
      if (_url && (_url.protocol === 'http:' || _url.protocol === 'https:')) {
        /* 允许白名单 */
        setHostname(_url.hostname)
      }
    })
    sendToBackground({ type: 'version.latest' }).then((version) => {
      if (!version) return
      setHasNewVersion(compareVersions(manifest.version, version) === -1)
    })
  }, [])

  useEffect(() => {
    if (!whitelist || !hostname) return;
    if (whitelist.includes(hostname)) {
      setWhitelistMode('self')
    } else if (existParentDomain(whitelist, hostname)) {
      setWhitelistMode('sub')
    } else {
      setWhitelistMode('none')
    }
  }, [whitelist, hostname])

  useEffect(() => {
    if (!blacklist || !hostname) return;
    if (blacklist.includes(hostname)) {
      setBlacklistMode('self')
    } else if (existParentDomain(blacklist, hostname)) {
      setBlacklistMode('sub')
    } else {
      setBlacklistMode('none')
    }
  }, [blacklist, hostname])

  useEffect(() => {
    if (!config) return
    setEnabled(config.enable)
  }, [config])

  const switchEnable = () => {
    if (enabled) {
      sendToBackground({
        type: 'config.set',
        config: { enable: false },
      })
      setEnabled(false)
    } else {
      sendToBackground({
        type: 'config.set',
        config: { enable: true },
      })
      setEnabled(true)
    }
  }

  const switchWhitelist = () => {
    if (!hostname || !whitelist) return;
    if (whitelistMode === 'none') {
      /* 添加白名单 */
      addWhitelist(hostname)
      setWhitelistMode('self')
    } else if (whitelistMode === 'self') {
      /* 移除自身 */
      deleteWhitelist(hostname)
      setWhitelistMode('none')
    } else if (whitelistMode === 'sub') {
      /* 移除父域名 */
      deleteWhitelist(selectParentDomains(whitelist, hostname))
      setWhitelistMode('none')
    }
  }

  const switchBlacklist = () => {
    if (!hostname || !blacklist) return;
    if (blacklistMode === 'none') {
      /* 添加黑名单 */
      addBlacklist(hostname)
      setBlacklistMode('self')
    } else if (blacklistMode === 'self') {
      /* 移除自身 */
      deleteBlacklist(hostname)
      setBlacklistMode('none')
    } else if (blacklistMode === 'sub') {
      /* 移除父域名 */
      deleteBlacklist(selectParentDomains(blacklist, hostname))
      setBlacklistMode('none')
    }
  }

  const tabItems = useMemo<TabsProps['items']>(() => {
    return [
      {
        label: t('e.record'),
        children: <NoticePanel tab={tab} />,
      },
      {
        label: <Badge dot={isShowConfigBadge}>{t('e.config')}</Badge>,
        children: <FConfig />,
      },
      {
        label: t('e.whitelist'),
        children: <WhitelistView msgApi={messageApi} />,
      },
      {
        label: t('e.blacklist'),
        children: <BlacklistView msgApi={messageApi} />,
      },
      {
        label: t('e.more'),
        children: <MoreView />,
      }
    ].map((item, index) => ({ ...item, key: String(index) }))
  }, [i18n.language, tab, isShowConfigBadge])

  return (
    <Layout className="overflow-y-auto no-scrollbar p-2 w-80 flex flex-col">
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
        <section className="flex-1 min-w-0 flex flex-col items-center gap-1">
          <Popconfirm
            disabled={whitelistMode !== 'sub'}
            title={t('tip.if.remove-parent-domain')}
            placement='bottom'
            onConfirm={switchWhitelist}
            okText={t('g.confirm')}
            cancelText={t('g.cancel')}
            okType='danger'>
            <Button 
              type={whitelistMode !== 'none' ? 'primary' : 'default'}
              danger={!hostname}
              className="font-mono font-bold truncate w-full"
              title={hostname ?? t('tip.label.not-support-whitelist')}
              onClick={whitelistMode !== 'sub' ? switchWhitelist : undefined}>
              <span className="truncate block max-w-full">
                {hostname ?? t('tip.label.not-support-whitelist')}
              </span>
            </Button>
          </Popconfirm>
          <Typography.Text className="text-[13px]">{whitelistMode !== 'none' ? t('e.whitelist-in') : t('e.whitelist-click-in')}</Typography.Text>
        </section>

        {/* 黑名单开关 */}
        <section className="flex-1 min-w-0 flex flex-col items-center gap-1">
          <Popconfirm
            disabled={blacklistMode !== 'sub'}
            title={t('tip.if.remove-parent-domain')}
            placement='bottom'
            onConfirm={switchBlacklist}
            okText={t('g.confirm')}
            cancelText={t('g.cancel')}
            okType='danger'>
            <Button 
              type={blacklistMode !== 'none' ? 'primary' : 'default'}
              danger={!hostname}
              className="font-mono font-bold truncate w-full"
              title={hostname ?? t('tip.label.not-support-whitelist')}
              onClick={blacklistMode !== 'sub' ? switchBlacklist : undefined}>
              <span className="truncate block max-w-full">
                {hostname ?? t('tip.label.not-support-whitelist')}
              </span>
            </Button>
          </Popconfirm>
          <Typography.Text className="text-[13px]">{blacklistMode !== 'none' ? t('e.blacklist-in') : t('e.blacklist-click-in')}</Typography.Text>
        </section>

        {/* 插件开关 - 固定宽度 */}
        <section className="shrink-0 flex flex-col items-center gap-1">
          <Button 
            type={enabled ? 'primary' : 'default'} 
            className="font-bold truncate w-20"
            title={enabled ? t('g.enabled') : t('g.disabled')}
            onClick={switchEnable}>
            <span className="truncate">
              {enabled ? t('g.enabled') : t('g.disabled')}
            </span>
          </Button>
          <Typography.Text className="text-[13px]">{enabled ? t('e.enabled') : t('e.disabled')}</Typography.Text>
        </section>
      </section>

      <Divider style={{ margin: '8px 0 0 0' }} />

      <Tabs className="h-[450px] grow [&_.ant-tabs-tabpane]:animate-fadeIn"
        type="line" size='small' centered
        items={tabItems}
        tabBarStyle={{ marginBottom: '8px' }} />

    </Layout>
  )
}

export default Application
