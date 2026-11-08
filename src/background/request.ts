import { getLocalStorage } from "./storage"
import { HookType } from '@/types/enum'
import { isDefaultMode } from "@/utils/storage"
import { logManager } from '@/utils/log';
import { getBrowserInfo } from "@/utils/browser";

const logger = logManager.createLogger(__LOG_PREFIX_FILE_PATH__);

type RuleHeader = chrome.declarativeNetRequest.ModifyHeaderInfo

const UA_NET_RULE_ID = 1

const MEMORY = {
  browser: getBrowserInfo(),
}

const isHookNetRequest = (storage: LocalStorage) => {
  const fp = storage.config.fp
  return !isDefaultMode([
    fp.navigator.clientHints,
    fp.navigator.languages,
  ])
}

const genUaRules = ({ config }: LocalStorage): readonly RuleHeader[] => {
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
export const reRequestHeader = async ({
  exclude,
  include,
  remove,
}: {
  exclude?: number
  include?: number
  remove?: number
}) => {
  const { storage } = await getLocalStorage()

  if (!storage.config.enable || !isHookNetRequest(storage)) {
    return await removeRules()
  }

  /* 构建 Rules */
  const uaRules = MEMORY.browser.name === 'firefox' ? [] : genUaRules(storage)
  const langRules = genLanguageRules(storage)
  const rules = [
    ...uaRules,
    ...langRules,
  ]

  if (rules.length === 0) {
    return await removeRules()
  }

  const srs = await chrome.declarativeNetRequest.getSessionRules()
  const prev = srs.find(r => r.id === UA_NET_RULE_ID)

  /* 构建 Condition */
  const resourceTypes = Object.values(chrome.declarativeNetRequest.ResourceType)

  const includeSet = new Set(prev?.condition?.tabIds)
  const excludeSet = new Set(prev?.condition?.excludedTabIds)

  // 删除 Tab 状态
  if (remove != null) {
    includeSet.delete(remove)
    excludeSet.delete(remove)
  }

  // 添加 Tab 状态
  if (include != null) {
    includeSet.add(include)
    excludeSet.delete(include)
  }

  if (exclude != null) {
    excludeSet.add(exclude)
    includeSet.delete(exclude)
  }

  let condition: chrome.declarativeNetRequest.RuleCondition

  if (storage.policies.isBlacklistMode) {
    /* 黑名单模式 */
    condition = {
      resourceTypes,
      initiatorDomains: storage.policies.blacklist.length > 0
        ? [...storage.policies.blacklist]
        : undefined,
      tabIds: includeSet.size > 0 ? [...includeSet] : undefined,
    }

    // 黑名单模式下，如果没有任何条件，则删除规则
    if (!condition.initiatorDomains && !condition.tabIds) {
      return await removeRules()
    }
  } else {
    /* 白名单模式 */
    condition = {
      resourceTypes,
      excludedInitiatorDomains: storage.policies.whitelist.length > 0
        ? [...storage.policies.whitelist]
        : undefined,
      excludedTabIds: excludeSet.size > 0 ? [...excludeSet] : undefined,
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
        type: 'modifyHeaders' as any,
        requestHeaders: rules,
      },
    }],
  }).catch(e => {
    logger.error('reRequestHeader updateSessionRules error:', e)
  })
}
