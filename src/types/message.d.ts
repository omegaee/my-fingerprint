declare enum RuntimeMsg {
  SetConfig = 'set-config',
  GetNotice = 'get-notice',
  SetHookRecords = 'set-hook-records',
  UpdateWhitelist = 'update-whitelist',
  ChangeScriptWhitelist = 'change-script-whitelist',
  GetNewVersion = 'get-new-version',
}

declare enum ContentMsg {
  SetConfig = 'set-config',
  SetHookRecords = 'set-hook-records',
  ChangeWhitelist = 'change-whitelist',
}

// **********
// RuntimeMsg
// **********
type SetConfigRequest = {
  type: RuntimeMsg.SetConfig,
  config: DeepPartial<LocalStorageConfig>,
}

type GetNoticeRequest = {
  type: RuntimeMsg.GetNotice,
  tabId: number,
  host: string,
}

type SetHookRecordsRequest = {
  type: RuntimeMsg.SetHookRecords,
  data: Partial<Record<string, number>>,
}

type UpdateWhitelistRequest = {
  type: RuntimeMsg.UpdateWhitelist,
  mode: 'add' | 'del'
  host: string | string[],
}

type ChangeScriptWhitelistRequest = {
  type: RuntimeMsg.ChangeScriptWhitelist,
  mode: 'into' | 'leave'
}

type GetNewVersionRequest = {
  type: RuntimeMsg.GetNewVersion,
}

type MsgRequest = SetConfigRequest | GetNoticeRequest | SetHookRecordsRequest | UpdateWhitelistRequest | ChangeScriptWhitelistRequest | GetNewVersionRequest

type RespFunc<T=any> = (msg: T) => void

type GetNoticeMsg = ToolbarNotice

type GetNewVersionMsg = string | undefined

// **********
// ContentMsg
// **********
type PostSetHookRecords = {
  type: ContentMsg.SetHookRecords,
  data: Partial<Record<string, number>>,
}

type PostSetConfig = {
  type: ContentMsg.SetConfig,
  config: DeepPartial<LocalStorageConfig>,
}

type PostChangeWhitelist = {
  type: ContentMsg.ChangeWhitelist,
  mode: 'into' | 'leave'
}

type ContentRequest = PostSetHookRecords | PostSetConfig | PostChangeWhitelist
