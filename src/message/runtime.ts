export const enum MRuntimeType {
  SetConfig = 'set-config',
  GetNotice = 'get-notice',
  SetHookRecords = 'set-hook-records',
  UpdateWhitelist = 'update-whitelist',
  ChangeScriptWhitelist = 'change-script-whitelist',
  GetNewVersion = 'get-new-version',
}

///
/// Request Type
///
export type MRuntimeRequest = {
  [MRuntimeType.SetConfig]: {
    type: MRuntimeType.SetConfig,
    config: DeepPartial<LocalStorageConfig>,
  },
  [MRuntimeType.GetNotice]: {
    type: MRuntimeType.GetNotice,
    tabId: number,
    host: string,
  },
  [MRuntimeType.SetHookRecords]: {
    type: MRuntimeType.SetHookRecords,
    data: Partial<Record<string, number>>,
  },
  [MRuntimeType.UpdateWhitelist]: {
    type: MRuntimeType.UpdateWhitelist,
    mode: 'add' | 'del'
    host: string | string[],
  },
  [MRuntimeType.ChangeScriptWhitelist]: {
    type: MRuntimeType.ChangeScriptWhitelist,
    mode: 'into' | 'leave'
  },
  [MRuntimeType.GetNewVersion]: {
    type: MRuntimeType.GetNewVersion,
  },
}

///
/// Response Type
///
export type MRuntimeResponse = {
  [MRuntimeType.GetNotice]: Partial<Record<string, number>> | undefined,
  [MRuntimeType.GetNewVersion]: string | undefined,
} & {
  [key in MRuntimeType]: void
}

export type MRuntimeResponseCall<T extends keyof MRuntimeResponse = any> = (data: MRuntimeResponse[T]) => void

///
/// API
///
const sendMessage = <T extends MRuntimeType>(message: MRuntimeRequest[T]) => {
  return chrome.runtime.sendMessage<MRuntimeRequest[T], MRuntimeResponse[T]>(message);
}

/**
 * 修改配置
 */
export const sendRuntimeSetConfig = (config: DeepPartial<LocalStorageConfig>) => {
  return sendMessage<MRuntimeType.SetConfig>({
    type: MRuntimeType.SetConfig,
    config,
  })
}

/**
 * 获取扩展图标的notice
 */
export const sendRuntimeGetNotice = (tabId: number, host: string) => {
  return sendMessage<MRuntimeType.GetNotice>({
    type: MRuntimeType.GetNotice, tabId, host,
  })
}

/**
 * 设置hook记录
 */
export const sendRuntimeSetHookRecords = (hookRecords: Partial<Record<HookFingerprintKey, number>>) => {
  return sendMessage<MRuntimeType.SetHookRecords>({
    type: MRuntimeType.SetHookRecords,
    data: hookRecords,
  })
}

/**
 * 添加白名单
 */
export const sendRuntimeAddWhiteList = (host: string | string[]) => {
  return sendMessage<MRuntimeType.UpdateWhitelist>({
    type: MRuntimeType.UpdateWhitelist,
    mode: 'add',
    host,
  })
}

/**
 * 删除白名单
 */
export const sendRuntimeDelWhiteList = (host: string | string[]) => {
  return sendMessage<MRuntimeType.UpdateWhitelist>({
    type: MRuntimeType.UpdateWhitelist,
    mode: 'del',
    host,
  })
}

/**
 * 获取新版本号
 */
export const sendRuntimeGetNewVersion = () => {
  return sendMessage<MRuntimeType.GetNewVersion>({
    type: MRuntimeType.GetNewVersion,
  })
}