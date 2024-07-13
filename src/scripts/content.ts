// @ts-ignore
import injectSrc from './inject?script&module'
import { postSetConfig, postUpdateState, unwrapMessage } from '@/message/content';
import { msgSetHookRecords } from '@/message/runtime';
import { RuntimeMsg, ContentMsg } from '@/types/enum'

/**
 * 注入脚本
 */
const injectScript = function<T> (path: string, dataset: T) {
  let script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = chrome.runtime.getURL(path);
  script.dataset.data = JSON.stringify(dataset)
  script.type = 'module'
  document.documentElement.appendChild(script);
  // script.remove();
}

/**
 * 同页消息处理
 */
window.addEventListener('message', (ev) => {
  if(ev.origin != location.origin) return
  const msg = unwrapMessage(ev.data) as ContentRequest | undefined
  switch(msg?.type){
    case ContentMsg.SetHookRecords: {
      msgSetHookRecords(msg.data)
      break
    }
  }
})

/**
 * runtime消息处理
 */
chrome.runtime.onMessage.addListener((msg: MsgRequest, sender, sendResponse) => {
  switch(msg.type){
    case RuntimeMsg.SetConfig: {
      postSetConfig(msg.config)
      break
    }
    case RuntimeMsg.UpdateScriptState: {
      postUpdateState(msg.mode)
    }
  }
})

/**
 * 初始化
 */
const init = function() {
  chrome.storage.local.get(['config', 'whitelist']).then((data: Partial<Omit<LocalStorage, 'version'>>) => {
    injectScript(injectSrc, data)
  })
}
init()
