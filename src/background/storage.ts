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

const randNonce = () => Math.floor(Math.random() * 1e9);

/**
 * 格式化LocalStorage
 */
const genStorageContent = (storage: LocalStorage): LocalStorageContext => ({
  storage,
  whitelistHelper: new SiteListHelper(storage, 'whitelist'),
  blacklistHelper: new SiteListHelper(storage, 'blacklist'),
  configNonce: randNonce(),
  policiesNonce: randNonce(),
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
function deepMerge<T>(target: T, source: DeepPartial<T>): T {
  if (typeof target !== "object" || target === null) return source as T;
  if (typeof source !== "object" || source === null) return target;

  // 如果 source 是对象且包含 type 字段，则直接替换
  if ("type" in (source as any)) {
    return source as T;
  }

  const result: any = Array.isArray(target) ? [...target] : { ...target };

  for (const key of Object.keys(source)) {
    const srcVal = (source as any)[key];
    const tgtVal = (target as any)[key];

    if (
      typeof srcVal === "object" &&
      srcVal !== null &&
      !Array.isArray(srcVal)
    ) {
      // 如果子对象有 type 字段，直接替换
      if ("type" in srcVal) {
        result[key] = srcVal;
      } else {
        result[key] = deepMerge(tgtVal, srcVal);
      }
    } else {
      result[key] = srcVal;
    }
  }

  return result;
}


/**
 * 初始化默认配置
 */
export const initLocalStorage = sharedAsync(async () => {
  /* init config */
  const _curr = await chrome.storage.local.get() as LocalStorage
  let _new = genDefaultLocalStorage()

  const _config = deepMerge(_new.config, _curr.config)

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
  const { storage } = await getLocalStorage();

  let url = storage.config.subscribe.url.trim()
  if (url === '') return true;
  if (!url.includes("://")) url = chrome.runtime.getURL(url);

  /* 拉取内容 */
  const data = await fetch(url)
    .then(data => data.json() as DeepPartial<LocalStorage>)
    .catch(e => console.warn('Pull config failed: ' + e))

  if (!data) return false;

  /* 加载配置 */
  await importContext(data)
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
  const ctx = await getLocalStorage()
  const storage = ctx.storage

  if (v.config) {
    storage.config = deepMerge(storage.config, v.config)
    ctx.configNonce = randNonce()
  }

  if (v.policies) {
    storage.policies = {
      ...storage.policies,
      ...v.policies,
    }
    ctx.whitelistHelper = new SiteListHelper(storage, 'whitelist')
    ctx.blacklistHelper = new SiteListHelper(storage, 'blacklist')
    ctx.policiesNonce = randNonce()
  }

  saveContextToLocalStorage()

  reRegisterScript()
  reRequestHeader()

  return storage
}

/**
 * 导入配置
 */
export const importContext = async (data: DeepPartial<LocalStorage>) => {
  const { storage, whitelistHelper, blacklistHelper } = await getLocalStorage();

  if (data.config) {
    delete data.config.prefs;
    delete data.config.action?.fastInject;
    await updateContext({ config: data.config })
  }

  const ps = data.policies

  const wlist = [
    ...(ps?.whitelist ?? []),
    ...((data as any).whitelist ?? []),
  ];
  if (wlist?.length) whitelistHelper.addList(wlist);

  const blist = [
    ...(ps?.blacklist ?? []),
    ...((data as any).blacklist ?? []),
  ];
  if (blist?.length) blacklistHelper.addList(blist);

  if (ps?.isBlacklistMode != null && storage.policies.isBlacklistMode !== ps.isBlacklistMode) {
    await updateContext({
      policies: {
        isBlacklistMode: ps.isBlacklistMode
      }
    })
  }

  return storage;
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