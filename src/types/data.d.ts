type SizeInfo = {
  width: number
  height: number
}

type TimeZoneInfo = {
  text?: string
  offset: number
  zone: string
  locale: string
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