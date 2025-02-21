import { compareVersions, genRandomSeed } from "@/utils/base";
import { debounce, debouncedAsync } from "@/utils/timer";
import deepmerge from "deepmerge";
import { reRequestHeader } from "./request";
import { HookType } from '@/types/enum'

let mStorage: LocalStorage | undefined
let mWhitelist: Set<string> | undefined

/**
 * 生成默认配置
 */
export const genDefaultLocalStorage = (): LocalStorage => {
  const manifest = chrome.runtime.getManifest()
  const defaultHook: DefaultHookMode = { type: HookType.default }
  const browserHook: RandomHookMode = { type: HookType.browser }

  const sGlobal = genRandomSeed();
  return {
    version: manifest.version,
    config: {
      enable: true,
      seed: {
        browser: genRandomSeed(),
        global: sGlobal,
      },
      fp: {
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
      input: {
        globalSeed: String(sGlobal),
      },
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

  let _storage: LocalStorage
  if (!data.version || compareVersions(previousVersion, '2.0.0') < 0) {
    await chrome.storage.local.clear()
    _storage = genDefaultLocalStorage()
  } else {
    _storage = deepmerge(genDefaultLocalStorage(), data)
  }
  mStorage = _storage
  mWhitelist = new Set(_storage.whitelist)
  chrome.storage.local.set(_storage).then(() => reRequestHeader())
  return [mStorage, mWhitelist] as const
})

/**
 * 获取配置
 */
export const getLocalStorage = async () => {
  if (mStorage !== undefined && mWhitelist !== undefined) {
    return [mStorage, mWhitelist] as const
  } else {
    return await initLocalStorage()
  }
}

/**
 * 存储配置
 */
export const saveLocalConfig = debounce((config: LocalStorageConfig) => {
  chrome.storage.local.set({ config })
}, 500)

/**
 * 存储白名单
 */
export const saveLocalWhitelist = debounce((whitelist: string[] | Set<string>) => {
  if (whitelist instanceof Set) {
    chrome.storage.local.set({ whitelist: [...whitelist] })
  } else {
    chrome.storage.local.set({ whitelist })
  }
}, 500)

/**
 * 修改配置
 */
export const updateLocalConfig = async (config: DeepPartial<LocalStorageConfig>) => {
  const [storage] = await getLocalStorage()
  storage.config = deepmerge<LocalStorageConfig, DeepPartial<LocalStorageConfig>>(
    storage.config,
    config,
    { arrayMerge: (_, sourceArray, __) => sourceArray },
  )
  saveLocalConfig(storage.config)
  reRequestHeader()
}

/**
 * 修改白名单
 */
export const updateLocalWhitelist = async (type: 'add' | 'del', host: string | string[]) => {
  const [storage, whitelist] = await getLocalStorage()
  if (Array.isArray(host)) {
    if (type === 'add') {
      for (const hh of host) {
        whitelist.add(hh)
      }
    } else if (type === 'del') {
      for (const hh of host) {
        whitelist.delete(hh)
      }
    }
  } else {
    if (type === 'add') {
      whitelist.add(host)
    } else if (type === 'del') {
      whitelist.delete(host)
    }
  }
  storage.whitelist = [...whitelist]
  saveLocalWhitelist(storage.whitelist)
  reRequestHeader()
}

/**
 * 刷新浏览器种子
 */
export const reBrowserSeed = async () => {
  const [storage] = await getLocalStorage()
  storage.config.seed.browser = genRandomSeed()
  saveLocalConfig(storage.config)
  reRequestHeader()
}