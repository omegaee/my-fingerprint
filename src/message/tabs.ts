/**
 * 更新脚本状态
 */
export const tabUpdateScriptState = (tabId: number, mode: UpdateScriptStateRequest['mode']) => {
  return chrome.tabs.sendMessage<UpdateScriptStateRequest, void>(tabId, {
    type: RuntimeMsg.UpdateScriptState,
    mode,
  })
}