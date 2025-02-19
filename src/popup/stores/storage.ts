import { sendRuntimeAddWhiteList, sendRuntimeDelWhiteList, sendRuntimeSetConfig } from "@/message/runtime"
import { deepProxy } from "@/utils/base"
import { debounce, debouncedAsync } from "@/utils/timer"
import deepmerge from "deepmerge"
import { create } from "zustand"

type State = {
  storage?: LocalStorage
  config?: LocalStorageConfig
  whitelist?: string[]
}

type Actions = {
  loadStorage: () => Promise<void>
  saveStorage: () => void
  importStorage: (ss: LocalStorage) => Promise<void>
  addWhitelist: (list: string | string[]) => void
  deleteWhitelist: (list: string | string[]) => void
}

export const useStorageStore = create<State & Actions>(((set, get) => {

  const saveStorage = debounce(() => {
    const config = get().config
    if (config) {
      sendRuntimeSetConfig(config)
    }
  }, 300)

  const proxyConfig = (config: LocalStorageConfig) => {
    return deepProxy(config, {
      set(target, key, value) {
        // @ts-ignore
        target[key] = value
        saveStorage()
        return true
      }
    });
  }

  const loadStorage = debouncedAsync(async () => {
    const storage = await chrome.storage.local.get() as LocalStorage
    if (storage?.config) {
      storage.config = proxyConfig(storage.config)
    }
    set({
      storage,
      config: storage.config,
      whitelist: storage.whitelist,
    })
  })

  const importStorage = async (ss: Partial<LocalStorage>) => {
    const storage = get().storage
    if (!storage) throw 'tip.err.config-unloaded';

    let isImported = false;

    /* 导入配置 */
    if (ss.config) {
      const _config = Object.keys(ss.config).filter(key => key in storage.config).reduce((acc, key) => {
        // @ts-ignore
        acc[key] = ss.config[key]
        return acc
      }, {} as LocalStorageConfig)

      if (Object.keys(_config).length) {
        storage.config = deepmerge(
          storage.config,
          _config,
          { arrayMerge: (_, sourceArray, __) => sourceArray, },
        )
        saveStorage()
        set({ config: proxyConfig(storage.config) })
        isImported = true
      }
    }

    /* 导入白名单 */
    if (ss.whitelist?.length) {
      addWhitelist(ss.whitelist)
      isImported = true
    }

    /* 导入为空 */
    if (!isImported) {
      throw 'tip.err.import-empty'
    }
  }

  const addWhitelist = (list: string | string[]) => {
    const storage = get().storage
    if (!storage) return;
    storage.whitelist = [...new Set([...storage.whitelist, ...Array.isArray(list) ? list : [list]])]
    set({ whitelist: storage.whitelist })
    sendRuntimeAddWhiteList(list)
  }

  const deleteWhitelist = (list: string | string[]) => {
    const storage = get().storage
    if (!storage) return;
    storage.whitelist = storage.whitelist.filter(item => !Array.isArray(list) ? item !== list : !list.includes(item))
    set({ whitelist: storage.whitelist })
    sendRuntimeDelWhiteList(list)
  }

  return {
    storage: undefined,
    config: undefined,
    whiteList: undefined,
    loadStorage,
    saveStorage,
    importStorage,
    addWhitelist,
    deleteWhitelist,
  }
}))