declare enum RuntimeMsg {
  SetConfig = 'set-config',
  GetNotice = 'get-notice',
  SetHookRecords = 'set-hook-records',
  UpdateWhitelist = 'update-whitelist',
  UpdateScriptState = 'update-script-state',
  GetNewVersion = 'get-new-version',
}

declare enum ContentMsg {
  SetConfig = 'set-config',
  SetHookRecords = 'set-hook-records',
  UpdateState = 'update-state',
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

type UpdateScriptStateRequest = {
  type: RuntimeMsg.UpdateScriptState,
  mode: 'enable' | 'disable'
}

type GetNewVersionRequest = {
  type: RuntimeMsg.GetNewVersion,
}

type MsgRequest = SetConfigRequest | GetNoticeRequest | SetHookRecordsRequest | UpdateWhitelistRequest | UpdateScriptStateRequest | GetNewVersionRequest

type RespFunc<T=any> = (msg: T) => void

type GetNoticeMsg = ToolbarNotice

type GetNewVersionMsg = boolean

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

type PostUpdateState = {
  type: ContentMsg.UpdateState,
  mode: 'enable' | 'disable'
}

type ContentRequest = PostSetHookRecords | PostSetConfig | PostUpdateState
