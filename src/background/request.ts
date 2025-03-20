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
  ua: undefined as Pair<string, readonly RuleHeader[]> | undefined,
  lang: undefined as Pair<string, readonly RuleHeader[]> | undefined,
  exIds: undefined as Set<number> | undefined,
  whitelistSize: 0 as number,
}

/**
 * 获取已排除的tabID
 */
const getExcludeTabIds = async (singal: RuleSignal, excludeIds?: number | number[], passIds?: number | number[]) => {
  if (!MEMORY.exIds) {
    const rules = await chrome.declarativeNetRequest.getSessionRules()
    MEMORY.exIds = new Set(rules[0]?.condition?.excludedTabIds)
  }

  if (excludeIds !== undefined) {
    if (Array.isArray(excludeIds)) {
      for (const excludeTabId of excludeIds) {
        if (!MEMORY.exIds.has(excludeTabId)) {
          MEMORY.exIds.add(excludeTabId)
          singal.isUpdate = true
        }
      }
    } else {
      if (!MEMORY.exIds.has(excludeIds)) {
        MEMORY.exIds.add(excludeIds)
        singal.isUpdate = true
      }
    }
  }

  if (passIds !== undefined) {
    if (Array.isArray(passIds)) {
      for (const passTabId of passIds) {
        if (MEMORY.exIds.has(passTabId)) {
          MEMORY.exIds.delete(passTabId)
          singal.isUpdate = true
        }
      }
    } else {
      if (MEMORY.exIds.has(passIds)) {
        MEMORY.exIds.delete(passIds)
        singal.isUpdate = true
      }
    }
  }

  return MEMORY.exIds
}

/**
 * 获取seed
 */
const getSeedByMode = (config: LocalStorageConfig, mode: HookMode) => {
  switch (mode?.type) {
    case HookType.browser:
      return config.seed.browser
    case HookType.global:
      return config.seed.global
    default:
      return undefined
  }
}

const genUaRules = async ({ config }: LocalStorage, singal: RuleSignal): Promise<readonly RuleHeader[]> => {
  const uaMode = config.fp.navigator.uaVersion
  const key = `${uaMode.type}:${config.seed.global}:${config.seed.browser}`
  const mem = MEMORY.ua
  if (mem && mem[0] === key) return mem[1];

  const res: RuleHeader[] = []
  const uaSeed = getSeedByMode(config, uaMode);
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

  MEMORY.ua = [key, res]
  singal.isUpdate = true;
  return res;
}

const genLanguageRules = ({ config }: LocalStorage, singal: RuleSignal): readonly RuleHeader[] => {
  const langsMode = config.fp.navigator.languages
  const key = `${langsMode.type}:${(langsMode as any).value ?? ''}:${config.seed.global}:${config.seed.browser}`
  const mem = MEMORY.lang
  if (mem && mem[0] === key) return mem[1];

  const res: RuleHeader[] = []
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

  MEMORY.lang = [key, res]
  singal.isUpdate = true;
  return res;
}

/**
 * 删除请求头规则
 */
const removeRules = async () => {
  return await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [UA_NET_RULE_ID],
  }).catch(() => { })
}

/**
 * 刷新请求头
 */
export const reRequestHeader = async (excludeTabIds?: number | number[], passTabIds?: number | number[]) => {
  const [storage] = await getLocalStorage()

  if (!storage.config.enable || !storage.config.action.hookNetRequest) {
    return await removeRules()
  }

  const singal: RuleSignal = { isUpdate: false }

  const uaRules = await genUaRules(storage, singal)
  const langRules = genLanguageRules(storage, singal)
  const exTabIds = await getExcludeTabIds(singal, excludeTabIds, passTabIds)
  if (storage.whitelist.length !== MEMORY.whitelistSize) {
    MEMORY.whitelistSize = storage.whitelist.length
    singal.isUpdate = true
  }

  if (singal.isUpdate) {
    const rules = [
      ...uaRules,
      ...langRules,
    ]
    if (rules.length === 0) {
      return await removeRules()
    }
    return await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [UA_NET_RULE_ID],
      addRules: [{
        id: UA_NET_RULE_ID,
        condition: {
          excludedInitiatorDomains: [...storage.whitelist],
          resourceTypes: Object.values(chrome.declarativeNetRequest.ResourceType),
          excludedTabIds: [...exTabIds],
        },
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
          requestHeaders: rules,
        },
      }]
    }).catch(() => { })
  }
}