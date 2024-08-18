import { RuntimeMsg } from "@/types/enum"

/**
 * 更新脚本状态
 */
export const tabChangeWhitelist = (tabId: number, mode: ChangeScriptWhitelistRequest['mode']) => {
  return chrome.tabs.sendMessage<ChangeScriptWhitelistRequest, void>(tabId, {
    type: RuntimeMsg.ChangeScriptWhitelist,
    mode,
  })
}