const BADGE_COLOR = {
  whitelist: '#fff',
  low: '#7FFFD4',
  high: '#F4A460',
}

/**
 * 设置标识
 */
export const setBadgeContent = (tabId: number, text: string, level: number) => {
  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setBadgeBackgroundColor({ tabId, color: level === 1 ? BADGE_COLOR.low : BADGE_COLOR.high });
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