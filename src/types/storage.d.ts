type LocalStorage = {
  version: string
  config: LocalStorageConfig  // 配置
  whitelist: string[]  // 白名单
}

type LocalStorageObject = Omit<LocalStorage, 'whitelist'> & {
  whitelist: Set<string>
}

type LocalStorageConfig = {
  enable: boolean
  // 种子
  customSeed: number
  browserSeed: number
  // 指纹
  fingerprint: HookFingerprint
  // 功能
  language: string
  hookNetRequest: boolean
  hookBlankIframe: boolean
  // 其他
  customSeedInput: string
}

type HookFingerprint = {
  navigator: {
    equipment: DefaultHookMode | RandomHookMode
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
  other: {
    timezone: DefaultHookMode | ValueHookMode<TimeZoneInfo>
    canvas: DefaultHookMode | RandomHookMode
    audio: DefaultHookMode | RandomHookMode
    webgl: DefaultHookMode | RandomHookMode
    webrtc: DefaultHookMode | DisableHookMode
    font: DefaultHookMode | RandomHookMode
    webgpu: DefaultHookMode | RandomHookMode
  }
}

type HookFingerprintKey = keyof HookFingerprint['navigator'] | keyof HookFingerprint['screen'] | keyof HookFingerprint['other']

type WindowStorage = {
  url: string
  host: string
  seed: number
  hooked: boolean
}