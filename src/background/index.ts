import { getLocalStorage, initLocalStorage, reBrowserSeed, updateLocalConfig, updateLocalWhitelist } from "./storage";
import { getBadgeContent, removeBadge, setBadgeWhitelist } from "./badge";
import { injectScript, isRegScript, reRegisterScript } from './script';
import { type MRuntimeRequest, MRuntimeResponse, type MRuntimeResponseCall, MRuntimeType } from "@/message/runtime";
import { urlToHostname } from "@/utils/base";
import { reRequestHeader } from "./request";

const hookRecords = new Map<number, Partial<Record<HookFingerprintKey, number>>>()

let newVersion: string | undefined

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
 * 初次启动扩展时触发（浏览器更新、扩展更新触发）
 */
chrome.runtime.onInstalled.addListener(({ reason, previousVersion }) => {
  if (
    reason === chrome.runtime.OnInstalledReason.INSTALL ||
    reason === chrome.runtime.OnInstalledReason.UPDATE
  ) {
    initLocalStorage(previousVersion)
    reBrowserSeed()
  }
});

/**
 * 重启浏览器触发
 */
chrome.runtime.onStartup.addListener(() => {
  initLocalStorage(chrome.runtime.getManifest().version)
  reBrowserSeed()
});

/**
 * 消息处理
 */
chrome.runtime.onMessage.addListener((msg: MRuntimeRequest[MRuntimeType], sender, sendResponse: MRuntimeResponseCall) => {
  switch (msg.type) {
    case MRuntimeType.SetConfig: {
      updateLocalConfig(msg.config)
      if (isRegScript) {
        reRegisterScript();
      }
      break
    }
    case MRuntimeType.GetNotice: {
      getLocalStorage().then(([_, { match }]) => {
        const isWhitelist = match(msg.host);
        const result: MRuntimeResponse[MRuntimeType.GetNotice] = isWhitelist ?
          {
            type: 'whitelist',
          } : {
            type: 'record',
            data: hookRecords.get(msg.tabId)
          };
        sendResponse(result);
      })
      return true
    }
    case MRuntimeType.SetHookRecords: {
      const tabId = sender.tab?.id
      if (tabId === undefined) return
      hookRecords.set(tabId, msg.data)
      const [text, color] = getBadgeContent(msg.data)
      chrome.action.setBadgeText({ tabId, text });
      chrome.action.setBadgeBackgroundColor({ tabId, color });
      break
    }
    case MRuntimeType.UpdateWhitelist: {
      if (msg.mode === 'add') {
        updateLocalWhitelist('add', msg.host)
      } else if (msg.mode === 'del') {
        updateLocalWhitelist('del', msg.host)
      }
      if (isRegScript) {
        reRegisterScript();
      }
      break
    }
    case MRuntimeType.GetNewVersion: {
      getNewVersion().then((version) => {
        sendResponse(version)
      })
      return true
    }
  }
})

/**
 * 监听tab变化
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    const [storage, { match }] = await getLocalStorage()

    if (!isRegScript) {
      injectScript(tabId, storage)
    }

    const host = tab.url ? urlToHostname(tab.url) : undefined
    if (!host) return;

    if (match(host)) {
      reRequestHeader(tabId)
      setBadgeWhitelist(tabId)
    } else {
      reRequestHeader(undefined, tabId)
    }
  }
});

/**
 * 监听tab关闭
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  reRequestHeader(undefined, tabId)
  hookRecords.delete(tabId)
  removeBadge(tabId)
})

// /**
//  * 监听导航
//  */
// chrome.webNavigation.onCommitted.addListener((details) => {
// })

if (isRegScript) {
  /* 注册脚本 */
  reRegisterScript();
}
