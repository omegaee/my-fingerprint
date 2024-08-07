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
export const msgAddWhiteList = (host: string | string[]) => {
  return chrome.runtime.sendMessage<UpdateWhitelistRequest, void>({
    type: RuntimeMsg.UpdateWhitelist,
    mode: 'add',
    host,
  })
}

/**
 * 删除白名单
 */
export const msgDelWhiteList = (host: string) => {
  return chrome.runtime.sendMessage<UpdateWhitelistRequest, void>({
    type: RuntimeMsg.UpdateWhitelist,
    mode: 'del',
    host,
  })
}

export const msgGetNewVersion = () => {
  return chrome.runtime.sendMessage<GetNewVersionRequest, GetNewVersionMsg>({
    type: RuntimeMsg.GetNewVersion,
  })
}