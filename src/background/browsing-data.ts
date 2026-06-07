import { getBrowserInfo } from "@/utils/browser";

/**
 * 移除浏览数据
 */
export const removeBrowsingData = async (scope: 'cache' | 'all', urls: string[]) => {
  if (!chrome.browsingData) {
    throw new Error('chrome.browsingData not supported')
  }

  const { name } = getBrowserInfo()
  if (!name) {
    throw new Error('browser name not supported')
  }

  if (!urls || urls.length === 0) {
    return;
  }

  const _urls: URL[] = []
  for (const url of urls) {
    try {
      const u = new URL(url)
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        _urls.push(u)
      }
    } catch (e) { }
  }

  if (_urls.length === 0) {
    return;
  }

  if (name === 'firefox') {
    await removeFirefoxBrowsingData(scope, _urls)
  } else {
    await removeChromeBrowsingData(scope, _urls)
  }
}

/**
 * 清理 chrome 浏览数据
 */
const removeChromeBrowsingData = async (scope: 'cache' | 'all', urls: URL[]) => {
  let dataToRemove: chrome.browsingData.DataTypeSet
  if (scope === 'all') {
    dataToRemove = {
      serviceWorkers: true,
      cacheStorage: true,
      cookies: true,
      localStorage: true,
      indexedDB: true,
      webSQL: true,
      fileSystems: true,
      pluginData: true,
    }
  } else {
    dataToRemove = {
      serviceWorkers: true,
      cacheStorage: true,
    }
  }

  await chrome.browsingData.remove({
    origins: urls.map(u => u.origin)
  }, dataToRemove);
}

/**
 * 清理 firefox 浏览数据
 */
const removeFirefoxBrowsingData = async (scope: 'cache' | 'all', urls: URL[]) => {
  let dataToRemove: chrome.browsingData.DataTypeSet
  if (scope === 'all') {
    dataToRemove = {
      cache: true,
      serviceWorkers: true,
      cookies: true,
      localStorage: true,
      indexedDB: true,
      pluginData: true,
    }
  } else {
    dataToRemove = {
      cache: true,
      serviceWorkers: true,
    }
  }

  await chrome.browsingData.remove({
    // @ts-ignore
    hostnames: urls.map(u => u.hostname)
  }, dataToRemove);
}