import { getLocalStorage } from "./storage";
import { coreInject } from "@/core/output";

// // @ts-ignore
// import contentSrc from '@/scripts/content?script&module'

const REG_ID = 'core'
let mScriptCode: string | undefined = undefined

export const hasUserScripts = () => {
  try {
    return !!chrome.userScripts
  } catch (_) {
    return false
  }
}

/**
 * 是否使用快速注入模式
 */
export const isFastInject = (storage: LocalStorage) => {
  return storage.config.action.fastInject && hasUserScripts();
}

/**
 * 注入脚本（兼容模式）
 */
export const injectScript = async (tabId: number, storage: LocalStorage) => {
  if (!storage.config.enable || isFastInject(storage)) return;
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
 * 注册脚本（快速注入模式）
 */
export const reRegisterScript = async () => {
  const [storage] = await getLocalStorage()
  if (!isFastInject(storage)) return;

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
