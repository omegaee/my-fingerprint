type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]>
};

type Pair<K, V> = [K, V]

declare enum HookType {
  default = 0,  // 系统值
  value = 1,  // 自定义值
  page = 2,  // 每个标签页随机
  browser = 3,  // 每次启动浏览器随机
  domain = 4,  // 根据域名随机
  global = 5,  // 根据全局种子随机
  enabled = 6,  // 启用
  disabled = 7,  // 禁用
}

type DefaultHookMode = {
  type: HookType.default
}

type RandomHookMode = {
  type: HookType.page | HookType.browser | HookType.domain | HookType.global
}

type ValueHookMode<T=any> = {
  type: HookType.value
  value: T
}

type DisableHookMode = {
  type: HookType.disabled
}

type HookMode<T=any> = DefaultHookMode | RandomHookMode | ValueHookMode<T> | DisableHookMode