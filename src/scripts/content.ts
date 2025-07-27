import { unwrapContentMessage, MContentType } from '@/message/content';
import { sendRuntimeSetHookRecords } from '@/message/runtime';

/**
 * 同页消息处理
 */
window.addEventListener('message', (ev) => {
  const msg = unwrapContentMessage(ev)
  switch (msg?.type) {
    case MContentType.SetHookRecords: {
      sendRuntimeSetHookRecords(msg.data, msg.total)
      break
    }
  }
})

// /**
//  * runtime消息处理
//  */
// chrome.runtime.onMessage.addListener((msg: MsgRequest, sender, sendResponse) => {
//   switch(msg.type){
//   }
// })