import { sendToBackground } from '@/utils/message';

/**
 * 同页消息处理
 */
window.addEventListener('message', ((ev) => {
  const msg = ev?.data?.__myfp__;
  switch (msg?.type) {
    case 'notice.push': {
      sendToBackground({
        type: 'notice.push',
        data: msg.data,
        total: msg.total,
      })
      break
    }
  }
}) as WindowMessage.Listener)

// /**
//  * runtime消息处理
//  */
// chrome.runtime.onMessage.addListener((msg: MsgRequest, sender, sendResponse) => {
//   switch(msg.type){
//   }
// })