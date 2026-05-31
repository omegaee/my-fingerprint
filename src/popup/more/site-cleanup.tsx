import { tryUrl } from "@/utils/base"
import { Md } from "@/components/data/markdown"
import TipIcon from "@/components/data/tip-icon"
import { getBrowser } from "@/utils/equipment"
import { sendToBackground } from "@/utils/message"
import { Button, Popconfirm, Typography, message } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

type SiteCleanupScope = Extract<BackgroundMessage.ParamByType<'site.cleanup'>['scope'], string>

const isHttpPage = (url?: string) => {
  if (!url) {
    return false
  }

  const parsed = tryUrl(url)
  return parsed ? parsed.protocol === 'http:' || parsed.protocol === 'https:' : false
}

const getCurrentTarget = (tab?: chrome.tabs.Tab) => {
  if (!tab?.url || !isHttpPage(tab.url)) {
    return {
      isSupported: false,
      url: tab?.url,
      origin: undefined,
    }
  }

  const parsed = new URL(tab.url)
  return {
    isSupported: true,
    url: tab.url,
    origin: parsed.origin,
  }
}

const ensureBrowsingDataPermission = async () => {
  const permissions = { permissions: ['browsingData'] as chrome.runtime.ManifestPermissions[] }
  if (await chrome.permissions.contains(permissions)) {
    return true
  }

  return await chrome.permissions.request(permissions)
}

export const SiteCleanupView = () => {
  const [t] = useTranslation()
  const [tab, setTab] = useState<chrome.tabs.Tab>()
  const [pending, setPending] = useState<SiteCleanupScope>()
  const browser = useMemo(() => getBrowser(navigator.userAgent), [])
  const target = useMemo(() => getCurrentTarget(tab), [tab])

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      setTab(tabs[0])
    })
  }, [])

  const handleCleanup = async (scope: SiteCleanupScope) => {
    if (browser !== 'chrome') {
      message.error(t('tip.err.site-cleanup-unsupported'))
      return
    }

    if (!target.url || !target.isSupported) {
      message.warning(t('tip.err.site-cleanup-url'))
      return
    }

    setPending(scope)

    try {
      if (!(await ensureBrowsingDataPermission())) {
        message.warning(t('tip.err.site-cleanup-permission'))
        return
      }

      const result = await sendToBackground({
        type: 'site.cleanup',
        url: target.url,
        scope,
      })

      if (!result.ok) {
        throw new Error(result.messageKey ? t(result.messageKey) : result.message ?? t('tip.err.site-cleanup'))
      }

      message.success(t(`tip.ok.site-cleanup.${scope}`))
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('tip.err.site-cleanup'))
    } finally {
      setPending(undefined)
    }
  }

  return <div className="p-2 bg-[--ant-color-bg-container] rounded-lg">
    <div className="mb-3 flex justify-center items-center gap-2">
      <h3 className="text-sm">{t('label.site-cleanup')}</h3>
      <TipIcon.Question content={<Md>{t('desc.site-cleanup', { joinArrays: '\n\n' })}</Md>} />
    </div>

    <div className="mb-3 text-center">
      <Typography.Text type='secondary' className="text-xs block">
        {t('tip.label.site-cleanup-target')}
      </Typography.Text>
      <Typography.Text className="font-mono text-xs break-all">
        {target.origin ?? t('tip.label.site-cleanup-unsupported-target')}
      </Typography.Text>
    </div>

    <div className="flex flex-col gap-2">
      <Button
        loading={pending === 'cache-lite'}
        disabled={!target.isSupported || browser !== 'chrome'}
        onClick={() => handleCleanup('cache-lite')}>
        {t('label.site-cleanup-cache-lite')}
      </Button>

      <Popconfirm
        title={t('tip.if.site-cleanup-site-data')}
        okText={t('g.confirm')}
        cancelText={t('g.cancel')}
        okType='danger'
        onConfirm={() => handleCleanup('site-data')}>
        <Button
          danger
          loading={pending === 'site-data'}
          disabled={!target.isSupported || browser !== 'chrome'}>
          {t('label.site-cleanup-site-data')}
        </Button>
      </Popconfirm>

      <Typography.Text type='danger' className="text-[11px] leading-4 text-right font-medium">
        {t('tip.label.site-cleanup-site-data-warning')}
      </Typography.Text>
    </div>
  </div>
}

export default SiteCleanupView
