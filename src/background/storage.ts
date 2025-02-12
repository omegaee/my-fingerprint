import { compareVersions, genRandomSeed } from "@/utils/base";
import { debounce, debouncedAsync } from "@/utils/timer";
import deepmerge from "deepmerge";
import { refreshRequestHeader } from "./request";
import { HookType } from '@/types/enum'

let localStorage: LocalStorageObject | undefined

/**
 * 生成默认配置
 */
export const genDefaultLocalStorage = (): LocalStorage => {
  const manifest = chrome.runtime.getManifest()
  const defaultHook: DefaultHookMode = { type: HookType.default }
  const browserHook: RandomHookMode = { type: HookType.browser }

  const customSeed = genRandomSeed();
  return {
    version: manifest.version,
    config: {
      enable: true,
      customSeed,
      browserSeed: genRandomSeed(),
      customSeedInput: String(customSeed),
      fingerprint: {
        navigator: {
          equipment: defaultHook,
          language: defaultHook,
          languages: defaultHook,
          hardwareConcurrency: defaultHook,
        },
        screen: {
          height: defaultHook,
          width: defaultHook,
          colorDepth: defaultHook,
          pixelDepth: defaultHook,
        },
        other: {
          timezone: defaultHook,
          canvas: browserHook,
          audio: defaultHook,
          webgl: browserHook,
          webrtc: defaultHook,
          font: defaultHook,
          webgpu: defaultHook,
        },
      },
      language: navigator.language,
      hookNetRequest: true,
      hookBlankIframe: true,
    },
    whitelist: []
  }
}

/**
 * 初始化默认配置
 */
export const initLocalStorage = debouncedAsync(async (previousVersion?: string) => {
  previousVersion = previousVersion ?? chrome.runtime.getManifest().version

  const data = await chrome.storage.local.get() as LocalStorage

  let storage: LocalStorage
  if (!data.version || compareVersions(previousVersion, '2.0.0') < 0) {
    await chrome.storage.local.clear()
    storage = genDefaultLocalStorage()
  } else {
    storage = deepmerge(genDefaultLocalStorage(), data)
    storage.config.browserSeed = genRandomSeed()
  }
  localStorage = { ...storage, whitelist: new Set(storage.whitelist) }
  chrome.storage.local.set(storage).then(() => refreshRequestHeader())
  return localStorage
})

/**
 * 获取配置
 */
export const getLocalStorage = async (): Promise<LocalStorageObject> => {
  if (localStorage) {
    return localStorage
  } else {
    return await initLocalStorage()
  }
}

/**
 * 存储配置
 */
export const saveLocalConfig = debounce((storage: LocalStorageObject) => {
  chrome.storage.local.set({ config: storage.config })
}, 500)

/**
 * 存储白名单
 */
export const saveLocalWhitelist = debounce((storage: LocalStorageObject) => {
  chrome.storage.local.set({ whitelist: [...storage.whitelist] })
}, 500)

/**
 * 修改配置
 */
export const updateLocalConfig = async (config: DeepPartial<LocalStorageConfig>) => {
  const storage = await getLocalStorage()
  storage.config = deepmerge<LocalStorageConfig, DeepPartial<LocalStorageConfig>>(
    storage.config,
    config,
    { arrayMerge: (destinationArray, sourceArray, options) => sourceArray },
  )
  saveLocalConfig(storage)
  if (
    config.enable !== undefined ||
    config.hookNetRequest !== undefined ||
    config.fingerprint?.navigator?.equipment !== undefined ||
    config.fingerprint?.navigator?.language !== undefined
  ) {
    refreshRequestHeader()
  }
}

/**
 * 修改白名单
 */
export const updateLocalWhitelist = async (type: 'add' | 'del', host: string | string[]) => {
  const storage = await getLocalStorage()
  if (Array.isArray(host)) {
    if (type === 'add') {
      for (const hh of host) {
        storage.whitelist.add(hh)
      }
    } else if (type === 'del') {
      for (const hh of host) {
        storage.whitelist.delete(hh)
      }
    }
  } else {
    if (type === 'add') {
      storage.whitelist.add(host)
    } else if (type === 'del') {
      storage.whitelist.delete(host)
    }
  }
  saveLocalWhitelist(storage)
  if (storage.config.enable && storage.config.hookNetRequest && storage.config.fingerprint.navigator.equipment) {
    refreshRequestHeader()
  }
}