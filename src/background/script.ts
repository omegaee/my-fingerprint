import { urlToHttpHost } from "@/utils/base";
import { getLocalStorage } from "./storage";
import { setBadgeWhitelist } from "./badge";
import { coreInject } from "@/core/output";

export const isRegScript = chrome.userScripts ? true : false

const REG_ID = 'core'
let mScriptCode: string | undefined = undefined

export const injectScript = async (tabId: number, url: string) => {
  const host = urlToHttpHost(url)
  if (!host) return;

  const [storage, whitelist] = await getLocalStorage()

  /* 注入脚本 */
  await chrome.scripting.executeScript({
    target: {
      tabId,
      allFrames: true,
    },
    world: 'MAIN',
    injectImmediately: true,
    args: [storage],
    func: coreInject,
  })

  if (whitelist.has(host)) {
    setBadgeWhitelist(tabId)
  }
}

/**
 * 获取脚本文本
 */
const getRegScriptCode = (storage: LocalStorage) => {
  if (!mScriptCode) mScriptCode = coreInject.toString();
  return `(function(){${mScriptCode};coreInject(${JSON.stringify(storage)});})()`
}

/**
 * 注册脚本
 */
export const reRegisterScript = async () => {
  if (!isRegScript) return;

  const [storage] = await getLocalStorage()

  if (storage.config.enable) {
    const scripts: chrome.userScripts.RegisteredUserScript[] = [{
      id: REG_ID,
      allFrames: true,
      runAt: 'document_start',
      world: 'MAIN',
      matches: ["*://*/*"],
      js: [{ code: getRegScriptCode(storage) }],
    }]

    try {
      await chrome.userScripts.update(scripts)
    } catch (_) {
      await chrome.userScripts.register(scripts)
    }
  } else {
    chrome.userScripts.unregister({ ids: [REG_ID] })
  }
}
