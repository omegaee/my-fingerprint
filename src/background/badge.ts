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
export const getBadgeContent = (noticeTotal: Record<'weak' | 'strong' | (string & {}), number>): {
  text: string
  color: string
} => {
  const weak = noticeTotal['weak'] ?? 0
  const strong = noticeTotal['strong'] ?? 0
  return {
    text: getShowNumber(strong > 0 ? strong : weak),
    color: strong > 0 ? BADGE_COLOR.high : BADGE_COLOR.low,
  }
}

const getShowNumber = (num: number) => {
  return num >= 100 ? '99+' : String(num)
}

/**
 * 设置白名单标识
 */
export const setBadgeWhitelist = (tabId: number) => {
  chrome.action.setBadgeText({ tabId, text: '-' }).catch(() => { })
  chrome.action.setBadgeTextColor({ tabId, color: BADGE_COLOR.whitelist }).catch(() => { })
  chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR.whitelist }).catch(() => { })
}

/**
 * 移除标识
 */
export const removeBadge = (tabId: number) => {
  chrome.action.setBadgeText({ tabId, text: '' }).catch(() => { })
}