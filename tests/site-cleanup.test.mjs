import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getSiteCleanupPlan,
  isSiteCleanupScope,
  resolveSiteCleanupOrigin,
} from '../src/background/site-cleanup.ts'

test('resolveSiteCleanupOrigin keeps only http and https origins', () => {
  assert.equal(
    resolveSiteCleanupOrigin('https://example.com/path?q=1#hash'),
    'https://example.com'
  )
  assert.equal(
    resolveSiteCleanupOrigin('http://sub.example.com:8080/demo'),
    'http://sub.example.com:8080'
  )
})

test('resolveSiteCleanupOrigin rejects unsupported schemes', () => {
  assert.throws(
    () => resolveSiteCleanupOrigin('chrome://extensions'),
    /site-cleanup-unsupported-url/
  )
  assert.throws(
    () => resolveSiteCleanupOrigin('not a url'),
    /site-cleanup-invalid-url/
  )
})

test('getSiteCleanupPlan builds the cache-lite cleanup payload', () => {
  const plan = getSiteCleanupPlan('https://example.com/demo', 'cache-lite')

  assert.equal(plan.origin, 'https://example.com')
  assert.deepEqual(plan.options, {
    origins: ['https://example.com'],
    originTypes: { unprotectedWeb: true },
  })
  assert.deepEqual(plan.dataToRemove, {
    cacheStorage: true,
    serviceWorkers: true,
  })
  assert.deepEqual(plan.cleared, ['cacheStorage', 'serviceWorkers'])
})

test('getSiteCleanupPlan builds the full site-data cleanup payload', () => {
  const plan = getSiteCleanupPlan('https://example.com/demo', 'site-data')

  assert.deepEqual(plan.dataToRemove, {
    cacheStorage: true,
    cookies: true,
    fileSystems: true,
    indexedDB: true,
    localStorage: true,
    serviceWorkers: true,
    webSQL: true,
  })
  assert.deepEqual(plan.cleared, [
    'cacheStorage',
    'cookies',
    'fileSystems',
    'indexedDB',
    'localStorage',
    'serviceWorkers',
    'webSQL',
  ])
})

test('isSiteCleanupScope accepts only supported cleanup scopes', () => {
  assert.equal(isSiteCleanupScope('cache-lite'), true)
  assert.equal(isSiteCleanupScope('site-data'), true)
  assert.equal(isSiteCleanupScope('all-data'), false)
})
