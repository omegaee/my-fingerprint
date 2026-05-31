import test from 'node:test'
import assert from 'node:assert/strict'

import {
  fromTimeZoneLocalDate,
  getTimeZoneDisplayInfo,
  isValidTimeZone,
  resolveTimeZoneOffset,
  toTimeZoneLocalDate,
} from '../src/utils/timezone.ts'

test('resolveTimeZoneOffset uses DST-aware offsets for preset IANA zones', () => {
  const winter = new Date('2026-01-15T12:00:00.000Z')
  const summer = new Date('2026-06-15T12:00:00.000Z')

  assert.equal(resolveTimeZoneOffset({
    offset: -8,
    zone: 'America/Los_Angeles',
    locale: 'en-US',
  }, winter), -8)

  assert.equal(resolveTimeZoneOffset({
    offset: -8,
    zone: 'America/Los_Angeles',
    locale: 'en-US',
  }, summer), -7)
})

test('resolveTimeZoneOffset handles another DST-sensitive preset', () => {
  const winter = new Date('2026-01-15T12:00:00.000Z')
  const summer = new Date('2026-06-15T12:00:00.000Z')

  assert.equal(resolveTimeZoneOffset({
    offset: -5,
    zone: 'America/New_York',
    locale: 'en-US',
  }, winter), -5)

  assert.equal(resolveTimeZoneOffset({
    offset: -5,
    zone: 'America/New_York',
    locale: 'en-US',
  }, summer), -4)
})

test('resolveTimeZoneOffset falls back to manual offset when zone is invalid', () => {
  assert.equal(resolveTimeZoneOffset({
    offset: 8,
    zone: 'Invalid/Zone',
    locale: 'zh-CN',
  }, new Date('2026-06-15T12:00:00.000Z')), 8)
})

test('isValidTimeZone accepts real IANA zones and rejects invalid ones', () => {
  assert.equal(isValidTimeZone('America/New_York'), true)
  assert.equal(isValidTimeZone('Asia/Shanghai'), true)
  assert.equal(isValidTimeZone('Invalid/Zone'), false)
})

test('fromTimeZoneLocalDate converts local wall clock time to the target timezone instant', () => {
  const summer = fromTimeZoneLocalDate({
    offset: -8,
    zone: 'America/Los_Angeles',
    locale: 'en-US',
  }, new Date(2026, 5, 15, 12, 0, 0, 0))

  const winter = fromTimeZoneLocalDate({
    offset: -8,
    zone: 'America/Los_Angeles',
    locale: 'en-US',
  }, new Date(2026, 0, 15, 12, 0, 0, 0))

  assert.equal(new Date(summer).toISOString(), '2026-06-15T19:00:00.000Z')
  assert.equal(new Date(winter).toISOString(), '2026-01-15T20:00:00.000Z')
})

test('toTimeZoneLocalDate exposes the wall clock values of the target timezone', () => {
  const localDate = toTimeZoneLocalDate({
    offset: -5,
    zone: 'America/New_York',
    locale: 'en-US',
  }, new Date('2026-06-15T16:30:45.000Z'))

  assert.equal(localDate.getFullYear(), 2026)
  assert.equal(localDate.getMonth(), 5)
  assert.equal(localDate.getDate(), 15)
  assert.equal(localDate.getHours(), 12)
  assert.equal(localDate.getMinutes(), 30)
  assert.equal(localDate.getSeconds(), 45)
})

test('fromTimeZoneLocalDate ignores hooked Date getters and keeps using native date parts', () => {
  const rawParsedDate = new Date('5/30/2026, 8:07:07 AM')
  const restore = [
    ['getFullYear', Date.prototype.getFullYear],
    ['getMonth', Date.prototype.getMonth],
    ['getDate', Date.prototype.getDate],
    ['getHours', Date.prototype.getHours],
    ['getMinutes', Date.prototype.getMinutes],
    ['getSeconds', Date.prototype.getSeconds],
    ['getMilliseconds', Date.prototype.getMilliseconds],
  ]

  try {
    Date.prototype.getFullYear = () => 2026
    Date.prototype.getMonth = () => 4
    Date.prototype.getDate = () => 29
    Date.prototype.getHours = () => 17
    Date.prototype.getMinutes = () => 7
    Date.prototype.getSeconds = () => 7
    Date.prototype.getMilliseconds = () => 0

    const converted = fromTimeZoneLocalDate({
      offset: -7,
      zone: 'America/Los_Angeles',
      locale: 'en-US',
    }, rawParsedDate)

    assert.equal(new Date(converted).toISOString(), '2026-05-30T15:07:07.000Z')
  } finally {
    for (const [key, value] of restore) {
      Date.prototype[key] = value
    }
  }
})

test('getTimeZoneDisplayInfo marks DST-sensitive zones with seasonal labels', () => {
  const summerInfo = getTimeZoneDisplayInfo({
    offset: -8,
    zone: 'America/Los_Angeles',
    locale: 'en-US',
  }, new Date('2026-06-15T12:00:00.000Z'))

  const winterInfo = getTimeZoneDisplayInfo({
    offset: -8,
    zone: 'America/Los_Angeles',
    locale: 'en-US',
  }, new Date('2026-01-15T12:00:00.000Z'))

  const stableInfo = getTimeZoneDisplayInfo({
    offset: 8,
    zone: 'Asia/Shanghai',
    locale: 'zh-CN',
  }, new Date('2026-06-15T12:00:00.000Z'))

  assert.deepEqual(summerInfo, { offset: -7, season: 'daylight' })
  assert.deepEqual(winterInfo, { offset: -8, season: 'standard' })
  assert.deepEqual(stableInfo, { offset: 8, season: null })
})
