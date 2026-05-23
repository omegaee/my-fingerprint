import { sendToBackground } from "@/utils/message"
import { debounce } from "@/utils/timer"
import { create } from "zustand"

type State = {
  version: number
  config?: LocalStorageConfig
  policies?: LocalStoragePolicies
}

type Actions = {
  loadStorage: () => void
  saveConfig: () => void
  savePolicies: () => void
}

export const useStorageStore = create<State & Actions>(((set, get) => {

  const loadStorage = async () => {
    const s = await chrome.storage.local.get() as LocalStorage
    set({
      config: s.config,
      policies: s.policies,
    })
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
    storage: undefined,

    loadStorage,
    saveConfig,
    savePolicies,
  }
}))