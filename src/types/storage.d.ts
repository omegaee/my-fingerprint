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
  // 其他
  language: string
  hookNetRequest: boolean
}

type HookFingerprint = {
  navigator: {
    appVersion: HookMode<string>
    platform: HookMode<string>
    userAgent: HookMode<string>
    language: HookMode<string>
    hardwareConcurrency: HookMode<number>
  }
  screen: {
    height: HookMode<number>
    width: HookMode<number>
    colorDepth: HookMode<number>
    pixelDepth: HookMode<number>
  }
  other: {
    canvas: BaseHookMode
    audio: BaseHookMode
    webgl: BaseHookMode
    webrtc: BaseHookMode
    timezone: DefaultHookMode | ValueHookMode<TimeZoneInfo>
  }
}

type HookFingerprintKey = keyof HookFingerprint['navigator'] | keyof HookFingerprint['screen'] | keyof HookFingerprint['other']