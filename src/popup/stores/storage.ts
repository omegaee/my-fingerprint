import { deepProxy, selectChildDomains, tryUrl } from "@/utils/base"
import { sendToBackground } from "@/utils/message"
import { debounce, sharedAsync } from "@/utils/timer"
import { create } from "zustand"

type State = {
  storage?: LocalStorage
  config?: LocalStorageConfig  // Proxy
  whitelist?: string[]
  version: number
}

type Actions = {
  syncLoadStorage: (storage: LocalStorage) => void
  loadStorage: () => Promise<void>
  importStorage: (ss: DeepPartial<LocalStorage>) => Promise<void>
  saveConfig: () => void
  addWhitelist: (list: string | string[]) => void
  deleteWhitelist: (list: string | string[]) => void
  cleanWhitelist: () => void
}

export const useStorageStore = create<State & Actions>(((set, get) => {

  const saveConfig = debounce(() => {
    const config = get().storage?.config
    if (config) {
      sendToBackground({
        type: 'config.set',
        config,
      })
    }
  }, 200)

  const proxyConfig = (config: LocalStorageConfig) => {
    return deepProxy(config, {
      set(target, key, value, receiver) {
        const res = Reflect.set(target, key, value, receiver);
        saveConfig()
        return res;
      },
    });
  }

  const syncLoadStorage = (storage: LocalStorage) => {
    set({
      storage,
      config: proxyConfig(storage.config),
      whitelist: storage.whitelist,
      version: get().version + 1,
    })
  }

  const loadStorage = sharedAsync(async () => {
    syncLoadStorage(await chrome.storage.local.get() as LocalStorage)
  })

  const importStorage = async (ss: DeepPartial<LocalStorage>) => {
    const state = get()
    const storage = state.storage
    if (!storage) throw 'tip.err.config-unloaded';

    let isImported = false;

    /* 导入配置 */
    if (ss.config) {
      // 排除一些不支持导入的配置
      delete ss.config.prefs;
      delete ss.config.action?.fastInject;
      // 导入
      const _config = await sendToBackground({
        type: 'config.set',
        config: ss.config,
        result: true,
      })
      if (_config) {
        storage.config = _config
        set({
          config: proxyConfig(storage.config),
          version: state.version + 1,
        })
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
      throw 'Content is empty'
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
    sendToBackground({
      type: 'whitelist.update',
      data: {
        add: list,
        del,
      },
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
    sendToBackground({
      type: 'whitelist.update',
      data: {
        del: list,
      },
    })
  }

  const cleanWhitelist = () => {
    const storage = get().storage
    if (!storage) return;
    storage.whitelist = []
    set({ whitelist: storage.whitelist })
    sendToBackground({
      type: 'whitelist.update',
      clean: true,
    })
  }

  return {
    storage: undefined,
    config: undefined,
    whitelist: undefined,
    version: 0,

    syncLoadStorage,
    loadStorage,
    importStorage,
    saveConfig,
    addWhitelist,
    deleteWhitelist,
    cleanWhitelist,
  }
}))