import { compareVersions, genRandomSeed, urlToHttpHost } from "@/utils/base";
import { debounce } from "@/utils/timer";
import deepmerge from "deepmerge";
import { HookType, ContentMsg, RuntimeMsg } from '@/types/enum'
import { selectTabByHost, sendMessageToAllTags } from "@/utils/tabs";
import { tabUpdateScriptState } from "@/message/tabs";
import { isolatedScript } from "@/scripts/func";

// @ts-ignore
import injectSrc from '@/scripts/inject?script&module'
import { EquipmentInfoHandler } from "@/utils/equipment";

const UA_NET_RULE_ID = 1

const SPECIAL_KEYS: (keyof HookFingerprint['other'])[] = ['canvas', 'audio', 'webgl', 'webrtc', 'timezone']

let localStorage: LocalStorageObject | undefined
const hookRecords = new Map<number, Partial<Record<HookFingerprintKey, number>>>()

let loadingConfig = false

// const userAgentCache: Partial<Record<HookType, string>> = {}

const BADGE_COLOR = {
  whitelist: '#fff',
  low: '#7FFFD4',
  high: '#F4A460',
}

let newVersion: string | undefined

/**
 * 获取最新版本号
 */
const getNewVersion = async () => {
  if(newVersion){
    return newVersion
  }else{
    const data = await fetch('https://api.github.com/repos/omegaee/my-fingerprint/releases/latest').then(data => data.json())
    newVersion = data.tag_name
    return newVersion
  }
}

/**
 * 刷新请求头UA
 */
