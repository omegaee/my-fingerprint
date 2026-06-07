import { genRandomSeed } from "@/utils/base";
import { debounce, sharedAsync } from "@/utils/timer";
import { reRequestHeader } from "./request";
import { HookType } from '@/types/enum'
import { hasUserScripts, reRegisterScript } from "./script";
import { logManager } from "@/utils/log";
import { setWebRTCPolicy } from "./privacy";
import { domainMergeDedup } from "@/utils/url";

let mContent: LocalStorageContext | undefined

type LocalStorageContext = {
  storage: LocalStorage
  configNonce: number
  policiesNonce: number
}

const randNonce = () => Math.floor(Math.random() * 1e9);

/**
 * 格式化LocalStorage
 */
const genStorageContent = (storage: LocalStorage): LocalStorageContext => ({
  storage,
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
        logLevel: 'ERROR',
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
 * 合并存储, source 合并到 target
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
  let _default = genDefaultLocalStorage()

  /* clear */
  const rem = Object.keys(_curr).filter((key) => !(key in _default))
  if (rem.length) {
    chrome.storage.local.remove(rem)
  }

  /* set */
  const _storage: LocalStorage = {
    version: _default.version,
    config: deepMerge(_default.config, _curr.config),
    policies: {
      whitelist: domainMergeDedup(
        _curr.policies?.whitelist,
        (_curr as any).whitelist,
        _default.policies.whitelist,
      ),
      blacklist: domainMergeDedup(
        _curr.policies?.blacklist,
        (_curr as any).blacklist,
        _default.policies.blacklist,
      ),
      isBlacklistMode: _curr.policies?.isBlacklistMode ?? _default.policies.isBlacklistMode,
    },
  }

  /** 刷新浏览器种子 */
  _storage.config.seed.browser = genRandomSeed()

  /** 更新日志等级 */
  logManager.setLevel(_storage.config.prefs.logLevel)

  /** 其他 */
  mContent = genStorageContent(_storage)
  chrome.storage.local.set(_storage).then(() => {
    reRegisterScript()
    reRequestHeader()
    applySubscribeStorage()
  })

  onAfterInit(mContent)

  return mContent;
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

  await onBeforeUpdateContext(ctx, v);

  if (v.config) {
    storage.config = deepMerge(storage.config, v.config)
    ctx.configNonce = randNonce()
  }

  if (v.policies) {
    storage.policies = {
      ...storage.policies,
      ...v.policies,
    }
    ctx.policiesNonce = randNonce()
  }

  onUpdateContext(ctx)

  return storage
}

/**
 * 导入配置
 */
export const importContext = async (data: DeepPartial<LocalStorage>) => {
  const ctx = await getLocalStorage();
  const { storage } = ctx;

  let isUpdate = false;

  await onBeforeUpdateContext(ctx, data);

  if (data.config) {
    delete data.config.prefs;
    delete data.config.action?.fastInject;
    await updateContext({ config: data.config })

    ctx.configNonce = randNonce()
    isUpdate = true
  }

  if (data.policies?.whitelist?.length !== 0 || (data as any)?.whitelist?.length !== 0) {
    storage.policies.whitelist = domainMergeDedup(
      storage.policies.whitelist,
      data.policies?.whitelist,
      (data as any).whitelist,
    );

    ctx.policiesNonce = randNonce()
    isUpdate = true
  }

  if (data.policies?.blacklist?.length !== 0 || (data as any)?.blacklist?.length !== 0) {
    storage.policies.blacklist = domainMergeDedup(
      storage.policies.blacklist,
      data.policies?.blacklist,
      (data as any).blacklist,
    );

    ctx.policiesNonce = randNonce()
    isUpdate = true
  }

  if (data.policies?.isBlacklistMode != null && storage.policies.isBlacklistMode !== data.policies.isBlacklistMode) {
    await updateContext({
      policies: {
        isBlacklistMode: data.policies.isBlacklistMode
      }
    })

    ctx.policiesNonce = randNonce()
    isUpdate = true
  }

  if (isUpdate) {
    onUpdateContext(ctx)
  }

  return storage;
}

/**
 * 初始化之后执行
 */
const onAfterInit = async ({ storage }: LocalStorageContext) => {
  const webrtcMode = storage.config.fp.other.webrtc
  if (webrtcMode.type === HookType.enabled) {
    await setWebRTCPolicy({})
  }
}

/**
 * 更新配置前执行
 * @param obj 新配置
 */
const onBeforeUpdateContext = async ({ storage }: LocalStorageContext, obj: DeepPartial<LocalStorage>) => {
  const logLevel = obj.config?.prefs?.logLevel;
  if (logLevel && logLevel !== storage.config.prefs.logLevel) {
    logManager.setLevel(logLevel);
  }

  /** WebRTC */
  const webrtcNext = obj.config?.fp?.other?.webrtc;
  if (webrtcNext && webrtcNext.type !== storage.config.fp.other.webrtc.type) {
    const fallbackFn = () => {
      if (webrtcNext.type !== HookType.default) {
        webrtcNext.type = HookType.disabled;
      }
    }
    if (webrtcNext.type === HookType.enabled) {
      await setWebRTCPolicy({}).catch(fallbackFn);
    } else {
      await setWebRTCPolicy().catch(fallbackFn);
    }
  }
}

/**
 * 更新配置
 */
const onUpdateContext = (_: LocalStorageContext) => {
  saveContextToLocalStorage()
  reRegisterScript()
  reRequestHeader()
}