import { compareVersions, genRandomSeed, existParentDomain } from "@/utils/base";
import { debounce, debouncedAsync } from "@/utils/timer";
import deepmerge from "deepmerge";
import { reRequestHeader } from "./request";
import { HookType } from '@/types/enum'

let mContent: LocalStorageContent | undefined

type LocalStorageWhitelist = {
  match: (v: string) => boolean
  add: (v: string) => void
  remove: (v: string) => void
}

type LocalStorageContent = [
  LocalStorage,
  LocalStorageWhitelist,
] & {
  storage: LocalStorage
  whitelist: LocalStorageWhitelist
}

const genStorageContent = (storage: LocalStorage): LocalStorageContent => ({
  storage,
  whitelist: {
    match: (v: string) => existParentDomain(storage.whitelist, v),
    add(v: string) {
      storage.whitelist.push(v)
    },
    remove(v: string) {
      const index = storage.whitelist.indexOf(v)
      index !== -1 && storage.whitelist.splice(index, 1)
    },
  },
  [Symbol.iterator]() {
    return Object.values(this)[Symbol.iterator]();
  },
} as LocalStorageContent)

/**
 * 生成默认配置
 */
export const genDefaultLocalStorage = (): LocalStorage => {
  const manifest = chrome.runtime.getManifest()
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
          uaVersion: { type: HookType.browser },
          language: { type: HookType.default },
          languages: { type: HookType.default },
          hardwareConcurrency: { type: HookType.default },
        },
        screen: {
          height: { type: HookType.default },
          width: { type: HookType.default },
          colorDepth: { type: HookType.default },
          pixelDepth: { type: HookType.default },
        },
        normal: {
          glVendor: { type: HookType.default },
          glRenderer: { type: HookType.default },
        },
        other: {
          timezone: { type: HookType.default },
          canvas: { type: HookType.browser },
          audio: { type: HookType.default },
          webgl: { type: HookType.browser },
          webrtc: { type: HookType.default },
          font: { type: HookType.default },
          webgpu: { type: HookType.default },
        },
      },
      action: {
        hookNetRequest: true,
        hookBlankIframe: true,
      },
      input: {
        globalSeed: String(sGlobal),
      },
      language: navigator.language,
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
  if (!data.version || compareVersions(previousVersion, '2.4.0') < 0) {
    await chrome.storage.local.clear()
    _storage = genDefaultLocalStorage()
  } else {
    _storage = deepmerge(genDefaultLocalStorage(), data)
  }
  mContent = genStorageContent(_storage)
  chrome.storage.local.set(_storage).then(() => reRequestHeader())
  return mContent
})

/**
 * 获取配置
 */
export const getLocalStorage = async () => {
  if (mContent !== undefined) {
    return mContent
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
export const updateLocalWhitelist = async (data: { add?: string[], del?: string[] }) => {
  const [storage, { add, remove }] = await getLocalStorage()
  data.del?.length && data.del.forEach(v => remove(v))
  data.add?.length && data.add.forEach(v => add(v))
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