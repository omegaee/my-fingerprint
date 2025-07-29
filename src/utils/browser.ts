/**
 * 获取浏览器信息
 */
export const getBrowserInfo = (ua?: string): {
  name?: 'firefox' | 'edge' | 'chrome',
  version?: string
} => {
  if (!ua) ua = navigator.userAgent;

  if (ua.includes('Firefox')) {
    return { name: 'firefox', version: ua.match(/Firefox\/(\d+)/)?.[1] };
  } else if (ua.includes('Edg')) {
    return { name: 'edge', version: ua.match(/Edg\/(\d+)/)?.[1] };
  } else if (ua.includes('Chrome')) {
    return { name: 'chrome', version: ua.match(/Chrome\/(\d+)/)?.[1] };
  }

  return {}
}

/**
 * 检查权限
 */
export const checkPermission = async (permission: chrome.runtime.ManifestPermissions) => {
  try {
    return await chrome.permissions.contains({ permissions: [permission] }) ? 'on' : 'off'
  } catch (err) {
    return 'ns'
  }
}