const refreshRequestHeaderUA = async () => {
  if(!localStorage?.config.enable || !localStorage?.config.hookNetRequest) return undefined
  const mode = localStorage?.config.fingerprint.navigator.equipment
  
  /// Get Seed
  let seed: number | undefined;
  switch (mode.type) {
    case HookType.browser:{
      seed = localStorage?.config.browserSeed
      break;
    }
    case HookType.seed:{
      seed = localStorage?.config.customSeed
      break;
    }
    default:{
      seed = undefined
    }
  }

  if(seed){
    try{
      const eh = new EquipmentInfoHandler(navigator, seed)
      const requestHeaders: chrome.declarativeNetRequest.ModifyHeaderInfo[] = []
      if(eh.userAgent){
        requestHeaders.push({
          header: "User-Agent",
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          value: eh.userAgent,
        })
      }
      if(eh.brands){
        requestHeaders.push({
          header: "Sec-Ch-Ua",
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          value: eh.brands.map((brand) => `"${brand.brand}";v="${brand.version}"`).join(", "),
        })
      }

      const heValues = await eh.getHighEntropyValues()
      if(heValues.fullVersionList){
        requestHeaders.push({
          header: "Sec-Ch-Ua-Full-Version-List",
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          value: heValues.fullVersionList.map((brand) => `"${brand.brand}";v="${brand.version}"`).join(", "),
        })
      }
      if(heValues.uaFullVersion){
        requestHeaders.push({
          header: "Sec-Ch-Ua-Full-Version",
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          value: heValues.uaFullVersion,
        })
      }

      if(requestHeaders.length){
        chrome.declarativeNetRequest.updateSessionRules({
          removeRuleIds: [UA_NET_RULE_ID],
          addRules: [{
            id: UA_NET_RULE_ID,
            // priority: 1,
            condition: {
              resourceTypes: Object.values(chrome.declarativeNetRequest.ResourceType),
              // resourceTypes: [RT.MAIN_FRAME, RT.SUB_FRAME, RT.IMAGE, RT.FONT, RT.MEDIA, RT.STYLESHEET, RT.SCRIPT ],
            },
            action: {
              type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
              requestHeaders,
            },
          }],
        })
        return
      }

    }catch(err){}
  }

  chrome.declarativeNetRequest.updateSessionRules({removeRuleIds: [UA_NET_RULE_ID]})
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
          equipment: browserHook, 
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
const initLocalConfig = (previousVersion: string | undefined) => {
  if(loadingConfig)return
  if(localStorage)return
  loadingConfig = true

  return chrome.storage.local.get()
  .then(async (data: Partial<LocalStorage>) => {
    if (
      // 其中一个版本号不存
      (!data.version || !previousVersion) ||
      // 配置版本号小于2.0.0
      (compareVersions(data.version, '2.0.0') < 0)
    ) {
      // 清空存储并使用设置存储为默认值
      await chrome.storage.local.clear()
      const temp = genDefaultLocalStorage()
      localStorage = { ...temp, whitelist: new Set(temp.whitelist) }
      chrome.storage.local.set(temp).then(() => refreshRequestHeaderUA())
      return localStorage
    } else {
      localStorage = { ...data, whitelist: new Set(data.whitelist) } as LocalStorageObject
      localStorage.config.browserSeed = genRandomSeed()
      chrome.storage.local.set({ config: localStorage.config }).then(() => refreshRequestHeaderUA())
      return localStorage
    }
  })
  .finally(() => loadingConfig = false)
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
  if(config.enable !== undefined || config.hookNetRequest !== undefined || config.fingerprint?.navigator?.equipment){
    refreshRequestHeaderUA()
  }
}

/**
 * 修改白名单
 */
const updateLocalWhitelist = (type: 'add' | 'del', host: string | string[]) => {
  if (!localStorage?.whitelist) return
  if(Array.isArray(host)){
    if (type === 'add') {
      for(const hh of host){
        localStorage.whitelist.add(hh)
      }
    } else if (type === 'del') {
      for(const hh of host){
        localStorage.whitelist.delete(hh)
      }
    }
  }else{
    if (type === 'add') {
      localStorage.whitelist.add(host)
    } else if (type === 'del') {
      localStorage.whitelist.delete(host)
    }
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
      sendMessageToAllTags<SetConfigRequest>({
        type: RuntimeMsg.SetConfig,
        config: msg.config
      })
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
    case RuntimeMsg.UpdateWhitelist: {
      if(msg.mode === 'add'){
        updateLocalWhitelist('add', msg.host)
        selectTabByHost(msg.host).then((tabs) => tabs.forEach((tab) => {
          if(tab.id){
            setBadgeWhitelist(tab.id)
            tabUpdateScriptState(tab.id, 'disable')
          }
        }))
      }else if (msg.mode === 'del') {
        updateLocalWhitelist('del', msg.host)
        selectTabByHost(msg.host).then((tabs) => tabs.forEach((tab) => {
          if(tab.id){
            remBadge(tab.id)
            tabUpdateScriptState(tab.id, 'enable')
          }
        }))
      }
      break
    }
    case RuntimeMsg.GetNewVersion: {
      getNewVersion().then((version) => {
        let isNew = false
        if(localStorage?.version && version){
          isNew = compareVersions(localStorage.version, version) < 0
        }
        (sendResponse as RespFunc<GetNewVersionMsg>)(isNew)
      })
      break
    }
  }
})

/**
 * 注入脚本
 */
const injectScript = (tabId: number, localStorage: LocalStorageObject) => {
  chrome.scripting.executeScript({ 
    target: {
      tabId,
      allFrames: true,
    },
    world: 'ISOLATED',
    injectImmediately: true,
    args: [
      chrome.runtime.getURL(injectSrc), 
      {...localStorage, whitelist: [...localStorage.whitelist]}, 
      { ContentMsg, RuntimeMsg, }
    ],
    func: isolatedScript,
  })
}

/**
 * 监听tab变化
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.url) return

  if (changeInfo.status === 'loading') {    
    const host = urlToHttpHost(tab.url)
    if(!host)return

    if(localStorage){
      // 缓存存在
      injectScript(tabId, localStorage)
    }else{
      // 缓存被清理
      initLocalConfig(chrome.runtime.getManifest().version)?.then((data) => {
        injectScript(tabId, data)
      })
    }

    if (localStorage?.whitelist.has(host)) {
      setBadgeWhitelist(tabId)
    }
  }
});
