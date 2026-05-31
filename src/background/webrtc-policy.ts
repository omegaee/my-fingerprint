export const WEBRTC_IP_POLICY = 'disable_non_proxied_udp' as const

export type WebRtcPolicyState =
  | 'default'
  | 'policy-enabled'
  | 'fallback-disabled'

type ChromePolicyApi = {
  runtime?: { lastError?: unknown }
  privacy?: {
    network?: {
      webRTCIPHandlingPolicy?: {
        set: (details: { value: typeof WEBRTC_IP_POLICY }, callback?: () => void) => void
        get: (
          details: {},
          callback: (details: { value?: string, levelOfControl?: string }) => void
        ) => void
        clear: (details: {}, callback?: () => void) => void
      }
    }
  }
}

// Node's strip-only TypeScript execution cannot runtime-import src/types/enum.ts.
// Keep the numeric contract local here so the helper stays testable under node --test.
const HookTypeValue = {
  default: 0,
  enabled: 6,
  disabled: 7,
} as const

const cloneStorage = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const getPolicyController = (chromeApi: ChromePolicyApi) =>
  chromeApi.privacy?.network?.webRTCIPHandlingPolicy

const clearPolicyValue = async (chromeApi: ChromePolicyApi) => {
  const controller = getPolicyController(chromeApi)
  if (!controller) {
    return
  }

  await new Promise<void>((resolve) => {
    try {
      controller.clear({}, () => resolve())
    } catch {
      resolve()
    }
  })
}

const setPolicyValue = async (chromeApi: ChromePolicyApi) => {
  const controller = getPolicyController(chromeApi)
  if (!controller) {
    return false
  }

  await new Promise<void>((resolve, reject) => {
    try {
      controller.set({ value: WEBRTC_IP_POLICY }, () => {
        const err = chromeApi.runtime?.lastError
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    } catch (error) {
      reject(error)
    }
  })

  const result = await new Promise<{ value?: string }>((resolve) => {
    controller.get({}, (details) => resolve(details))
  })

  return result.value === WEBRTC_IP_POLICY
}

export const applyWebRtcPolicyMode = async ({
  chromeApi,
  browser,
  mode,
}: {
  chromeApi: ChromePolicyApi
  browser?: BrowserType
  mode: HookType
}): Promise<WebRtcPolicyState> => {
  const controller = getPolicyController(chromeApi)

  if (mode === HookTypeValue.default) {
    await clearPolicyValue(chromeApi)
    return 'default'
  }

  if (mode === HookTypeValue.disabled) {
    await clearPolicyValue(chromeApi)
    return 'fallback-disabled'
  }

  if (browser !== 'chrome' || !controller) {
    await clearPolicyValue(chromeApi)
    return 'fallback-disabled'
  }

  try {
    return await setPolicyValue(chromeApi) ? 'policy-enabled' : 'fallback-disabled'
  } catch {
    return 'fallback-disabled'
  }
}

export const getInjectedStorageForWebRtc = (
  storage: LocalStorage,
  state: WebRtcPolicyState,
) => {
  if (state !== 'fallback-disabled' || storage.config.fp.other.webrtc.type === HookTypeValue.disabled) {
    return storage
  }

  const next = cloneStorage(storage)
  next.config.fp.other.webrtc = { type: HookTypeValue.disabled }
  return next
}
