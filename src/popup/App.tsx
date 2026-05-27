import { Badge, Button, Divider, Layout, Popconfirm, Tabs, type TabsProps, Typography, message } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  GithubOutlined,
} from '@ant-design/icons';

import FConfig from "./config"
import { compareVersions, tryUrl, existParentDomain, selectParentDomains } from "@/utils/base"
import { useStorageStore } from "./stores/storage";
import MoreView from "./more";
import { sendToBackground } from "@/utils/message";
import { NoticePanel } from "./record";
import PoliciesView from "./policies";

import { logManager } from '@/utils/log';

function Application() {
  const [t, i18n] = useTranslation()
  const [tab, setTab] = useState<chrome.tabs.Tab>()
  const [hostname, setHostname] = useState<string>()
  const [domainMode, setDomainMode] = useState<'none' | 'self' | 'sub'>('none')
  const [hasNewVersion, setHasNewVersion] = useState(false)

  const [messageApi, contextHolder] = message.useMessage();

  const manifest = useMemo<chrome.runtime.Manifest>(() => chrome.runtime.getManifest(), [])

  const { version, config, policies, loadStorage, saveConfig, savePolicies } = useStorageStore()

  const isShowConfigBadge = !config?.action.fastInject;
  const policyMode = policies?.isBlacklistMode ? 'blacklist' : 'whitelist';

  useEffect(() => {
    loadStorage();
  }, [])

  useEffect(() => {
    const level = config?.prefs?.logLevel;
    if (level) {
      logManager.setLevel(level);
    }
  }, [config?.prefs?.logLevel])

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

  const siteList = useMemo(() => {
    if (!policies) return [];
    return policies.isBlacklistMode ? policies.blacklist : policies.whitelist
  }, [version, policies])

  useEffect(() => {
    if (!policies || !hostname) return;

    if (siteList.includes(hostname)) {
      setDomainMode('self')
    } else if (existParentDomain(siteList, hostname)) {
      setDomainMode('sub')
    } else {
      setDomainMode('none')
    }
  }, [version, policies, hostname])

  const switchEnable = () => {
    if (!config) return;
    config.enable = !config.enable
    saveConfig()
  }

  const switchSiteList = () => {
    if (!policies || !hostname) return;

    if (domainMode === 'none') {
      /* 添加名单 */
      siteList.push(hostname)
      setDomainMode('self')
    } else if (domainMode === 'self') {
      /* 移除自身 */
      const idx = siteList.indexOf(hostname);
      if (idx !== -1) {
        siteList.splice(idx, 1);
      }
      setDomainMode('none')
    } else if (domainMode === 'sub') {
      /* 移除父域名 */
      const domains = selectParentDomains(siteList, hostname)
      for (const domain of domains) {
        const idx = siteList.indexOf(domain);
        if (idx !== -1) {
          siteList.splice(idx, 1);
        }
      }
      setDomainMode('none')
    }

    savePolicies()
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
        label: t('e.policies'),
        children: <PoliciesView msgApi={messageApi} />,
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
            disabled={domainMode !== 'sub'}
            title={t('tip.if.remove-parent-domain')}
            placement='bottom'
            onConfirm={switchSiteList}
            okText={t('g.confirm')}
            cancelText={t('g.cancel')}
            okType='danger'>
            <Button
              type={domainMode !== 'none' ? 'primary' : 'default'}
              danger={!hostname}
              className="font-mono font-bold truncate w-full"
              title={hostname ?? t('tip.label.not-support-tab')}
              onClick={domainMode !== 'sub' ? switchSiteList : undefined}>
              <span className="truncate block max-w-full">
                {hostname ?? t('tip.label.not-support-tab')}
              </span>
            </Button>
          </Popconfirm>
          <Typography.Text className="text-[13px]">{domainMode !== 'none' ? t(`label.${policyMode}.in`) : t(`label.${policyMode}.click-in`)}</Typography.Text>
        </section>

        {/* 插件开关 - 固定宽度 */}
        <section className="shrink-0 flex flex-col items-center gap-1">
          <Button
            type={config?.enable ? 'primary' : 'default'}
            className="font-bold truncate w-20"
            title={config?.enable ? t('g.enabled') : t('g.disabled')}
            onClick={switchEnable}>
            <span className="truncate">
              {config?.enable ? t('g.enabled') : t('g.disabled')}
            </span>
          </Button>
          <Typography.Text className="text-[13px]">{config?.enable ? t('e.enabled') : t('e.disabled')}</Typography.Text>
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
