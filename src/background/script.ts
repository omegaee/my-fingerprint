import { getLocalStorage } from "./storage";
import { coreInject } from "@/core/output";

// // @ts-ignore
// import contentSrc from '@/scripts/content?script&module'

export const isRegScript = chrome.userScripts ? true : false

const REG_ID = 'core'
let mScriptCode: string | undefined = undefined

export const injectScript = async (tabId: number, storage: LocalStorage) => {
  if (isRegScript || !storage.config.enable) return;
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
  }).catch(() => { })
}

/**
 * 获取脚本文本
 */
const getRegScriptCode = (storage: LocalStorage) => {
  if (!mScriptCode) mScriptCode = coreInject.toString();
  return `(function(fun){fun(${JSON.stringify(storage)});})(${mScriptCode});`
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
