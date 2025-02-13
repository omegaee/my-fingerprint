import { sendRuntimeSetConfig } from "@/message/runtime"
import { deepProxy } from "@/utils/base"
import { debounce, debouncedAsync } from "@/utils/timer"
import { create } from "zustand"

type State = {
  version: number
  config?: LocalStorageConfig
}

type Actions = {
  loadStorage: () => Promise<void>
  saveStorage: () => void
  updateState: () => void
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

  const updateState = () => {
    set((state) => ({ version: state.version + 1 }))
  }

  return {
    version: 0,
    storage: undefined,

    loadStorage,
    saveStorage,
    updateState,
  }
}))