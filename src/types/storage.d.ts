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
  hookBlankIframe: boolean
}

type HookFingerprint = {
  navigator: {
    equipment: BaseHookMode
    language: BaseHookMode | ValueHookMode<string>
    languages: BaseHookMode | ValueHookMode<string[]>
    hardwareConcurrency: BaseHookMode | ValueHookMode<number>
  }
  screen: {
    height: BaseHookMode | ValueHookMode<number>
    width: BaseHookMode | ValueHookMode<number>
    colorDepth: BaseHookMode | ValueHookMode<number>
    pixelDepth: BaseHookMode | ValueHookMode<number>
  }
  other: {
    timezone: DefaultHookMode | ValueHookMode<TimeZoneInfo>
    canvas: BaseHookMode
    audio: BaseHookMode
    webgl: BaseHookMode
    webrtc: DefaultHookMode | DisableHookMode
  }
}

type HookFingerprintKey = keyof HookFingerprint['navigator'] | keyof HookFingerprint['screen'] | keyof HookFingerprint['other']