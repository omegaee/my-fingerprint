import { getInjectedStorage, updateContext } from "./storage";
import { coreInject } from "@/core/output";
import { logManager } from '@/utils/log';

const logger = logManager.createLogger(__LOG_PREFIX_FILE_PATH__);

// // @ts-ignore
// import contentSrc from '@/scripts/content?script&module'

const REG_ID = 'core'
let mScriptCode: string | undefined = undefined

export const hasUserScripts = () => {
  try {
    if (chrome.userScripts) {
      chrome.userScripts.getScripts();
      return true;
    }
    return false;
  } catch (_) {
    return false
  }
}

/**
 * 确保 FastInject 配置正确，返回是否启用
 */
export const ensureFastInject = (storage: LocalStorage) => {
  if (!hasUserScripts()) {
    if (storage.config.action.fastInject) {
      // 若配置不同步则更新
      updateContext({ config: { action: { fastInject: false } } })
    }
    return false;
  }
  return storage.config.action.fastInject;
}

/**
 * 注入脚本（兼容模式）
 */
export const injectScript = async (tabId: number, storage: LocalStorage) => {
  if (!storage.config.enable || ensureFastInject(storage)) return;
  logger.debug('injectScript in compatibility mode:', tabId, storage);
  /* 注入脚本 */
  await chrome.scripting.executeScript({
    target: {
      tabId,
      allFrames: true,
    },
    world: 'MAIN',
    injectImmediately: true,
    args: [{ storage }],
    func: coreInject,
  }).catch(() => { })
}

/**
 * 获取脚本文本
 */
const getRegScriptCode = (storage: LocalStorage) => {
  if (!mScriptCode) mScriptCode = coreInject.toString();
  return `(function(fun){fun({fun,storage:${JSON.stringify(storage)}});})(${mScriptCode});`
}

/**
 * 注册脚本（快速注入模式）
 */
export const reRegisterScript = async () => {
  const storage = await getInjectedStorage()
  if (!ensureFastInject(storage)) return;

  logger.debug('update injectScript in fast mode:', storage);
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
    chrome.userScripts.unregister({ ids: [REG_ID] }).catch(() => { });
  }
}
