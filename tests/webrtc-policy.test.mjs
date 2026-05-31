import test from 'node:test'
import assert from 'node:assert/strict'

import {
  WEBRTC_IP_POLICY,
  applyWebRtcPolicyMode,
  getInjectedStorageForWebRtc,
} from '../src/background/webrtc-policy.ts'

const HookType = {
  default: 0,
  value: 1,
  page: 2,
  browser: 3,
  domain: 4,
  global: 5,
  enabled: 6,
  disabled: 7,
}

const createChromeApi = ({
  getValue = WEBRTC_IP_POLICY,
  setThrows = null,
  hasPolicy = true,
} = {}) => {
  if (!hasPolicy) {
    return {}
  }

  return {
    runtime: { lastError: undefined },
    privacy: {
      network: {
        webRTCIPHandlingPolicy: {
          set(details, callback) {
            if (setThrows) {
              throw setThrows
            }
            this.lastSet = details
            callback?.()
          },
          get(details, callback) {
            callback({ value: getValue, levelOfControl: 'controlled_by_this_extension' })
          },
          clear(details, callback) {
            callback?.()
          },
        },
      },
    },
  }
}

const createStorage = (type) => ({
  version: '2.7.3',
  config: {
    enable: true,
    seed: { browser: 1, global: 2 },
    fp: {
      navigator: {
        clientHints: { type: HookType.default },
        languages: { type: HookType.default },
        hardwareConcurrency: { type: HookType.default },
      },
      screen: {
        size: { type: HookType.default },
        depth: { type: HookType.default },
      },
      normal: {
        gpuInfo: { type: HookType.default },
      },
      other: {
        timezone: { type: HookType.default },
        canvas: { type: HookType.default },
        audio: { type: HookType.default },
        webgl: { type: HookType.default },
        webrtc: { type },
        font: { type: HookType.default },
        webgpu: { type: HookType.default },
        domRect: { type: HookType.default },
        serviceWorker: { type: HookType.default },
      },
    },
    action: { fastInject: false },
    input: { globalSeed: '2' },
    subscribe: { url: 'config.json' },
    prefs: { language: 'en-US', theme: 'system', logLevel: 'ERROR' },
  },
  policies: {
    whitelist: [],
    blacklist: [],
    isBlacklistMode: false,
  },
})

test('applyWebRtcPolicyMode enables Chromium leak protection for enabled mode', async () => {
  const chromeApi = createChromeApi()

  const state = await applyWebRtcPolicyMode({
    chromeApi,
    browser: 'chrome',
    mode: HookType.enabled,
  })

  assert.equal(state, 'policy-enabled')
  assert.deepEqual(
    chromeApi.privacy.network.webRTCIPHandlingPolicy.lastSet,
    { value: WEBRTC_IP_POLICY }
  )
})

test('applyWebRtcPolicyMode falls back to hard disable when policy API is missing', async () => {
  const state = await applyWebRtcPolicyMode({
    chromeApi: createChromeApi({ hasPolicy: false }),
    browser: 'chrome',
    mode: HookType.enabled,
  })

  assert.equal(state, 'fallback-disabled')
})

test('applyWebRtcPolicyMode falls back to hard disable for Firefox enabled mode', async () => {
  const state = await applyWebRtcPolicyMode({
    chromeApi: createChromeApi(),
    browser: 'firefox',
    mode: HookType.enabled,
  })

  assert.equal(state, 'fallback-disabled')
})

test('getInjectedStorageForWebRtc rewrites enabled mode to disabled during fallback', () => {
  const original = createStorage(HookType.enabled)
  const effective = getInjectedStorageForWebRtc(original, 'fallback-disabled')

  assert.equal(effective.config.fp.other.webrtc.type, HookType.disabled)
  assert.equal(original.config.fp.other.webrtc.type, HookType.enabled)
})

test('getInjectedStorageForWebRtc preserves enabled mode when policy is active', () => {
  const original = createStorage(HookType.enabled)
  const effective = getInjectedStorageForWebRtc(original, 'policy-enabled')

  assert.equal(effective.config.fp.other.webrtc.type, HookType.enabled)
})

test('getInjectedStorageForWebRtc leaves disabled mode untouched', () => {
  const original = createStorage(HookType.disabled)
  const effective = getInjectedStorageForWebRtc(original, 'fallback-disabled')

  assert.equal(effective.config.fp.other.webrtc.type, HookType.disabled)
  assert.equal(effective, original)
})
