/**
 * 发送消息到background
 * @example await sendToBackground({ type: 'example' })
 */
export const sendToBackground: BgMessage.Sender = (message) => {
  return chrome.runtime.sendMessage(message);
}