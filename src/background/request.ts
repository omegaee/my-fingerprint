import { getBrowser } from "@/utils/equipment"
import { getLocalStorage } from "./storage"
import { HookType } from '@/types/enum'
import { isDefaultMode } from "@/utils/storage"
import { logManager } from '@/utils/log';

const logger = logManager.createLogger(__LOG_PREFIX_FILE_PATH__);

type RuleHeader = chrome.declarativeNetRequest.ModifyHeaderInfo

const UA_NET_RULE_ID = 1

const MEMORY = {
  browser: getBrowser(navigator.userAgent),
  configNonce: 0,
  includeTabIds: undefined as number[] | undefined,
  excludeTabIds: undefined as number[] | undefined,
}

const isHookNetRequest = (storage: LocalStorage) => {
  const fp = storage.config.fp
  return !isDefaultMode([
    fp.navigator.clientHints,
    fp.navigator.languages,
  ])
}

const genUaRules = async ({ config }: LocalStorage): Promise<readonly RuleHeader[]> => {
  const uaMode = config.fp.navigator.clientHints

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
    makeRule("Sec-Ch-Ua-Arch", `"${uaData.arch}"`),
    makeRule("Sec-Ch-Ua-Bitness", `"${uaData.bitness}"`),
    makeRule("Sec-Ch-Ua-Platform", `"${uaData.platform}"`),
    makeRule("Sec-Ch-Ua-Platform-Version", `"${uaData.platformVersion}"`),
    makeRule("Sec-Ch-Ua-Mobile", uaData.mobile ? "?1" : "?0"),
    makeRule("Sec-Ch-Ua-Model", `"${uaData.model}"`),
    makeRule("Sec-Ch-Ua-Form-Factors", uaData.formFactors.map(v => `"${v}"`).join(", ")),
    makeRule("Sec-Ch-Ua-Full-Version", `"${uaData.uaFullVersion}"`),
    makeRule("Sec-Ch-Ua", brands.map((brand) => `"${brand.brand}";v="${brand.version}"`).join(", ")),
    makeRule("Sec-Ch-Ua-Full-Version-List", fullVersionList.map((brand) => `"${brand.brand}";v="${brand.version}"`).join(", ")),
  ].filter(Boolean) as RuleHeader[]

  logger.debug('genUaRules:', res)

  return res;
}

const genLanguageRules = ({ config }: LocalStorage): readonly RuleHeader[] => {
  const langsMode = config.fp.navigator.languages

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

  logger.debug('genLanguageRules:', res)

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
export const reRequestHeader = async (excludeTabId?: number, includeTabId?: number) => {
  const { storage, configNonce } = await getLocalStorage()

  if (!storage.config.enable || !isHookNetRequest(storage)) {
    return await removeRules()
  }

  const srs = await chrome.declarativeNetRequest.getSessionRules()

  /* 构建 Rules */
  let rules: RuleHeader[] | undefined;
  if (MEMORY.configNonce === configNonce) {
    rules = srs[0]?.action?.requestHeaders
  } else {
    MEMORY.configNonce = configNonce
    const uaRules = MEMORY.browser === 'firefox' ? [] : await genUaRules(storage)
    const langRules = genLanguageRules(storage)
    rules = [
      ...uaRules,
      ...langRules,
    ]
  }

  if (!rules || rules.length === 0) {
    return await removeRules()
  }

  /* 构建 Condition */
  let condition: chrome.declarativeNetRequest.RuleCondition;
  const resourceTypes = Object.values(chrome.declarativeNetRequest.ResourceType)
  if (storage.policies.isBlacklistMode) {
    /* 黑名单模式 */
    if (!MEMORY.includeTabIds) {
      MEMORY.includeTabIds = srs[0]?.condition?.tabIds ?? []
    }
    if (includeTabId != null) {
      MEMORY.includeTabIds.push(includeTabId)
      MEMORY.includeTabIds = [...new Set(MEMORY.includeTabIds)]
    }

    condition = { resourceTypes }
    if (storage.policies.blacklist.length > 0) {
      condition.initiatorDomains = [...storage.policies.blacklist]
    }
    if (MEMORY.includeTabIds.length > 0) {
      condition.tabIds = [...MEMORY.includeTabIds]
    }
    if (!condition.initiatorDomains && !condition.tabIds) {
      return await removeRules()
    }
  } else {
    /* 白名单模式 */
    if (!MEMORY.excludeTabIds) {
      MEMORY.excludeTabIds = srs[0]?.condition?.excludedTabIds ?? []
    }
    if (excludeTabId != null) {
      MEMORY.excludeTabIds.push(excludeTabId)
      MEMORY.excludeTabIds = [...new Set(MEMORY.excludeTabIds)]
    }

    condition = { resourceTypes }
    if (storage.policies.whitelist.length > 0) {
      condition.excludedInitiatorDomains = [...storage.policies.whitelist]
    }
    if (MEMORY.excludeTabIds.length > 0) {
      condition.excludedTabIds = [...MEMORY.excludeTabIds]
    }
  }

  logger.debug('reRequestHeader', 'rules:', rules, '\ncondition:', condition)

  /* 更新 SessionRules */
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [UA_NET_RULE_ID],
    addRules: [{
      id: UA_NET_RULE_ID,
      condition,
      action: {
        type: "modifyHeaders" as any,
        requestHeaders: rules,
      },
    }]
  }).catch((e) => {
    logger.error('reRequestHeader updateSessionRules error:', e);
  })
}
