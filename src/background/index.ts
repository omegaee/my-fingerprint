import { RuntimeMsg } from '@/types/enum'
import { selectTabByHost } from "@/utils/tabs";
import { getLocalStorage, initLocalStorage, updateLocalConfig, updateLocalWhitelist } from "./storage";
import { getBadgeContent, removeBadge, setBadgeWhitelist } from "./badge";
import { injectScript, isRegScript, reRegisterScript } from './script';

// // @ts-ignore
// import contentSrc from '@/scripts/content?script&module'

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
  }
});

/**
 * 重启浏览器触发
 */
chrome.runtime.onStartup.addListener(() => {
  initLocalStorage(chrome.runtime.getManifest().version)
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
      if (isRegScript) {
        reRegisterScript();
      }
      break
    }
    case RuntimeMsg.GetNotice: {
      getLocalStorage().then(([_, whitelist]) => {
        const isWhitelist = whitelist.has(msg.host);
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
          }
        }))
      } else if (msg.mode === 'del') {
        updateLocalWhitelist('del', msg.host)
        selectTabByHost(msg.host).then((tabs) => tabs.forEach((tab) => {
          if (tab.id) {
            removeBadge(tab.id)
          }
        }))
      }
      if (isRegScript) {
        reRegisterScript();
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

if (isRegScript) {
  /* 注册脚本 */
  reRegisterScript();
} else {
  /**
  * 监听tab变化
  */
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!tab.url) return;
    if (changeInfo.status === 'loading') {
      injectScript(tabId, tab.url)
    }
  });

  // /**
  //  * 监听导航
  //  */
  // chrome.webNavigation.onCommitted.addListener((details) => {
  //   injectScript(details.tabId, details.url)
  // })
}
