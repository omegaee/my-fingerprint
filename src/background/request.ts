import { genRandomVersionUserAgent, genRandomVersionUserAgentData } from "@/utils/equipment"
import { getLocalStorage } from "./storage"
import { shuffleArray } from "@/utils/data"
import { HookType } from '@/types/enum'

type RuleHeader = chrome.declarativeNetRequest.ModifyHeaderInfo
type RuleSignal = {
  isUpdate: boolean
}

const UA_NET_RULE_ID = 1

const RAW = {
  languages: navigator.languages,
}

const MEMORY = {
  ua: new Map<string, readonly RuleHeader[]>(),
  lang: new Map<string, readonly RuleHeader[]>(),
}

let mExcludeIds: Set<number> | undefined = undefined

/**
 * 获取已排除的tabID
 */
const getExcludeTabIds = async (singal: RuleSignal, excludeIds?: number | number[], passIds?: number | number[]) => {
  if (!mExcludeIds) {
    const rules = await chrome.declarativeNetRequest.getSessionRules()
    mExcludeIds = new Set(rules[0]?.condition?.excludedTabIds)
  }

  if (excludeIds !== undefined) {
    if (Array.isArray(excludeIds)) {
      for (const excludeTabId of excludeIds) {
        if (!mExcludeIds.has(excludeTabId)) {
          mExcludeIds.add(excludeTabId)
          singal.isUpdate = true
        }
      }
    } else {
      if (!mExcludeIds.has(excludeIds)) {
        mExcludeIds.add(excludeIds)
        singal.isUpdate = true
      }
    }
  }

  if (passIds !== undefined) {
    if (Array.isArray(passIds)) {
      for (const passTabId of passIds) {
        if (mExcludeIds.has(passTabId)) {
          mExcludeIds.delete(passTabId)
          singal.isUpdate = true
        }
      }
    } else {
      if (mExcludeIds.has(passIds)) {
        mExcludeIds.delete(passIds)
        singal.isUpdate = true
      }
    }
  }

  return mExcludeIds
}

/**
 * 获取seed
 */
const getSeedByMode = (config: LocalStorageConfig, mode: HookMode) => {
  switch (mode?.type) {
    case HookType.browser:
      return config.browserSeed
    case HookType.global:
      return config.customSeed
    default:
      return undefined
  }
}

const genUaRules = async ({ config }: LocalStorage, singal: RuleSignal): Promise<readonly RuleHeader[]> => {
  const key = JSON.stringify(config.fingerprint.navigator.equipment)
  const mem = MEMORY.ua.get(key)
  if (mem) return mem;

  const res: RuleHeader[] = []
  const uaSeed = getSeedByMode(config, config.fingerprint.navigator.equipment);
  if (uaSeed) {
    res.push({
      header: "User-Agent",
      operation: chrome.declarativeNetRequest.HeaderOperation.SET,
      value: genRandomVersionUserAgent(uaSeed, navigator),
    })
    const uaData = await genRandomVersionUserAgentData(uaSeed, navigator)
    uaData.brands && res.push({
      header: "Sec-Ch-Ua",
      operation: chrome.declarativeNetRequest.HeaderOperation.SET,
      value: uaData.brands.map((brand) => `"${brand.brand}";v="${brand.version}"`).join(", "),
    })
    uaData.fullVersionList && res.push({
      header: "Sec-Ch-Ua-Full-Version-List",
      operation: chrome.declarativeNetRequest.HeaderOperation.SET,
      value: uaData.fullVersionList.map((brand) => `"${brand.brand}";v="${brand.version}"`).join(", "),
    })
    uaData.uaFullVersion && res.push({
      header: "Sec-Ch-Ua-Full-Version",
      operation: chrome.declarativeNetRequest.HeaderOperation.SET,
      value: uaData.uaFullVersion,
    })
  }

  MEMORY.ua.set(key, res)
  singal.isUpdate = true;
  return res;
}

const genLanguageRules = ({ config }: LocalStorage, singal: RuleSignal): readonly RuleHeader[] => {
  const key = JSON.stringify(config.fingerprint.navigator.languages)
  const mem = MEMORY.lang.get(key)
  if (mem) return mem;

  const res: RuleHeader[] = []
  const langsMode = config.fingerprint.navigator.languages
  if (langsMode && langsMode.type !== HookType.default) {
    /* 获取种子 */
    let langs: string[] | undefined
    if (langsMode.type === HookType.value) {
      langs = langsMode.value
    } else {
      const langSeed = getSeedByMode(config, langsMode)
      if (langSeed) {
        langs = shuffleArray(RAW.languages, langSeed)
      }
    }
    /* 修改 */
    if (langs?.length) {
      const [first, ...rest] = langs
      let qFactor = 1
      for (let i = 0; i < rest.length && qFactor > 0.1; i++) {
        qFactor -= 0.1
        rest[i] = `${rest[i]};q=${qFactor.toFixed(1)}`
      }
      res.push({
        header: "Accept-Language",
        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
        value: [first, ...rest].join(","),
      })
    }
  }

  MEMORY.lang.set(key, res)
  singal.isUpdate = true;
  return res;
}

/**
 * 刷新请求头
 */
export const reRequestHeader = async (excludeTabIds?: number | number[], passTabIds?: number | number[]) => {
  const [storage, whitelist] = await getLocalStorage()

  if (!storage.config.enable || !storage.config.hookNetRequest) {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [UA_NET_RULE_ID],
    }).catch(() => { })
    return
  }

  const singal: RuleSignal = { isUpdate: false }

  const uaRules = await genUaRules(storage, singal)
  const langRules = genLanguageRules(storage, singal)
  const exTabIds = await getExcludeTabIds(singal, excludeTabIds, passTabIds)

  if (singal.isUpdate) {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [UA_NET_RULE_ID],
      addRules: [{
        id: UA_NET_RULE_ID,
        condition: {
          excludedInitiatorDomains: [...whitelist].map((host) => host.split(':')[0]),
          resourceTypes: Object.values(chrome.declarativeNetRequest.ResourceType),
          excludedTabIds: [...exTabIds],
        },
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
          requestHeaders: [
            ...uaRules,
            ...langRules,
          ],
        },
      }]
    }).catch(() => { })
  }
}