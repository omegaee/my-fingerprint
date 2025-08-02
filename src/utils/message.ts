/**
 * 发送消息到background
 * @example await sendToBackground({ type: 'example' })
 */
export const sendToBackground: BackgroundMessage.Sender = (message) => {
  return chrome.runtime.sendMessage(message);
}

/**
 * 发送消息给指定window
 * @example sendToWindow(window.top, { type: 'example' }, '*')
 */
export const sendToWindow: WindowMessage.Sender = (win, message, origin) => {
  win.postMessage(
    { __myfp__: message } as WindowMessage.UseIdentify<typeof message>,
    origin ?? location.origin as any,
  )
}

/**
 * 发送消息给指定tab
 * @example sendToTab(tabId, { type: 'example' })
 */
export const sendToTab: TabMessage.Sender = (tabId, message) => {
  return chrome.tabs.sendMessage(tabId, message);
}