import { unwrapMessage } from '@/message/content';
import { msgSetHookRecords } from '@/message/runtime';
import { RuntimeMsg, ContentMsg } from '@/types/enum'

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
