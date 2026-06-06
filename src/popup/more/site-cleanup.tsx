import { tryUrl } from "@/utils/base"
import { sendToBackground } from "@/utils/message"
import { Button, Popconfirm, message } from "antd"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { requestPermission } from "@/utils/browser"
import { getCurrentTab } from "@/utils/tabs"

type SiteCleanupScope = Extract<BackgroundMessage.ParamByType<'site.cleanup'>['scope'], string>

export const SiteCleanupView = () => {
  const [t] = useTranslation()
  const [url, setUrl] = useState<URL>()
  const [isPending, setIsPending] = useState(false)
  const [isInvalid, setIsInvalid] = useState(false)

  useEffect(() => {
    getCurrentTab().then((tab) => {
      const u = tryUrl(tab?.url as any)
      if (u?.protocol === 'http:' || u?.protocol === 'https:') {
        setUrl(u)
      } else {
        setIsInvalid(true)
      }
    })
  }, [])

  const handleCleanup = async (scope: SiteCleanupScope) => {
    if (!url) return;

    await requestPermission('browsingData')

    setIsPending(true)
    const result = await sendToBackground({
      type: 'site.cleanup',
      scope,
      urls: [url.origin],
    }).finally(() => {
      setIsPending(false)
    })

    if (result.ok) {
      message.success(t(`tip.site-cleanup.scope-${scope}-ok`))
    } else {
      if (result.messageKey) {
        message.error(`${t(`tip.site-cleanup.scope-${scope}-fail`)}: ${t(result.messageKey)}`)
      } else {
        message.error(`${t(`tip.site-cleanup.scope-${scope}-fail`)}: ${result.message}`)
      }
    }
  }

  return <div className="relative">
    {isInvalid && <div className="absolute inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-10">
      <span className="text-gray-800 font-semibold">{t('tip.site-cleanup.current-unavailable')}</span>
    </div>}

    <div className="p-3 flex justify-center items-center gap-2 *:grow">
      <Button
        loading={isPending}
        disabled={isInvalid}
        onClick={() => handleCleanup('cache')}>
        {t('label.site-cleanup-cache')}
      </Button>

      <Popconfirm
        title={t('tip.site-cleanup.scope-all-prompt')}
        okText={t('g.confirm')}
        cancelText={t('g.cancel')}
        okType='danger'
        onConfirm={() => handleCleanup('all')}>
        <Button
          danger
          loading={isPending}
          disabled={isInvalid}>
          {t('label.site-cleanup-all')}
        </Button>
      </Popconfirm>
    </div>
  </div>
}

export default SiteCleanupView
