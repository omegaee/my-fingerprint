type LocalStorage = {
  version: string
  config: LocalStorageConfig  // 配置
  whitelist: string[]  // 白名单
}

type LocalStorageConfig = {
  enable: boolean
  // 种子
  seed: {
    browser: number
    global: number
  }
  // 指纹
  fp: HookFingerprint
  // 操作
  action: {
    hookNetRequest: boolean
  }
  // 输入
  input: {
    globalSeed: string
  }
  // 订阅
  subscribe: {
    url: string
  }
  // 其他
  prefs: {
    language: string
    theme: 'system' | 'light' | 'dark'
  }
}

type HookFingerprint = {
  navigator: {
    uaVersion: DefaultHookMode | RandomHookMode
    language: DefaultHookMode | RandomHookMode | ValueHookMode<string>
    languages: DefaultHookMode | RandomHookMode | ValueHookMode<string[]>
    hardwareConcurrency: DefaultHookMode | RandomHookMode | ValueHookMode<number>
  }
  screen: {
    height: DefaultHookMode | RandomHookMode | ValueHookMode<number>
    width: DefaultHookMode | RandomHookMode | ValueHookMode<number>
    colorDepth: DefaultHookMode | RandomHookMode | ValueHookMode<number>
    pixelDepth: DefaultHookMode | RandomHookMode | ValueHookMode<number>
  }
  normal: {
    glVendor: DefaultHookMode | ValueHookMode<string>
    glRenderer: DefaultHookMode | ValueHookMode<string>
  }
  other: {
    timezone: DefaultHookMode | ValueHookMode<TimeZoneInfo>
    canvas: DefaultHookMode | RandomHookMode
    audio: DefaultHookMode | RandomHookMode
    webgl: DefaultHookMode | RandomHookMode
    webrtc: DefaultHookMode | DisableHookMode
    font: DefaultHookMode | RandomHookMode
    webgpu: DefaultHookMode | RandomHookMode
    domRect: DefaultHookMode | RandomHookMode
  }
}

type HookFingerprintKey = keyof HookFingerprint['navigator'] | keyof HookFingerprint['screen'] | keyof HookFingerprint['other']

type WindowStorage = {
  url: string
  host: string
  seed: number
  hooked: boolean
  browser?: BrowserType
}