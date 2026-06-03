import { tryUrl } from "@/utils/base"
import { Md } from "@/components/data/markdown"
import TipIcon from "@/components/data/tip-icon"
import { sendToBackground } from "@/utils/message"
import { Button, Popconfirm, Typography, message } from "antd"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { requestPermission } from "@/utils/browser"
import { getCurrentTab } from "@/utils/tabs"

type SiteCleanupScope = Extract<BackgroundMessage.ParamByType<'site.cleanup'>['scope'], string>

export const SiteCleanupView = () => {
  const [t] = useTranslation()
  const [origin, setOrigin] = useState<string>()
  const [isPending, setIsPending] = useState(false)
  const [isInvalid, setIsInvalid] = useState(false)

  useEffect(() => {
    getCurrentTab().then((tab) => {
      const u = tryUrl(tab?.url as any)
      if (u?.protocol === 'http:' || u?.protocol === 'https:') {
        setOrigin(u.origin)
      } else {
        setIsInvalid(true)
      }
    })
  }, [])

  const handleCleanup = async (scope: SiteCleanupScope) => {
    if (!origin) return;

    await requestPermission('browsingData')

    setIsPending(true)
    const result = await sendToBackground({
      type: 'site.cleanup',
      scope,
      urls: [origin],
    }).finally(() => {
      setIsPending(false)
    })

    if (result.ok) {
      message.success(t(`tip.ok.site-cleanup.${scope}`))
    } else {
      if (result.messageKey) {
        message.error(t(result.messageKey))
      } else {
        message.error(result.message)
      }
    }
  }

  return <div className="p-2 bg-[--ant-color-bg-container] rounded-lg">
    <div className="mb-3 flex justify-center items-center gap-2">
      <h3 className="text-sm">{t('label.site-cleanup')}</h3>
      <TipIcon.Question content={<Md>{t('desc.site-cleanup', { joinArrays: '\n\n' })}</Md>} />
    </div>

    <div className="my-2">
      {isInvalid && <Typography.Text className="font-mono text-xs break-all">
        {t('tip.label.site-cleanup-unsupported-target')}
      </Typography.Text>}
    </div>

    <div className="flex flex-col gap-2">
      <Button
        loading={isPending}
        disabled={isInvalid}
        onClick={() => handleCleanup('cache')}>
        {t('label.site-cleanup.cache')}
      </Button>

      <Popconfirm
        title={t('tip.if.site-cleanup-all')}
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

      <Typography.Text type='danger' className="text-[11px] leading-4 text-right font-medium">
        {t('tip.label.site-cleanup-site-data-warning')}
      </Typography.Text>
    </div>
  </div>
}

export default SiteCleanupView
