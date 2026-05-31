import test from 'node:test'
import assert from 'node:assert/strict'

import { getBrowser } from '../src/utils/equipment.ts'

test('getBrowser routes Edge through the Chromium path explicitly', () => {
  assert.equal(
    getBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0'),
    'chrome'
  )
})

test('getBrowser still detects Chrome and Firefox', () => {
  assert.equal(
    getBrowser('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'),
    'chrome'
  )
  assert.equal(
    getBrowser('Mozilla/5.0 Gecko/20100101 Firefox/138.0'),
    'firefox'
  )
})
