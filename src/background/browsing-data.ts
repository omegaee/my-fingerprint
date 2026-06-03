/**
 * 移除浏览数据
 */
export const removeBrowsingData = async (scope: 'cache' | 'all', urls: string[]) => {
  if (!chrome.browsingData) {
    throw new Error('chrome.browsingData not supported')
  }

  if (!urls || urls.length === 0) {
    return;
  }

  const origins = []
  for (const url of urls) {
    try {
      const u = new URL(url)
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        origins.push(u.origin)
      }
    } catch (e) { }
  }

  if (origins.length === 0) {
    return;
  }

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

  await chrome.browsingData.remove({ origins }, dataToRemove);
}