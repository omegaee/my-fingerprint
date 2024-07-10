import { RuntimeMsg } from "@/types/enum"

/**
 * 修改配置
 */
export const msgSetConfig = (config: DeepPartial<LocalStorageConfig>) => {
  return chrome.runtime.sendMessage<SetConfigRequest, void>({
    type: RuntimeMsg.SetConfig,
    config,
  })
}

/**
 * 获取扩展图标的notice
 */
export const msgGetNotice = (tabId: number, host: string) => {
  // return chrome.tabs.query({active: true, currentWindow: true}).then(tabs => {
  //   const tabId = tabs[0].id
  //   if(tabId === undefined) {
  //     throw new Error('tabId is undefined')
  //   }
  //   return chrome.runtime.sendMessage<GetNoticeRequest, GetNoticeMsg>({
  //     type: RuntimeMsg.GetNotice,
  //     tabId
  //   })
  // })
  return chrome.runtime.sendMessage<GetNoticeRequest, GetNoticeMsg>({
    type: RuntimeMsg.GetNotice, tabId, host,
  })
}

/**
 * 设置hook记录
 */
export const msgSetHookRecords = (hookRecords: Partial<Record<HookFingerprintKey, number>>) => {
  return chrome.runtime.sendMessage<SetHookRecordsRequest, void>({
    type: RuntimeMsg.SetHookRecords,
    data: hookRecords,
  })
}

/**
 * 添加白名单
 */
export const msgAddWhiteList = (host: string) => {
  return chrome.runtime.sendMessage<AddWhitelistRequest, void>({
    type: RuntimeMsg.AddWhitelist,
    host,
  })
}

/**
 * 删除白名单
 */
export const msgDelWhiteList = (host: string) => {
  return chrome.runtime.sendMessage<DelWhitelistRequest, void>({
    type: RuntimeMsg.DelWhitelist,
    host,
  })
}
