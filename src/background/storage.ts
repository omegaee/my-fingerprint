import { genRandomSeed } from "@/utils/base";
import { debounce, sharedAsync } from "@/utils/timer";
import { reRequestHeader } from "./request";
import { HookType } from '@/types/enum'
import { hasUserScripts, reRegisterScript } from "./script";
import { SiteListHelper } from "./policies";

let mContent: LocalStorageContext | undefined

type LocalStorageContext = {
  storage: LocalStorage
  whitelistHelper: SiteListHelper
  blacklistHelper: SiteListHelper
  configNonce: number
  policiesNonce: number
}

/**
 * 格式化LocalStorage
 */
const genStorageContent = (storage: LocalStorage): LocalStorageContext => ({
  storage,
  whitelistHelper: new SiteListHelper(storage, 'whitelist'),
  blacklistHelper: new SiteListHelper(storage, 'blacklist'),
  configNonce: Math.floor(Math.random() * 1e9),
  policiesNonce: Math.floor(Math.random() * 1e9),
})

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
          canvas: { type: HookType.page },
          audio: { type: HookType.default },
          webgl: { type: HookType.page },
          webrtc: { type: HookType.default },
          font: { type: HookType.default },
          webgpu: { type: HookType.default },
          domRect: { type: HookType.default },
          serviceWorker: { type: HookType.default },
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
    policies: {
      whitelist: [],
      blacklist: [],
      isBlacklistMode: false,
    },
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
      const dstValue = (dst as any)[key];

      if (dstValue === null) {
        delete (dst as any)[key];
        continue;
      }

      if (key === 'value') continue;

      if (typeof srcValue === 'object' && !Array.isArray(srcValue)) {
        // @ts-ignore
        mergeStorage(srcValue, dstValue);
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
    policies: {
      whitelist: _curr.policies?.whitelist ?? _new.policies.whitelist,
      blacklist: _curr.policies?.blacklist ?? _new.policies.blacklist,
      isBlacklistMode: _curr.policies?.isBlacklistMode ?? _new.policies.isBlacklistMode,
    },
  }
  mContent = genStorageContent(_storage)
  chrome.storage.local.set(_storage).then(() => {
    reRegisterScript()
    reRequestHeader()
    applySubscribeStorage()
  })
  return mContent
})

/**
 * 从url中拉取配置
 */
export const applySubscribeStorage = async () => {
  const { storage, whitelistHelper, blacklistHelper } = await getLocalStorage();

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

    await updateContext({ config: data.config })
  }

  /* 加载策略 */
  const ps = data.policies
  if (ps) {
    if (ps.whitelist?.length) {
      whitelistHelper.addList(ps.whitelist)
    }
    if (ps.blacklist?.length) {
      blacklistHelper.addList(ps.blacklist)
    }
  }

  saveContextToLocalStorage();
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
export const saveContextToLocalStorage = debounce(() => {
  if (!mContent) return;
  chrome.storage.local.set(mContent.storage)
}, 500)

/**
 * 修改配置
 */
export const updateContext = async (v: DeepPartial<LocalStorage>) => {
  const { storage } = await getLocalStorage()

  if (v.config) {
    storage.config = mergeStorage(storage.config, v.config)
  }

  if (v.policies) {
    storage.policies = {
      ...storage.policies,
      ...v.policies,
    }
  }

  saveContextToLocalStorage()

  reRegisterScript()
  reRequestHeader()

  return storage
}

/**
 * 刷新浏览器种子
 */
export const reBrowserSeed = async () => {
  const { storage } = await getLocalStorage()
  storage.config.seed.browser = genRandomSeed()
  saveContextToLocalStorage()
  reRequestHeader()
}