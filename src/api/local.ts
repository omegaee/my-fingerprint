import { appFetchJson } from "@/utils/net"

export type TimeZoneInfoOption = TimeZoneInfo & {
  key: string
  title: I18nString
}

export type ClientHintsOption = ClientHintsInfo & {
  key: string
  title: I18nString
}

export type GpuInfoOption = GpuInfo & {
  key: string
  title: I18nString
}

export const LocalApi = {
  timezone: async () => {
    const url = chrome.runtime.getURL('settings/timezone.json')
    return appFetchJson(url)
      .then(v => v.timezone as TimeZoneInfoOption[])
  },

  clientHints: async () => {
    const url = chrome.runtime.getURL('settings/client-hints.json')
    return appFetchJson(url)
      .then(v => v.chromium as ClientHintsOption[])
  },

  gpuInfo: async () => {
    const url = chrome.runtime.getURL('settings/gpu-info.json')
    return appFetchJson(url)
      .then(v => v.gpuInfo as GpuInfoOption[])
  }
}