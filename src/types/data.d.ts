type SizeInfo = {
  width: number
  height: number
}

type TimeZoneInfo = {
  zone: string
}

type EquipmentInfo = {
  platform: string
  appVersion: string
  userAgent: string
}

type FullVersion = {
  major: string
  full: string
}

type Brand = {
  brand: string
  version: string
}

type NavigatorUADataAttr = {
  brands: Brand[]
  platform: string
  mobile: boolean
}

type NavigatorUAData = NavigatorUADataAttr & {
  getHighEntropyValues?: (opt?: string[]) => Promise<HighEntropyValuesAttr>
}

type HighEntropyValuesAttr = NavigatorUADataAttr & {
  fullVersionList?: Brand[]
  uaFullVersion?: string
}

type SeededFn<T = any> = (seed: number) => T

type GpuInfo = {
  vendor?: string
  renderer?: string
}

type ScreenSize = {
  width?: number
  height?: number
}

type ScreenDepth = {
  color?: number
  pixel?: number
}

type ClientHintsInfo = {
  ua: {
    userAgent: string
    appVersion: string
    platform: string
  }
  uaData: {
    arch: string
    bitness: string
    mobile: boolean
    model: string
    platform: string
    platformVersion: string
    formFactors: string[]
    uaFullVersion: string
    versions: {
      brand: string
      version: string
    }[]
  }
}

type I18nString = string | Record<string, string>

/** 使用文件路径作为日志前缀时，需要在编译期间进行处理。
 * 
 * 这是一个占位符，后期需要配合插件，将其替换成真实的文件路径
 */
declare const __LOG_PREFIX_FILE_PATH__: string;