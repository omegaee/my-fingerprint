const SPECIAL_KEYS: (keyof HookFingerprint['other'])[] = ['timezone', 'canvas', 'audio', 'font', 'webgl', 'webrtc', 'webgpu']

const BADGE_COLOR = {
  whitelist: '#fff',
  low: '#7FFFD4',
  high: '#F4A460',
}

/**
 * 获取Badge内容
 * @returns [文本, 颜色]
 */
export const getBadgeContent = (records: Partial<Record<HookFingerprintKey, number>>): [string, string] => {
  let baseNum = 0
  let specialNum = 0
  for (const [key, num] of Object.entries(records)) {
    if (SPECIAL_KEYS.includes(key as any)) {
      specialNum += num
    } else {
      baseNum += num
    }
  }
  const showNum = specialNum || baseNum
  return [showNum >= 100 ? '99+' : String(showNum), specialNum ? BADGE_COLOR.high : BADGE_COLOR.low]
}

/**
 * 设置白名单标识
 */
export const setBadgeWhitelist = (tabId: number) => {
  chrome.action.setBadgeText({ tabId, text: ' ' });
  chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR.whitelist })
}

/**
 * 移除标识
 */
export const removeBadge = (tabId: number) => {
  chrome.action.setBadgeText({ tabId, text: '' })
}