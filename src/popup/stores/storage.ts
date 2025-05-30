import { sendRuntimeSetConfig, sendRuntimeUpdateWhiteList } from "@/message/runtime"
import { deepProxy, selectChildDomains, tryUrl } from "@/utils/base"
import { debounce, debouncedAsync } from "@/utils/timer"
import { create } from "zustand"

type State = {
  storage?: LocalStorage
  config?: LocalStorageConfig  // Proxy
  whitelist?: string[]
}

type Actions = {
  loadStorage: () => Promise<void>
  importStorage: (ss: LocalStorage) => Promise<void>
  saveConfig: () => void
  addWhitelist: (list: string | string[]) => void
  deleteWhitelist: (list: string | string[]) => void
}

export const useStorageStore = create<State & Actions>(((set, get) => {

  const saveConfig = debounce(() => {
    const config = get().storage?.config
    if (config) {
      sendRuntimeSetConfig(config)
    }
  }, 300)

  const proxyConfig = (config: LocalStorageConfig) => {
    return deepProxy(config, {
      set(target, key, value) {
        // @ts-ignore
        target[key] = value
        saveConfig()
        return true
      }
    });
  }

  const loadStorage = debouncedAsync(async () => {
    const storage = await chrome.storage.local.get() as LocalStorage
    set({
      storage,
      config: proxyConfig(storage.config),
      whitelist: storage.whitelist,
    })
  })

  const importStorage = async (ss: Partial<LocalStorage>) => {
    const storage = get().storage
    if (!storage) throw 'tip.err.config-unloaded';

    let isImported = false;

    /* 导入配置 */
    if (ss.config) {
      const _config = await sendRuntimeSetConfig(ss.config, true) as LocalStorageConfig | undefined
      if (_config){
        storage.config = _config
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
    if (!Array.isArray(list)) list = [list];
    const whitelist = [...storage.whitelist]
    const del: string[] = []
    for (const item of list) {
      const url = tryUrl('http://' + item)
      if (!url) continue;
      for (const domain of selectChildDomains(whitelist, url.hostname)) {
        const index = whitelist.indexOf(domain)
        if (index !== -1) {
          whitelist.splice(index, 1)
          del.push(domain)
        }
      }
      whitelist.push(url.hostname)
    }
    storage.whitelist = whitelist
    set({ whitelist: storage.whitelist })
    sendRuntimeUpdateWhiteList({
      add: list,
      del,
    })
  }

  const deleteWhitelist = (list: string | string[]) => {
    const storage = get().storage
    if (!storage) return;
    if (!Array.isArray(list)) list = [list];
    const whitelist = [...storage.whitelist]
    for (const item of list) {
      const url = tryUrl('http://' + item)
      if (!url) continue;
      const index = whitelist.indexOf(url.hostname)
      index !== -1 && whitelist.splice(index, 1)
    }
    storage.whitelist = whitelist
    set({ whitelist: storage.whitelist })
    sendRuntimeUpdateWhiteList({
      del: list,
    })
  }

  return {
    storage: undefined,
    config: undefined,
    whiteList: undefined,
    loadStorage,
    importStorage,
    saveConfig,
    addWhitelist,
    deleteWhitelist,
  }
}))