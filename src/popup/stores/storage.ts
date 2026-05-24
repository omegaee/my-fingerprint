import i18n from "@/locales"
import { sendToBackground } from "@/utils/message"
import { debounce } from "@/utils/timer"
import { create } from "zustand"

type State = {
  version: number
  storage?: LocalStorage
  config?: LocalStorageConfig
  policies?: LocalStoragePolicies
}

type Actions = {
  loadStorage: () => void
  importStorage: (data: DeepPartial<LocalStorage>) => Promise<void>
  saveConfig: () => void
  savePolicies: () => void
}

export const useStorageStore = create<State & Actions>(((set, get) => {

  const loadStorage = async () => {
    const s = await chrome.storage.local.get() as LocalStorage
    set({
      storage: s,
      config: s.config,
      policies: s.policies,
    })
  }

  const importStorage = async (data: DeepPartial<LocalStorage>) => {
    const res = await sendToBackground({
      type: 'storage.import',
      storage: data,
    })

    if (res.ok && res.storage) {
      set({
        storage: res.storage,
        config: res.storage.config,
        policies: res.storage.policies,
      })
    } else {
      throw new Error(
        (res.messageKey ? i18n.t(res.messageKey) : res.message) ?? 'Import failed'
      )
    }
  }

  const _saveConfig = debounce(async () => {
    const v = get().config;
    if (v) {
      sendToBackground({
        type: 'config.set',
        config: v,
      })
    }
  }, 200)

  const _savePolicies = debounce(async () => {
    const v = get().policies;
    if (v) {
      sendToBackground({
        type: 'policies.set',
        policies: v,
      })
    }
  }, 200)

  const saveConfig = () => {
    _saveConfig()
    set(({ version }) => ({
      version: version + 1,
    }))
  }

  const savePolicies = () => {
    _savePolicies()
    set(({ version }) => ({
      version: version + 1,
    }))
  }

  return {
    version: 0,

    loadStorage,
    importStorage,
    saveConfig,
    savePolicies,
  }
}))