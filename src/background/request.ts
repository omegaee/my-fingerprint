import { genRandomVersionUserAgent, genRandomVersionUserAgentData } from "@/utils/equipment"
import { getLocalStorage } from "./storage"
import { shuffleArray } from "@/utils/data"
import { HookType } from '@/types/enum'

const UA_NET_RULE_ID = 1

const RAW = {
  languages: navigator.languages,
}

/**
 * 获取seed
 */
const getSeedByMode = (storage: LocalStorageObject, mode: HookMode) => {
  switch (mode?.type) {
    case HookType.browser:
      return storage.config.browserSeed
    case HookType.global:
      return storage.config.customSeed
    default:
      return undefined
  }
}

/**
 * 刷新请求头UA
 */
export const refreshRequestHeader = async () => {
  const storage = await getLocalStorage()

  const options: chrome.declarativeNetRequest.UpdateRuleOptions = {
    removeRuleIds: [UA_NET_RULE_ID],
  }

  if (!storage.config.enable || !storage.config.hookNetRequest) {
    chrome.declarativeNetRequest.updateSessionRules(options)
    return
  }

  const requestHeaders: chrome.declarativeNetRequest.ModifyHeaderInfo[] = []

  const equipmentSeed = getSeedByMode(storage, storage.config.fingerprint.navigator.equipment);
  if (equipmentSeed) {
    requestHeaders.push({
      header: "User-Agent",
      operation: chrome.declarativeNetRequest.HeaderOperation.SET,
      value: genRandomVersionUserAgent(equipmentSeed, navigator),
    })

    const uaData = await genRandomVersionUserAgentData(equipmentSeed, navigator)
    uaData.brands && requestHeaders.push({
      header: "Sec-Ch-Ua",
      operation: chrome.declarativeNetRequest.HeaderOperation.SET,
      value: uaData.brands.map((brand) => `"${brand.brand}";v="${brand.version}"`).join(", "),
    })
    uaData.fullVersionList && requestHeaders.push({
      header: "Sec-Ch-Ua-Full-Version-List",
      operation: chrome.declarativeNetRequest.HeaderOperation.SET,
      value: uaData.fullVersionList.map((brand) => `"${brand.brand}";v="${brand.version}"`).join(", "),
    })
    uaData.uaFullVersion && requestHeaders.push({
      header: "Sec-Ch-Ua-Full-Version",
      operation: chrome.declarativeNetRequest.HeaderOperation.SET,
      value: uaData.uaFullVersion,
    })
  }

  const langsMode = storage.config.fingerprint.navigator.languages
  if (langsMode && langsMode.type !== HookType.default) {
    /* 获取种子 */
    let langs: string[] | undefined
    if (langsMode.type === HookType.value) {
      langs = langsMode.value
    } else {
      const langSeed = getSeedByMode(storage, langsMode)
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
      requestHeaders.push({
        header: "Accept-Language",
        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
        value: [first, ...rest].join(","),
      })
    }
  }

  if (requestHeaders.length) {
    options.addRules = [{
      id: UA_NET_RULE_ID,
      // priority: 1,
      condition: {
        excludedInitiatorDomains: [...new Set([...storage.whitelist].map((host) => host.split(':')[0]))],
        resourceTypes: Object.values(chrome.declarativeNetRequest.ResourceType),
        // resourceTypes: [RT.MAIN_FRAME, RT.SUB_FRAME, RT.IMAGE, RT.FONT, RT.MEDIA, RT.STYLESHEET, RT.SCRIPT ],
      },
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        requestHeaders,
      },
    }]
  }

  chrome.declarativeNetRequest.updateSessionRules(options)
}