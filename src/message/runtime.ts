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
export const msgGetNotice = () => {
  return chrome.runtime.sendMessage<GetNoticeRequest, GetNoticeMsg>({
    type: RuntimeMsg.GetNotice
  })
}

/**
 * 设置hook记录
 */
export const msgSetHookRecords = (hookRecords: Partial<Record<HookFingerprintKey, number>>) => {
  return chrome.runtime.sendMessage<SetHookRecords, void>({
    type: RuntimeMsg.SetHookRecords,
    data: hookRecords,
  })
}

