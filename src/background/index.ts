import { getLocalStorage, importContext, initLocalStorage, updateContext } from "./storage";
import { removeBadge, setBadgeContent, setBadgeWhitelist } from "./badge";
import { hasUserScripts, injectScript, reRegisterScript } from './script';
import { existParentDomain, tryUrl } from "@/utils/base";
import { reRequestHeader } from "./request";
import { logManager } from '@/utils/log';
import { removeBrowsingData } from "./browsing-data";

const logger = logManager.createLogger(__LOG_PREFIX_FILE_PATH__);

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
    logger.info('getNewVersion fetched version:', newVersion)
    return newVersion
  }
}

/**
 * 初次启动扩展时触发（浏览器更新、扩展更新触发）
 */
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install" || reason === "update") {
    initLocalStorage()
  }
});

/**
 * 重启浏览器触发
 */
chrome.runtime.onStartup.addListener(() => {
  initLocalStorage()
});

/**
 * 消息处理
 */
chrome.runtime.onMessage.addListener(((msg, sender, sendResponse) => {
  logger.debug('chrome.runtime.onMessage received:', msg)
  switch (msg?.type) {
    case 'storage.import': {
      if (!msg.storage) {
        logger.warn('storage.import failed: message storage is empty')
        sendResponse<'storage.import'>({
          ok: false,
          message: 'message storage is empty'
        })
        return false
      }

      importContext(msg.storage).then((storage) => {
        logger.debug('storage.import successful')
        sendResponse<'storage.import'>({
          ok: true,
          storage,
        })
      })
      return true
    }
    case 'config.set': {
      updateContext({ config: msg.config })
      return false
    }
    case 'policies.set': {
      updateContext({ policies: msg.policies })
      return false
    }
    case 'version.latest': {
      getNewVersion().then((version) => {
        sendResponse<'version.latest'>(version)
      })
      return true
    }
    case 'site.cleanup': {
      removeBrowsingData(msg.scope, msg.urls).then(() => {
        logger.info(`site.cleanup ${msg.scope} successful: ${msg.urls}`)
        sendResponse<'site.cleanup'>({ ok: true, scope: msg.scope })
      }).catch((e) => {
        logger.error('site.cleanup failed: ', e)
        sendResponse<'site.cleanup'>({ ok: false, scope: msg.scope, message: e?.message })
      })
      return true
    }
    case 'api.check': {
      if (msg.api === 'userScripts') {
        const available = hasUserScripts()
        if (available) {
          logger.debug('api.check: userScripts API available')
        }
        sendResponse<'api.check'>(available)
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
    const { storage } = await getLocalStorage()

    logger.debug('chrome.tabs.onUpdated:', tab.title || tab.url || tab.id);
    logger.debug('injectScript with storage:', storage)

    // 兼容模式注入，内部判断是否需要注入
    injectScript(tabId, storage)

    const _url = tab.url ? tryUrl(tab.url) : undefined
    if (!_url?.hostname) return;

    if (storage.policies.isBlacklistMode) {
      if (existParentDomain(storage.policies.blacklist, _url.hostname)) {
        logger.debug('in blacklist mode', _url.hostname);
        reRequestHeader(undefined, tabId)
      }
    } else {
      if (existParentDomain(storage.policies.whitelist, _url.hostname)) {
        logger.debug('in whitelist mode', _url.hostname);
        reRequestHeader(tabId)
        setBadgeWhitelist(tabId)
      }
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
  logger.info('chrome.permissions.onAdded triggered:', perms)
  if (perms.permissions?.includes('userScripts')) {
    reRegisterScript()
  }
})
