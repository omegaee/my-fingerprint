declare enum RuntimeMsg {
  SetConfig = 'set-config',
  GetNotice = 'get-notice',
  SetHookRecords = 'set-hook-records',
  AddWhitelist = 'add-whitelist',
  DelWhitelist = 'del-whitelist',
}

declare enum ContentMsg {
  SetConfig = 'set-config',
  GetNotice = 'get-notice',
  SetHookRecords = 'set-hook-records',
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
  data: Partial<Record<HookFingerprintKey, number>>,
}

type AddWhitelistRequest = {
  type: RuntimeMsg.AddWhitelist,
  host: string | string[],
}

type DelWhitelistRequest = {
  type: RuntimeMsg.DelWhitelist,
  host: string | string[],
}

type MsgRequest = SetConfigRequest | GetNoticeRequest | SetHookRecordsRequest | AddWhitelistRequest | DelWhitelistRequest

type RespFunc<T=any> = (msg: T) => void

type GetNoticeMsg = ToolbarNotice

// **********
// ContentMsg
// **********
type PostSetHookRecords = {
  type: ContentMsg.SetHookRecords,
  data: Partial<Record<HookFingerprintKey, number>>,
}

type ContentRequest = PostSetHookRecords
