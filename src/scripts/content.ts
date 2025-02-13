import { unwrapMessage, MContentType, MContentRequest } from '@/message/content';
import { sendRuntimeSetHookRecords } from '@/message/runtime';

/**
 * 同页消息处理
 */
window.addEventListener('message', (ev) => {
  if (ev.origin !== location.origin) return;
  const msg = unwrapMessage(ev.data) as MContentRequest[MContentType] | undefined
  switch (msg?.type) {
    case MContentType.SetHookRecords: {
      sendRuntimeSetHookRecords(msg.data)
      break
    }
    case MContentType.SetBadge: {
      break
    }
  }
})

// /**
//  * runtime消息处理
//  */
// chrome.runtime.onMessage.addListener((msg: MsgRequest, sender, sendResponse) => {
//   switch(msg.type){
//     case RuntimeMsg.SetConfig: {
//       postSetConfig(msg.config)
//       break
//     }
//     case RuntimeMsg.ChangeScriptWhitelist: {
//       postChangeWhitelist(msg.mode)
//     }
//   }
// })