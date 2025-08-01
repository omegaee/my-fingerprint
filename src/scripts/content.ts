import { sendToBackground } from '@/utils/message';

const iframeOriginNoticePool: Record<string, number> = {}

/**
 * 同页消息处理
 */
window.addEventListener('message', ((ev) => {
  const msg = ev?.data?.__myfp__;
  switch (msg?.type) {
    case 'notice.push.fp': {
      sendToBackground({
        type: 'notice.push.fp',
        data: msg.data,
        total: msg.total,
      })
      break
    }
    case 'notice.push.iframe': {
      const { data } = msg
      if (!data) return;
      for (const src of Object.keys(data)) {
        const old = iframeOriginNoticePool[src]
        if (old) {
          iframeOriginNoticePool[src] += data[src]
        } else {
          iframeOriginNoticePool[src] = data[src]
        }
      }
      break
    }
  }
}) as WindowMessage.Listener)

/**
 * runtime消息处理
 */
chrome.runtime.onMessage.addListener(((msg, sender, sendResponse) => {
  switch (msg?.type) {
    case 'notice.get.iframe': {
      sendResponse<'notice.get.iframe'>(iframeOriginNoticePool)
      return false;
    }
  }
}) as TabMessage.Listener)