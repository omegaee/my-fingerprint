/* ----- */
/* 避免import导入，否则build时content会模块化拆分 */
/* ----- */

export {}

const sendToBackground: BackgroundMessage.Sender = (message) => {
  return chrome.runtime.sendMessage(message);
}

const debounce = function <T extends (...args: any) => any>(func: T, wait?: number): (...args: Parameters<T>) => void {
  wait = wait || 300;
  let timeout: NodeJS.Timeout;
  return function (...args: any[]) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/* ----- */
/* 脚本内容 */
/* ----- */

const fpNoticePool: Record<string, number> = {}
const iframeNoticePool: Record<string, number> = {}

/**
 * 更新badge
 */
const snedBadgeInfo = debounce(() => {
  const keys = Object.keys(fpNoticePool)
  const isHigh = keys.some(v => v.startsWith('strong.'))
  sendToBackground({
    type: 'badge.set',
    text: String(keys.length),
    level: isHigh ? 2 : 1,
  })
})

/**
 * 同页消息处理
 */
window.addEventListener('message', ((ev) => {
  const msg = ev?.data?.__myfp__;
  switch (msg?.type) {
    case 'notice.push.fp': {
      const { data } = msg
      if (!data) return;
      for (const src of Object.keys(data)) {
        fpNoticePool[src] = (fpNoticePool[src] ?? 0) + data[src]
      }
      snedBadgeInfo()
      break
    }
    case 'notice.push.iframe': {
      const { data } = msg
      if (!data) return;
      for (const src of Object.keys(data)) {
        iframeNoticePool[src] = (iframeNoticePool[src] ?? 0) + data[src]
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
      sendResponse<'notice.get.iframe'>(iframeNoticePool)
      return false;
    }
    case 'notice.get.fp': {
      sendResponse<'notice.get.fp'>(fpNoticePool)
      return false;
    }
  }
}) as TabMessage.Listener)