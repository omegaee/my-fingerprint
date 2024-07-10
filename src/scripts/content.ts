// @ts-ignore
import injectSrc from './inject?script&module'
import { unwrapMessage } from '@/message/content';
import { msgSetHookRecords } from '@/message/runtime';
import { ContentMsg } from '@/types/enum'

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
 * 同页面消息处理
 */
window.addEventListener('message', (ev) => {
  if(ev.origin != location.origin) return
  const data = unwrapMessage(ev.data) as ContentRequest | undefined
  switch(data?.type){
    case ContentMsg.SetHookRecords: {
      msgSetHookRecords(data.data)
      break
    }
  }
})

/**
 * 消息处理
 */
chrome.runtime.onMessage.addListener((msg: MsgRequest, sender, sendResponse) => {
  switch(msg.type){

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
