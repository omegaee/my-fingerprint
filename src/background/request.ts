import { genRandomVersionUserAgent, genRandomVersionUserAgentData } from "@/utils/equipment"
import { getLocalStorage } from "./storage"
import { shuffleArray } from "@/utils/data"
import { HookType } from '@/types/enum'

type RuleHeader = chrome.declarativeNetRequest.ModifyHeaderInfo

const UA_NET_RULE_ID = 1

const RAW = {
  languages: navigator.languages,
}

const MEMORY = {
  ua: new Map<string, readonly RuleHeader[]>(),
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

const genUaRules = async ({ config }: LocalStorage): Promise<readonly RuleHeader[]> => {
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
  return res;
}

const genLanguageRules = ({ config }: LocalStorage): readonly RuleHeader[] => {
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
  return res
}

/**
 * 刷新请求头UA
 */
export const refreshRequestHeader = async () => {
  const [storage, whitelist] = await getLocalStorage()

  const options: chrome.declarativeNetRequest.UpdateRuleOptions = {
    removeRuleIds: [UA_NET_RULE_ID],
  }

  if (!storage.config.enable || !storage.config.hookNetRequest) {
    chrome.declarativeNetRequest.updateSessionRules(options)
    return
  }

  const headers = [
    ...await genUaRules(storage),
    ...genLanguageRules(storage),
  ]

  if (headers.length) {
    options.addRules = [{
      id: UA_NET_RULE_ID,
      condition: {
        excludedInitiatorDomains: [...whitelist].map((host) => host.split(':')[0]),
        resourceTypes: Object.values(chrome.declarativeNetRequest.ResourceType),
      },
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        requestHeaders: headers,
      },
    }]
  }

  chrome.declarativeNetRequest.updateSessionRules(options)
}