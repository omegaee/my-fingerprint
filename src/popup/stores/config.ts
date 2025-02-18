import { sendRuntimeSetConfig } from "@/message/runtime"
import { deepProxy } from "@/utils/base"
import { debounce, debouncedAsync } from "@/utils/timer"
import deepmerge from "deepmerge"
import { create } from "zustand"

type State = {
  config?: LocalStorageConfig
}

type Actions = {
  loadStorage: () => Promise<void>
  saveStorage: () => void
  importConfig: (config: LocalStorageConfig) => Promise<void>
}

export const useConfigStore = create<State & Actions>(((set, get) => {

  const loadStorage = debouncedAsync(async () => {
    const { config } = await chrome.storage.local.get(['config']) as Partial<LocalStorage>
    const proxyConfig: State['config'] = config ? deepProxy(config, {
      set(target, key, value) {
        // @ts-ignore
        target[key] = value
        saveStorage()
        return true
      }
    }) : undefined
    set({ config: proxyConfig })
  })

  const saveStorage = debounce(() => {
    const config = get().config
    if (config) {
      sendRuntimeSetConfig(config)
    }
  }, 300)

  const importConfig = async (config: LocalStorageConfig) => {
    const rawConfig = get().config
    if (!rawConfig) throw '未加载配置';

    /* 简单过滤 */
    const _config = Object.keys(config).filter(key => key in rawConfig).reduce((acc, key) => {
      // @ts-ignore
      acc[key] = config[key]
      return acc
    }, {} as LocalStorageConfig)

    /* 合并 */
    const finalConfig = deepmerge(
      rawConfig,
      _config,
      { arrayMerge: (_, sourceArray, __) => sourceArray, },
    )
    set({ config: finalConfig })
  }

  return {
    storage: undefined,
    loadStorage,
    saveStorage,
    importConfig,
  }
}))