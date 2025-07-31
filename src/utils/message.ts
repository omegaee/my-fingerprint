/**
 * 发送消息到background
 * @example await sendToBackground({ type: 'example' })
 */
export const sendToBackground: BackgroundMessage.Sender = (message) => {
  return chrome.runtime.sendMessage(message);
}