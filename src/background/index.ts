import { compareVersions, genRandomSeed, urlToHttpHost } from "@/utils/base";
import { debounce } from "@/utils/timer";
import deepmerge from "deepmerge";
import { HookType, RuntimeMsg } from '@/types/enum'

const SPECIAL_KEYS: (keyof HookFingerprint['other'])[] = ['canvas', 'audio', 'webgl', 'webrtc', 'timezone']

let localStorage: LocalStorageObject | undefined
const hookRecords = new Map<number, Partial<Record<HookFingerprintKey, number>>>()

const BADGE_COLOR = {
  whitelist: '#fff',
  low: '#7FFFD4',
  high: '#F4A460',
}

/**
 * 生成默认配置
 */
const genDefaultLocalStorage = (): LocalStorage => {
  const manifest = chrome.runtime.getManifest()
  const defaultHook: BaseHookMode = { type: HookType.default }
  const browserHook: BaseHookMode = { type: HookType.browser }
  return {
    version: manifest.version,
    config: {
      enable: true,
      customSeed: genRandomSeed(),
      browserSeed: genRandomSeed(),
      fingerprint: {
        navigator: {
          appVersion: browserHook,
          platform: browserHook,
          userAgent: browserHook,
          language: defaultHook,
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
          audio: browserHook,
          webgl: defaultHook,
          webrtc: defaultHook,
        },
      },
    },
    whitelist: []
  }
}

/**
 * 初始化默认配置
 */
const initLocalConfig = (previousVersion: string | undefined) => {
  chrome.storage.local.get().then((data: Partial<LocalStorage>) => {
    if (
      // 其中一个版本号不存
      (!data.version || !previousVersion) ||
      // 配置版本号小于2.0.0
      (compareVersions(data.version, '2.0') < 0)
    ) {
      // 清空存储并使用设置存储为默认值
      chrome.storage.local.clear().then(() => {
        const temp = genDefaultLocalStorage()
        chrome.storage.local.set(temp).then(() => {
          localStorage = { ...temp, whitelist: new Set(temp.whitelist) }
        })
      })
    } else {
      chrome.storage.local.set({ config: {...data.config, browserSeed: genRandomSeed()} })
      localStorage = { ...data, whitelist: new Set(data.whitelist) } as LocalStorageObject
    }
  })
}

/**
 * 存储配置
 */
const saveLocalConfig = debounce(() => {
  localStorage && chrome.storage.local.set({ config: localStorage.config })
}, 500)

/**
 * 存储白名单
 */
const saveLocalWhitelist = debounce(() => {
  localStorage && chrome.storage.local.set({ whitelist: [...localStorage.whitelist] })
}, 500)

/**
 * 修改配置
 */
const updateLocalConfig = (config: DeepPartial<LocalStorageConfig>) => {
  if (!localStorage?.config) return
  localStorage.config = deepmerge<LocalStorageConfig, DeepPartial<LocalStorageConfig>>(localStorage.config, config)
  saveLocalConfig()
}

/**
 * 修改白名单
 */
const updateLocalWhitelist = (type: 'add' | 'del', host: string) => {
  if (!localStorage?.whitelist) return
  if (type === 'add') {
    localStorage.whitelist.add(host)
  } else if (type === 'del') {
    localStorage.whitelist.delete(host)
  }
  saveLocalWhitelist()
}

/**
 * 获取Badge内容
 * @returns [文本, 颜色]
 */
const getBadgeContent = (records: Partial<Record<HookFingerprintKey, number>>): [string, string] => {
  let baseNum = 0
  let specialNum = 0
  for (const [key, num] of Object.entries(records)) {
    if (SPECIAL_KEYS.includes(key as any)) {
      specialNum += num
    } else {
      baseNum += num
    }
  }
  return [String(specialNum || baseNum), specialNum ? BADGE_COLOR.high : BADGE_COLOR.low]
}


/**
 * 初次启动扩展时触发（浏览器更新、扩展更新触发）
 */
chrome.runtime.onInstalled.addListener(({ reason, previousVersion }) => {
  if (
    reason === chrome.runtime.OnInstalledReason.INSTALL ||
    reason === chrome.runtime.OnInstalledReason.UPDATE
  ) {
    initLocalConfig(previousVersion)
  }
});

/**
 * 重启浏览器触发
 */
chrome.runtime.onStartup.addListener(() => {
  initLocalConfig(chrome.runtime.getManifest().version)
});

/**
 * 消息处理
 */
chrome.runtime.onMessage.addListener((msg: MsgRequest, sender, sendResponse: RespFunc) => {
  switch (msg.type) {
    case RuntimeMsg.SetConfig: {
      updateLocalConfig(msg.config)
      break
    }
    case RuntimeMsg.GetNotice: {
      const isWhitelist = localStorage?.whitelist.has(msg.host);
      (sendResponse as RespFunc<GetNoticeMsg>)(isWhitelist ?
        {
          type: 'whitelist',
        } : {
          type: 'record',
          data: hookRecords.get(msg.tabId)
        })
      break
    }
    case RuntimeMsg.SetHookRecords: {
      const tabId = sender.tab?.id
      if (tabId === undefined) return
      hookRecords.set(tabId, msg.data)
      const [text, color] = getBadgeContent(msg.data)
      chrome.action.setBadgeText({ tabId, text });
      chrome.action.setBadgeBackgroundColor({ tabId, color });
      break
    }
    case RuntimeMsg.AddWhitelist: {
      updateLocalWhitelist('add', msg.host)
      break
    }
    case RuntimeMsg.DelWhitelist: {
      updateLocalWhitelist('del', msg.host)
      break
    }
  }
})

/**
 * 监听tab变化
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if(!tab.url)return
  if (changeInfo.status === 'loading') {
    const host = urlToHttpHost(tab.url)
    if(!host)return
    if(localStorage?.whitelist.has(host)){
      chrome.action.setBadgeText({ tabId, text: ' ' });
      chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR.whitelist })
    }
  }
});

