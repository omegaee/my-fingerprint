import { getBrowser } from "@/utils/equipment"
import { getLocalStorage } from "./storage"
import { HookType } from '@/types/enum'
import { isDefaultMode } from "@/utils/storage"

type RuleHeader = chrome.declarativeNetRequest.ModifyHeaderInfo
type RuleSignal = {
  isUpdate: boolean
}

const UA_NET_RULE_ID = 1

const MEMORY = {
  browser: getBrowser(navigator.userAgent),
  ua: undefined as Pair<string, readonly RuleHeader[]> | undefined,
  lang: undefined as Pair<string, readonly RuleHeader[]> | undefined,
  exIds: undefined as Set<number> | undefined,
  whitelistSet: undefined as Set<string> | undefined,
}

const isHookNetRequest = (storage: LocalStorage) => {
  const fp = storage.config.fp
  return !isDefaultMode([
    fp.navigator.clientHints,
    fp.navigator.languages,
  ])
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
  const uaMode = config.fp.navigator.clientHints

  const modeValue = (uaMode as any).value;
  const modeValueStr = typeof modeValue === 'object' ? JSON.stringify(modeValue) : modeValue;

  const key = `${uaMode.type}:${modeValueStr}`
  const mem = MEMORY.lang
  if (mem && mem[0] === key) return mem[1];

  singal.isUpdate = true;

  if (uaMode.type !== HookType.value) return [];

  const { ua, uaData } = uaMode.value;
  if (ua == null && uaData == null) return [];

  const fullVersionList = uaData.versions;
  const brands = fullVersionList?.map(v => ({
    ...v,
    version: v.version?.split('.')[0] ?? ''
  }))

  const makeRule = (header: string, value: string) => {
    return value == null ? undefined : {
      header,
      operation: "set",
      value,
    }
  }

  const res = [
    makeRule("User-Agent", ua.userAgent),
    makeRule("Sec-Ch-Ua-Arch", uaData.arch),
    makeRule("Sec-Ch-Ua-Bitness", uaData.bitness),
    makeRule("Sec-Ch-Ua-Platform", uaData.platform),
    makeRule("Sec-Ch-Ua-Platform-Version", uaData.platformVersion),
    makeRule("Sec-Ch-Ua-Mobile", uaData.mobile ? "?1" : "?0"),
    makeRule("Sec-Ch-Ua-Model", uaData.model),
    makeRule("Sec-Ch-Ua-Form-Factors", uaData.formFactors.join(", ")),
    makeRule("Sec-Ch-Ua-Full-Version", uaData.uaFullVersion),
    makeRule("Sec-Ch-Ua", brands.map((brand) => `"${brand.brand}";v="${brand.version}"`).join(", ")),
    makeRule("Sec-Ch-Ua-Full-Version-List", fullVersionList.map((brand) => `"${brand.brand}";v="${brand.version}"`).join(", ")),
  ].filter(Boolean) as RuleHeader[]

  MEMORY.ua = [key, res]
  return res;
}

const genLanguageRules = ({ config }: LocalStorage, singal: RuleSignal): readonly RuleHeader[] => {
  const langsMode = config.fp.navigator.languages

  const modeValue = (langsMode as any).value;
  const modeValueStr = typeof modeValue === 'object' ? JSON.stringify(modeValue) : modeValue;

  const key = `${langsMode.type}:${modeValueStr}`
  const mem = MEMORY.lang
  if (mem && mem[0] === key) return mem[1];

  singal.isUpdate = true;

  if (langsMode.type !== HookType.value) return [];

  const res: RuleHeader[] = []
  const langs = langsMode.value;

  if (langs?.length) {
    const [first, ...rest] = langs
    let qFactor = 1
    for (let i = 0; i < rest.length && qFactor > 0.1; i++) {
      qFactor -= 0.1
      rest[i] = `${rest[i]};q=${qFactor.toFixed(1)}`
    }
    res.push({
      header: "Accept-Language",
      operation: "set" as any,
      value: [first, ...rest].join(","),
    })
  }

  MEMORY.lang = [key, res]
  return res;
}

const checkWhitelistDiff = ({ whitelist }: LocalStorage, singal: RuleSignal) => {
  const mem = MEMORY.whitelistSet
  if (!mem || mem.size !== whitelist.length || whitelist.some((v) => !mem.has(v))) {
    MEMORY.whitelistSet = new Set(whitelist)
    singal.isUpdate = true
  }
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

  if (!storage.config.enable || !isHookNetRequest(storage)) {
    return await removeRules()
  }

  const singal: RuleSignal = { isUpdate: false }

  const uaRules = MEMORY.browser === 'firefox' ? [] : await genUaRules(storage, singal)
  const langRules = genLanguageRules(storage, singal)
  const exTabIds = await getExcludeTabIds(singal, excludeTabIds, passTabIds)
  checkWhitelistDiff(storage, singal)

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
          type: "modifyHeaders" as any,
          requestHeaders: rules,
        },
      }]
    }).catch(() => { })
  }
}