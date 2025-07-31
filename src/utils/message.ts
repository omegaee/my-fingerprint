/**
 * 发送消息到background
 * @example await sendToBackground({ type: 'example' })
 */
export const sendToBackground = <T extends BgMessage.Type>(message: BgMessage.Param<T>) => {
  return chrome.runtime.sendMessage<BgMessage.Param<T>, BgMessage.Result<T>>(message);
}