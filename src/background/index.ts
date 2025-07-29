import { applySubscribeStorage, cleanLocalWhitelist, getLocalStorage, initLocalStorage, reBrowserSeed, updateLocalConfig, updateLocalWhitelist } from "./storage";
import { getBadgeContent, removeBadge, setBadgeWhitelist } from "./badge";
import { injectScript, reRegisterScript } from './script';
import { type MRuntimeRequest, type MRuntimeResponseCall, MRuntimeType } from "@/message/runtime";
import { tryUrl } from "@/utils/base";
import { reRequestHeader } from "./request";

const hookRecords = new Map<number, Partial<Record<HookFingerprintKey, number>>>()

const noticePool = new Map<number, Record<string, number>>();

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
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (
    reason === chrome.runtime.OnInstalledReason.INSTALL ||
    reason === chrome.runtime.OnInstalledReason.UPDATE
  ) {
    initLocalStorage().then(() => reRegisterScript())
    reBrowserSeed()
  }
});

/**
 * 重启浏览器触发
 */
chrome.runtime.onStartup.addListener(() => {
  initLocalStorage().then(() => reRegisterScript())
  reBrowserSeed()
});

/**
 * 消息处理
 */
chrome.runtime.onMessage.addListener((msg: MRuntimeRequest[MRuntimeType], sender, sendResponse: MRuntimeResponseCall) => {
  switch (msg.type) {
    case MRuntimeType.SetConfig: {
      updateLocalConfig(msg.config).then((data) => {
        reRegisterScript()
        if (msg.result) sendResponse(data);
      })
      return msg.result
    }
    case MRuntimeType.GetNotice: {
      sendResponse(noticePool.get(msg.tabId));
      break
    }
    case MRuntimeType.SetHookRecords: {
      const tabId = sender.tab?.id
      if (tabId == null) return;
      noticePool.set(tabId, msg.data)
      const { text, color } = getBadgeContent(msg.total)
      chrome.action.setBadgeText({ tabId, text });
      chrome.action.setBadgeBackgroundColor({ tabId, color });
      break
    }
    case MRuntimeType.UpdateWhitelist: {
      const fun = () => reRegisterScript()
      if (msg.clean) cleanLocalWhitelist().then(fun);
      if (msg.data) updateLocalWhitelist(msg.data).then(fun);
      break
    }
    case MRuntimeType.GetNewVersion: {
      getNewVersion().then((version) => {
        sendResponse(version)
      })
      return true
    }
    case MRuntimeType.Subscribe: {
      const fun = async () => {
        if (msg.url != null) await updateLocalConfig({ subscribe: { url: msg.url.trim() } });
        if (await applySubscribeStorage()) {
          const [storage] = await getLocalStorage()
          sendResponse(storage)
        } else {
          sendResponse(undefined)
        }
      }
      fun()
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

    // 兼容模式注入，内部判断是否需要注入
    injectScript(tabId, storage)

    const _url = tab.url ? tryUrl(tab.url) : undefined
    if (!_url?.hostname) return;

    if (match(_url.hostname)) {
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

// chrome.webNavigation.onCommitted.addListener((details) => {})

/**
 * 监听权限添加
 */
chrome.permissions.onAdded.addListener((perms) => {
  if (perms.permissions?.includes('userScripts')) {
    reRegisterScript()
  }
})
