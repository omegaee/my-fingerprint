import { applySubscribeStorage, cleanLocalWhitelist, getLocalStorage, initLocalStorage, reBrowserSeed, updateLocalConfig, updateLocalWhitelist } from "./storage";
import { removeBadge, setBadgeContent, setBadgeWhitelist } from "./badge";
import { injectScript, reRegisterScript } from './script';
import { tryUrl } from "@/utils/base";
import { reRequestHeader } from "./request";

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
  if (reason === "install" || reason === "update") {
    initLocalStorage()
    reBrowserSeed()
  }
});

/**
 * 重启浏览器触发
 */
chrome.runtime.onStartup.addListener(() => {
  initLocalStorage()
  reBrowserSeed()
});

/**
 * 消息处理
 */
chrome.runtime.onMessage.addListener(((msg, sender, sendResponse) => {
  switch (msg?.type) {
    case 'config.set': {
      updateLocalConfig(msg.config).then((data) => {
        if (msg.result) sendResponse<'config.set'>(data);
      })
      return msg.result;
    }
    case 'config.subscribe': {
      const fun = async () => {
        if (msg.url != null) await updateLocalConfig({ subscribe: { url: msg.url.trim() } });
        if (await applySubscribeStorage()) {
          const [storage] = await getLocalStorage()
          sendResponse<'config.subscribe'>(storage)
        } else {
          sendResponse<'config.subscribe'>(undefined)
        }
      }
      fun()
      return true
    }
    case 'whitelist.update': {
      if (msg.clean) cleanLocalWhitelist();
      if (msg.data) updateLocalWhitelist(msg.data);
      return false;
    }
    case 'version.latest': {
      getNewVersion().then((version) => {
        sendResponse<'version.latest'>(version)
      })
      return true
    }
    case 'api.check': {
      if (msg.api === 'userScripts') {
        try {
          chrome.userScripts.getScripts()
          sendResponse<'api.check'>(true)
        } catch (e) {
          sendResponse<'api.check'>(e as string)
        }
      }
      return false
    }
    case 'badge.set': {
      const tabId = sender.tab?.id
      if (tabId == null) return;
      setBadgeContent(tabId, msg.text, msg.level)
      return false;
    }
  }
}) as BackgroundMessage.Listener)

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
