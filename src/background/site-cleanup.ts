export type SiteCleanupScope = 'cache-lite' | 'site-data'

const HTTP_PROTOCOLS = new Set(['http:', 'https:'])

const CLEANUP_DATA: Record<SiteCleanupScope, chrome.browsingData.DataTypeSet> = {
  'cache-lite': {
    cacheStorage: true,
    serviceWorkers: true,
  },
  'site-data': {
    cacheStorage: true,
    cookies: true,
    fileSystems: true,
    indexedDB: true,
    localStorage: true,
    serviceWorkers: true,
    webSQL: true,
  },
}

const cloneCleanupData = (scope: SiteCleanupScope) => ({ ...CLEANUP_DATA[scope] })

export const isSiteCleanupScope = (value: string): value is SiteCleanupScope =>
  value === 'cache-lite' || value === 'site-data'

export const resolveSiteCleanupOrigin = (url: string) => {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('site-cleanup-invalid-url')
  }

  if (!HTTP_PROTOCOLS.has(parsed.protocol)) {
    throw new Error('site-cleanup-unsupported-url')
  }

  return parsed.origin
}

export const getSiteCleanupPlan = (url: string, scope: SiteCleanupScope) => {
  const origin = resolveSiteCleanupOrigin(url)
  const dataToRemove = cloneCleanupData(scope)

  return {
    origin,
    scope,
    dataToRemove,
    cleared: Object.keys(dataToRemove).filter((key) => dataToRemove[key as keyof typeof dataToRemove]),
    options: {
      origins: [origin],
      originTypes: {
        unprotectedWeb: true,
      },
    } satisfies chrome.browsingData.RemovalOptions,
  }
}

export const clearSiteData = async ({
  chromeApi,
  url,
  scope,
}: {
  chromeApi: Pick<typeof chrome, 'browsingData'>
  url: string
  scope: SiteCleanupScope
}) => {
  if (!chromeApi.browsingData?.remove) {
    throw new Error('site-cleanup-unsupported-browser')
  }

  const plan = getSiteCleanupPlan(url, scope)
  await chromeApi.browsingData.remove(plan.options, plan.dataToRemove)
  return plan
}
