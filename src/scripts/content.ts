import { unwrapMessage, ContentMessageType, type ContentMessage } from '@/message/content';
import { msgSetHookRecords } from '@/message/runtime';

/**
 * 同页消息处理
 */
window.addEventListener('message', (ev) => {
  if (ev.origin != location.origin) return;
  const msg = unwrapMessage(ev.data) as ContentMessage | undefined
  switch (msg?.type) {
    case ContentMessageType.SetHookRecords: {
      msgSetHookRecords(msg.data)
      break
    }
    case ContentMessageType.SetBadge: {
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