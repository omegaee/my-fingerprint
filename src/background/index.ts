import { compareVersions, genRandomSeed } from "@/utils/base";
import { debounce } from "@/utils/timer";
import deepmerge from "deepmerge";
import { HookType, RuntimeMsg } from '@/types/enum'

let localConfig: LocalStorageConfig | undefined

/**
 * 生成默认配置
 */
const genDefaultLocalConfig = (): LocalStorageConfig => {
  const manifest = chrome.runtime.getManifest()
  const defaultHook: BaseHookMode = { type: HookType.default }
  const browserHook: BaseHookMode = { type: HookType.browser }
  return {
    version: manifest.version,
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
  }
}

/**
 * 初始化默认配置
 */
const initLocalConfig = (previousVersion: string | undefined) => {
  chrome.storage.local.get().then((data: Partial<LocalStorageConfig>) => {
    if(
      // 其中一个版本号不存
      (!data.version || !previousVersion) ||
      // 配置版本号小于2.0.0
      (compareVersions(data.version, '2.0') < 0)
    ){
      // 清空存储并使用设置存储为默认值
      chrome.storage.local.clear().then(() => {
        localConfig = genDefaultLocalConfig()
        chrome.storage.local.set(localConfig)
      })
    }else{      
      localConfig = data as LocalStorageConfig
    }
  })
}

/**
 * 存储配置
 */
const saveLocalConfig = debounce(() => {
  localConfig && chrome.storage.local.set(localConfig)
}, 500)

/**
 * 修改配置
 */
const updateLocalConfig = (config: DeepPartial<LocalStorageConfig>) => {
  if(localConfig){
    localConfig = deepmerge<LocalStorageConfig, DeepPartial<LocalStorageConfig>>(localConfig, config)
    saveLocalConfig()
  }
}

/**
 * 初次启动扩展时触发（浏览器更新、扩展更新触发）
 */
chrome.runtime.onInstalled.addListener(({reason, previousVersion}) => {
  if(
    reason === chrome.runtime.OnInstalledReason.INSTALL ||
    reason === chrome.runtime.OnInstalledReason.UPDATE
  ){
    initLocalConfig(previousVersion)
  }
});

/**
 * 重启浏览器触发
 */
chrome.runtime.onStartup.addListener(() => {
  initLocalConfig(chrome.runtime.getManifest().version)
});

// /**
//  * 监听tab变化
//  */
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === 'loading') {
//     if(!tab.url)return
//     if (themeMap?.get(tab.url)) {
//       chrome.action.setIcon({path: 'logo.png', tabId: tabId});
//     } else {
//       chrome.action.setIcon({path: 'logo-gray.png', tabId: tabId});
//     }
//   }
// });

/**
 * 消息处理
 */
chrome.runtime.onMessage.addListener((msg: MsgRequest, sender, sendResponse: RespFunc) => {
  switch(msg.type){
    case RuntimeMsg.SetConfig:{
      updateLocalConfig(msg.config)
      break
    }
    case RuntimeMsg.GetNotice:{
      (sendResponse as RespFunc<GetNoticeMsg>)({
        type: 'whitelist',
      })
      break
    }
  }
})

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if(localConfig && changeInfo.status === 'loading'){
//     chrome.scripting.executeScript({
//       target: {tabId, allFrames: true},
//       files: ['src/scripts/content.ts.js'],
//     })
//   }
// })