/**
 * 发送消息到background
 * @example await sendToBackground({ type: 'example' })
 */
export const sendToBackground = <T extends BgMessage.Type>(message: BgMessage.ParamByType<T>) => {
  return chrome.runtime.sendMessage<BgMessage.ParamByType<T>, BgMessage.ResultByType<T>>(message);
}