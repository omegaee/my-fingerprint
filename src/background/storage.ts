import { genRandomSeed, existParentDomain } from "@/utils/base";
import { debounce, sharedAsync } from "@/utils/timer";
import { reRequestHeader } from "./request";
import { HookType } from '@/types/enum'
import { hasUserScripts } from "./script";

let mContent: LocalStorageContent | undefined

type LocalStorageWhitelist = {
  match: (v: string) => boolean
  add: (v: string) => void
  remove: (v: string) => void
  clean: () => void
}

type LocalStorageContent = [
  LocalStorage,
  LocalStorageWhitelist,
] & {
  storage: LocalStorage
  whitelist: LocalStorageWhitelist
}

/**
 * 格式化LocalStorage
 */
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
    clean() {
      storage.whitelist = []
    }
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
          ua: { type: HookType.default },
          uaVersion: { type: HookType.default },
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
          canvas: { type: HookType.browser },
          audio: { type: HookType.default },
          webgl: { type: HookType.browser },
          webrtc: { type: HookType.default },
          font: { type: HookType.default },
          webgpu: { type: HookType.default },
          domRect: { type: HookType.default },
        },
      },
      action: {
        fastInject: hasUserScripts() ? true : false,
      },
      input: {
        globalSeed: String(sGlobal),
      },
      subscribe: {
        url: 'config.json'
      },
      prefs: {
        language: navigator.language,
        theme: 'system',
      },
    },
    whitelist: []
  }
}

/**
 * 合并存储（dst覆盖src，合并到dst）
 * 会修改dst
 */
const mergeStorage = (src: LocalStorageConfig, dst?: DeepPartial<LocalStorageConfig>): LocalStorageConfig => {
  if (!dst) return src;
  for (const key in dst) {
    if (key === 'value') continue;
    // @ts-ignore
    if (!(key in src)) {
      // @ts-ignore
      delete dst[key];
    }
  }
  for (const key in src) {
    // @ts-ignore
    const srcValue = src[key];
    if (key in dst) {
      if (key === 'value') continue;
      if (typeof srcValue === 'object' && !Array.isArray(srcValue)) {
        // @ts-ignore
        mergeStorage(srcValue, dst[key]);
      }
    } else {
      // @ts-ignore
      dst[key] = srcValue;
    }
  }
  // @ts-ignore
  return dst;
}

/**
 * 初始化默认配置
 */
export const initLocalStorage = sharedAsync(async () => {
  /* init config */
  const _curr = await chrome.storage.local.get() as LocalStorage
  let _new = genDefaultLocalStorage()
  const _config = mergeStorage(_new.config, _curr.config)
  /* clear */
  const rem = Object.keys(_curr).filter((key) => !(key in _new))
  if (rem.length) {
    chrome.storage.local.remove(rem)
  }
  /* set */
  const _storage: LocalStorage = {
    version: _new.version,
    config: _config,
    whitelist: _curr.whitelist ?? _new.whitelist,
  }
  mContent = genStorageContent(_storage)
  chrome.storage.local.set(_storage).then(() => {
    reRequestHeader()
    applySubscribeStorage()
  })
  return mContent
})

/**
 * 从url中拉取配置
 */
export const applySubscribeStorage = async () => {
  const [storage, { match }] = await getLocalStorage();

  let url = storage.config.subscribe.url.trim()
  if (url === '') return true;
  if (!url.includes("://")) url = chrome.runtime.getURL(url);

  /* 拉取内容 */
  const data = await fetch(url)
    .then(data => data.json() as DeepPartial<LocalStorage>)
    .catch(e => console.warn('Pull config failed: ' + e))

  if (!data) return false;
  /* 加载配置 */
  if (data.config && Object.keys(data.config).length) {
    // 移除不支持的配置
    delete data.config.prefs;
    delete data.config.action?.fastInject;
    // 更新配置
    await updateLocalConfig(data.config)
  }
  /* 加载白名单 */
  if (data.whitelist?.length) {
    const wlist = data.whitelist.filter(v => !match(v))  // 去重
    if (wlist.length) await updateLocalWhitelist({ add: wlist });
  }
  return true;
}

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
  storage.config = mergeStorage(storage.config, config)
  saveLocalConfig(storage.config)
  reRequestHeader()
  return storage.config
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
  return storage.whitelist
}

/**
 * 清理白名单
 */
export const cleanLocalWhitelist = async () => {
  const [storage, { clean }] = await getLocalStorage()
  clean()
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