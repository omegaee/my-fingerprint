export enum HookType {
  default = 0,  // 系统值
  value = 1,  // 自定义值
  page = 2,  // 每个标签页随机
  browser = 3,  // 每次启动浏览器随机
  domain = 4,  // 根据域名随机
  seed = 5,  // 根据指定种子随机
}

export enum RuntimeMsg {
  SetConfig = 'set-config',
  GetNotice = 'get-notice',
  SetHookRecords = 'set-hook-records',
  UpdateWhitelist = 'update-whitelist',
  UpdateScriptState = 'update-script-state',
  GetNewVersion = 'get-new-version',
}

export enum ContentMsg {
  SetConfig = 'set-config',
  SetHookRecords = 'set-hook-records',
  UpdateState = 'update-state',
}