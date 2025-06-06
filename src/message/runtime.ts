export const enum MRuntimeType {
  SetConfig = 'set-config',
  GetNotice = 'get-notice',
  SetHookRecords = 'set-hook-records',
  UpdateWhitelist = 'update-whitelist',
  ChangeScriptWhitelist = 'change-script-whitelist',
  GetNewVersion = 'get-new-version',
  Subscribe = 'subscribe',
}

///
/// Request Type
///
export type MRuntimeRequest = {
  [MRuntimeType.SetConfig]: {
    type: MRuntimeType.SetConfig,
    config: DeepPartial<LocalStorageConfig>,
    result?: boolean
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
    data?: {
      add?: string[],
      del?: string[],
    }
    clean?: boolean
  },
  [MRuntimeType.ChangeScriptWhitelist]: {
    type: MRuntimeType.ChangeScriptWhitelist,
    mode: 'into' | 'leave'
  },
  [MRuntimeType.GetNewVersion]: {
    type: MRuntimeType.GetNewVersion,
  },
  [MRuntimeType.Subscribe]: {
    type: MRuntimeType.Subscribe,
    url?: string
  },
}

///
/// Response Type
///
export type MRuntimeResponse = {
  [MRuntimeType.SetConfig]: LocalStorageConfig | undefined,
  [MRuntimeType.GetNotice]: Partial<Record<string, number>> | undefined,
  [MRuntimeType.GetNewVersion]: string | undefined,
  [MRuntimeType.Subscribe]: LocalStorage | undefined
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
export const sendRuntimeSetConfig = (config: DeepPartial<LocalStorageConfig>, result?: boolean) => {
  return sendMessage<MRuntimeType.SetConfig>({
    type: MRuntimeType.SetConfig,
    config,
    result,
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
 * 更新白名单
 */
export const sendRuntimeUpdateWhiteList = (data: MRuntimeRequest[MRuntimeType.UpdateWhitelist]['data']) => {
  return sendMessage<MRuntimeType.UpdateWhitelist>({
    type: MRuntimeType.UpdateWhitelist,
    data,
  })
}

/**
 * 清理白名单
 */
export const sendRuntimeCleanWhiteList = () => {
  return sendMessage<MRuntimeType.UpdateWhitelist>({
    type: MRuntimeType.UpdateWhitelist,
    clean: true,
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

/**
 * 订阅内容
 */
export const sendRuntimeSubscribe = (url?: string) => {
  return sendMessage<MRuntimeType.Subscribe>({
    type: MRuntimeType.Subscribe,
    url,
  })
}