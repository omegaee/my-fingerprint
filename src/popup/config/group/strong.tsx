import { sendToBackground } from "@/utils/message"
import { useStorageStore } from "@/popup/stores/storage"
import { HookType } from '@/types/enum'
import { LoadingOutlined } from '@ant-design/icons'
import { Spin, Typography } from "antd"
import { memo, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useShallow } from "zustand/shallow"
import { HookModeProvider } from "../context"
import { HookModeCard, HookModeSelector } from "../ui"

const baseTypes = [HookType.default, HookType.page, HookType.browser, HookType.domain, HookType.global]
const webrtcTypes = [HookType.default, HookType.enabled, HookType.disabled]
const disabledTypes = [HookType.default, HookType.disabled]

const unstableTag = ['unstable']

type WebRtcStatus = BackgroundMessage.ResultByType<'webrtc.status'>

const getWebRtcStatusKey = (status?: WebRtcStatus) => {
  if (!status) {
    return
  }

  switch (status.configuredMode) {
    case HookType.enabled:
      return status.state === 'policy-enabled' ? 'policy-enabled' : 'fallback-disabled'
    case HookType.disabled:
      return 'manual-disabled'
    default:
      return 'default'
  }
}

const useWebRtcStatus = (version: number) => {
  const [status, setStatus] = useState<WebRtcStatus>()

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      sendToBackground({ type: 'webrtc.status' })
        .then((nextStatus) => {
          if (active) {
            setStatus(nextStatus)
          }
        })
        .catch(() => {
          if (active) {
            setStatus(undefined)
          }
        })
    }, 300)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [version])

  return status
}

export const StrongFpConfigGroup = memo(() => {
  const [t] = useTranslation()
  const { config, version } = useStorageStore(useShallow((s) => ({
    config: s.config,
    version: s.version,
  })))
  const fp = config?.fp
  const webrtcStatus = useWebRtcStatus(version)
  const webrtcStatusKey = getWebRtcStatusKey(webrtcStatus)

  return fp ? <div key={String(!!config)}>

    <HookModeProvider obj={fp.other} name='canvas'>
      <HookModeCard color='success'>
        <HookModeSelector types={baseTypes} />
      </HookModeCard>
    </HookModeProvider>

    <HookModeProvider obj={fp.other} name='webgl'>
      <HookModeCard color='success'>
        <HookModeSelector types={baseTypes} />
      </HookModeCard>
    </HookModeProvider>

    <HookModeProvider obj={fp.other} name='audio'>
      <HookModeCard color='success'>
        <HookModeSelector types={baseTypes} />
      </HookModeCard>
    </HookModeProvider>

    <HookModeProvider obj={fp.other} name='webrtc'>
      <HookModeCard color='warning' isDescArray tags={unstableTag}>
        <div className="flex flex-col gap-1">
          <HookModeSelector types={webrtcTypes} />
          {webrtcStatusKey && (
            <Typography.Text type='secondary' className="text-xs leading-5">
              {t(`item.status.webrtc.${webrtcStatusKey}`)}
            </Typography.Text>
          )}
        </div>
      </HookModeCard>
    </HookModeProvider>

    <HookModeProvider obj={fp.other} name='webgpu'>
      <HookModeCard color='success'>
        <HookModeSelector types={baseTypes} />
      </HookModeCard>
    </HookModeProvider>

    <HookModeProvider obj={fp.other} name='font'>
      <HookModeCard color='success'>
        <HookModeSelector types={baseTypes} />
      </HookModeCard>
    </HookModeProvider>

    <HookModeProvider obj={fp.other} name='domRect'>
      <HookModeCard color='success'>
        <HookModeSelector types={baseTypes} />
      </HookModeCard>
    </HookModeProvider>

    <HookModeProvider obj={fp.other} name='serviceWorker'>
      <HookModeCard color='warning' isDescArray tags={unstableTag}>
        <HookModeSelector types={disabledTypes} />
      </HookModeCard>
    </HookModeProvider>

  </div> : <Spin indicator={<LoadingOutlined spin />} />
})

export default StrongFpConfigGroup
