import { compareVersions, genRandomSeed, urlToHttpHost } from "@/utils/base";
import { debounce, debouncedAsync } from "@/utils/timer";
import deepmerge from "deepmerge";
import { HookType, RuntimeMsg } from '@/types/enum'
import { selectTabByHost } from "@/utils/tabs";
import { genRandomVersionUserAgent, genRandomVersionUserAgentData } from "@/utils/equipment";

// // @ts-ignore
// import contentSrc from '@/scripts/content?script&module'

import { coreInject } from "@/core/output";
import { shuffleArray } from "@/utils/data";

const UA_NET_RULE_ID = 1

const SPECIAL_KEYS: (keyof HookFingerprint['other'])[] = ['timezone', 'canvas', 'audio', 'font', 'webgl', 'webrtc', 'webgpu']

let localStorage: LocalStorageObject | undefined
const hookRecords = new Map<number, Partial<Record<HookFingerprintKey, number>>>()

const RAW = {
  languages: navigator.languages,
}

const BADGE_COLOR = {
  whitelist: '#fff',
  low: '#7FFFD4',
  high: '#F4A460',
}

let newVersion: string | undefined


/**
 * 生成默认配置
 */
const genDefaultLocalStorage = (): LocalStorage => {
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
          audio: browserHook,
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
const initLocalConfig = debouncedAsync(async (previousVersion?: string) => {
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
const getLocalStorage = async (): Promise<LocalStorageObject> => {
  if (localStorage) {
    return localStorage
  } else {
    return await initLocalConfig()
  }
}

/**
 * 获取最新版本号
 */
const getNewVersion = async () => {
  if (newVersion) {
    return newVersion
  } else {
    const data = await fetch('https://api.github.com/repos/omegaee/my-fingerprint/releases/latest').then(data => data.json())
    newVersion = data.tag_name
    return newVersion
  }
}

/**
 * 获取seed
 */
const getSeedByMode = (storage: LocalStorageObject, mode: HookMode) => {
  switch (mode?.type) {
    case HookType.browser:
      return storage.config.browserSeed
    case HookType.global:
      return storage.config.customSeed
    default:
      return undefined
  }
}

/**
 * 刷新请求头UA
 */
const refreshRequestHeader = async () => {
  const storage = await getLocalStorage()

  const options: chrome.declarativeNetRequest.UpdateRuleOptions = {
    removeRuleIds: [UA_NET_RULE_ID],
  }

  if (!storage.config.enable || !storage.config.hookNetRequest) {
    chrome.declarativeNetRequest.updateSessionRules(options)
    return
  }

  const requestHeaders: chrome.declarativeNetRequest.ModifyHeaderInfo[] = []

  const equipmentSeed = getSeedByMode(storage, storage.config.fingerprint.navigator.equipment);
  if (equipmentSeed) {
    requestHeaders.push({
      header: "User-Agent",
      operation: chrome.declarativeNetRequest.HeaderOperation.SET,
      value: genRandomVersionUserAgent(equipmentSeed, navigator),
    })

    const uaData = await genRandomVersionUserAgentData(equipmentSeed, navigator)
    uaData.brands && requestHeaders.push({
      header: "Sec-Ch-Ua",
      operation: chrome.declarativeNetRequest.HeaderOperation.SET,
      value: uaData.brands.map((brand) => `"${brand.brand}";v="${brand.version}"`).join(", "),
    })
    uaData.fullVersionList && requestHeaders.push({
      header: "Sec-Ch-Ua-Full-Version-List",
      operation: chrome.declarativeNetRequest.HeaderOperation.SET,
      value: uaData.fullVersionList.map((brand) => `"${brand.brand}";v="${brand.version}"`).join(", "),
    })
    uaData.uaFullVersion && requestHeaders.push({
      header: "Sec-Ch-Ua-Full-Version",
      operation: chrome.declarativeNetRequest.HeaderOperation.SET,
      value: uaData.uaFullVersion,
    })
  }

  const langsMode = storage.config.fingerprint.navigator.languages
  if (langsMode && langsMode.type !== HookType.default) {
    /* 获取种子 */
    let langs: string[] | undefined
    if (langsMode.type === HookType.value) {
      langs = langsMode.value
    } else {
      const langSeed = getSeedByMode(storage, langsMode)
      if (langSeed) {
        langs = shuffleArray(RAW.languages, langSeed)
      }
    }
    /* 修改 */
    if (langs?.length) {
      const [first, ...rest] = langs
      let qFactor = 1
      for (let i = 0; i < rest.length && qFactor > 0.1; i++) {
        qFactor -= 0.1
        rest[i] = `${rest[i]};q=${qFactor.toFixed(1)}`
      }
      requestHeaders.push({
        header: "Accept-Language",
        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
        value: [first, ...rest].join(","),
      })
    }
  }

  if (requestHeaders.length) {
    options.addRules = [{
      id: UA_NET_RULE_ID,
      // priority: 1,
      condition: {
        excludedInitiatorDomains: [...new Set([...storage.whitelist].map((host) => host.split(':')[0]))],
        resourceTypes: Object.values(chrome.declarativeNetRequest.ResourceType),
        // resourceTypes: [RT.MAIN_FRAME, RT.SUB_FRAME, RT.IMAGE, RT.FONT, RT.MEDIA, RT.STYLESHEET, RT.SCRIPT ],
      },
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        requestHeaders,
      },
    }]
  }

  chrome.declarativeNetRequest.updateSessionRules(options)
}

/**
 * 存储配置
 */
const saveLocalConfig = debounce((storage: LocalStorageObject) => {
  chrome.storage.local.set({ config: storage.config })
}, 500)

/**
 * 存储白名单
 */
const saveLocalWhitelist = debounce((storage: LocalStorageObject) => {
  chrome.storage.local.set({ whitelist: [...storage.whitelist] })
}, 500)

/**
 * 修改配置
 */
const updateLocalConfig = async (config: DeepPartial<LocalStorageConfig>) => {
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
const updateLocalWhitelist = async (type: 'add' | 'del', host: string | string[]) => {
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
  const showNum = specialNum || baseNum
  return [showNum >= 100 ? '99+' : String(showNum), specialNum ? BADGE_COLOR.high : BADGE_COLOR.low]
}

/**
 * 设置白名单标识
 */
const setBadgeWhitelist = (tabId: number) => {
  chrome.action.setBadgeText({ tabId, text: ' ' });
  chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR.whitelist })
}

/**
 * 移除标识
 */
const remBadge = (tabId: number) => {
  chrome.action.setBadgeText({ tabId, text: '' })
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
      // sendMessageToAllTags<SetConfigRequest>({
      //   type: RuntimeMsg.SetConfig,
      //   config: msg.config
      // })
      break
    }
    case RuntimeMsg.GetNotice: {
      getLocalStorage().then((storage) => {
        const isWhitelist = storage.whitelist.has(msg.host);
        (sendResponse as RespFunc<GetNoticeMsg>)(isWhitelist ?
          {
            type: 'whitelist',
          } : {
            type: 'record',
            data: hookRecords.get(msg.tabId)
          })
      })
      return true
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
    case RuntimeMsg.UpdateWhitelist: {
      if (msg.mode === 'add') {
        updateLocalWhitelist('add', msg.host)
        selectTabByHost(msg.host).then((tabs) => tabs.forEach((tab) => {
          if (tab.id) {
            setBadgeWhitelist(tab.id)
            // tabChangeWhitelist(tab.id, 'into')
          }
        }))
      } else if (msg.mode === 'del') {
        updateLocalWhitelist('del', msg.host)
        selectTabByHost(msg.host).then((tabs) => tabs.forEach((tab) => {
          if (tab.id) {
            remBadge(tab.id)
            // tabChangeWhitelist(tab.id, 'leave')
          }
        }))
      }
      break
    }
    case RuntimeMsg.GetNewVersion: {
      getNewVersion().then((version) => {
        (sendResponse as RespFunc<GetNewVersionMsg>)(version)
      })
      return true
    }
  }
})

/**
 * 注入脚本
 */
const injectScript = (tabId: number, storage: LocalStorageObject) => {
  chrome.scripting.executeScript({
    target: {
      tabId,
      allFrames: true,
    },
    world: 'MAIN',
    injectImmediately: true,
    args: [tabId, { ...storage, whitelist: [...storage.whitelist] }],
    func: coreInject,
  }).catch(() => { })
}

const injectScriptSolution = (tabId: number, url: string) => {
  const host = urlToHttpHost(url)
  if (!host) return

  getLocalStorage().then((storage) => {
    injectScript(tabId, storage)
    if (storage.whitelist.has(host)) {
      setBadgeWhitelist(tabId)
    }
  })
}

/**
 * 监听tab变化
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.url) return
  if (changeInfo.status === 'loading') {
    injectScriptSolution(tabId, tab.url)
  }
});

// /**
//  * 监听导航
//  */
// chrome.webNavigation.onCommitted.addListener((details) => {
//   injectScriptSolution(details.tabId, details.url)
// })