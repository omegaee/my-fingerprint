import { unwrapContentMessage, MContentType } from '@/message/content';
import { sendToBackground } from '@/utils/message';

/**
 * 同页消息处理
 */
window.addEventListener('message', (ev) => {
  const msg = unwrapContentMessage(ev)
  switch (msg?.type) {
    case MContentType.SetHookRecords: {
      sendToBackground({
        type: 'notice.push',
        data: msg.data,
        total: msg.total,
      })
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