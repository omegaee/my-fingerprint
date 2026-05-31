const OFFSET_NAME_PATTERN = /^GMT(?:(?<sign>[+-])(?<hours>\d{1,2})(?::(?<minutes>\d{2}))?)?$/

type TimeZoneLike = Pick<TimeZoneInfo, 'offset' | 'zone'>
type PartMap = Record<string, string>
type TimeZoneSeason = 'daylight' | 'standard' | null

const NativeDate = Date
const NativeIntlDateTimeFormat = Intl.DateTimeFormat
const nativeDateUtc = NativeDate.UTC
const nativeGetFullYear = NativeDate.prototype.getFullYear
const nativeGetMonth = NativeDate.prototype.getMonth
const nativeGetDate = NativeDate.prototype.getDate
const nativeGetHours = NativeDate.prototype.getHours
const nativeGetMinutes = NativeDate.prototype.getMinutes
const nativeGetSeconds = NativeDate.prototype.getSeconds
const nativeGetMilliseconds = NativeDate.prototype.getMilliseconds

const formatOffsetIdentifier = (offset: number) => {
  const totalMinutes = Math.round(offset * 60)
  const sign = totalMinutes >= 0 ? '+' : '-'
  const absoluteMinutes = Math.abs(totalMinutes)
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, '0')
  const minutes = String(absoluteMinutes % 60).padStart(2, '0')
  return `${sign}${hours}:${minutes}`
}

const parseOffsetName = (value?: string) => {
  if (!value || value === 'GMT' || value === 'UTC') {
    return 0
  }

  const match = value.match(OFFSET_NAME_PATTERN)
  if (!match?.groups) {
    return null
  }

  const sign = match.groups.sign === '-' ? -1 : 1
  const hours = Number(match.groups.hours ?? '0')
  const minutes = Number(match.groups.minutes ?? '0')
  return sign * (hours + (minutes / 60))
}

const partsToMap = (parts: Intl.DateTimeFormatPart[]) => parts.reduce<PartMap>((acc, part) => {
  acc[part.type] = part.value
  return acc
}, {})

export const isValidTimeZone = (zone?: string | null): zone is string => {
  const value = zone?.trim()
  if (!value) {
    return false
  }

  try {
    new NativeIntlDateTimeFormat('en-US', { timeZone: value })
    return true
  } catch {
    return false
  }
}

export const resolveTimeZoneName = (info: TimeZoneLike) => {
  const zone = info.zone?.trim()
  return isValidTimeZone(zone) ? zone : formatOffsetIdentifier(info.offset)
}

export const resolveTimeZoneOffset = (
  info: TimeZoneLike,
  date = new NativeDate(),
) => {
  const formatter = new NativeIntlDateTimeFormat('en-US', {
    timeZone: resolveTimeZoneName(info),
    timeZoneName: 'longOffset',
  })
  const timeZoneName = formatter
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')
    ?.value

  return parseOffsetName(timeZoneName) ?? info.offset
}

export const getTimeZoneDisplayInfo = (
  info: TimeZoneLike,
  date = new NativeDate(),
): { offset: number, season: TimeZoneSeason } => {
  const offset = resolveTimeZoneOffset(info, date)
  const year = nativeGetFullYear.call(date)
  const observedOffsets = new Set<number>()

  for (let month = 0; month < 12; month += 1) {
    observedOffsets.add(
      resolveTimeZoneOffset(info, new NativeDate(nativeDateUtc(year, month, 1, 12, 0, 0, 0)))
    )
  }

  if (observedOffsets.size <= 1) {
    return { offset, season: null }
  }

  const standardOffset = Math.min(...observedOffsets)
  return {
    offset,
    season: offset > standardOffset ? 'daylight' : 'standard',
  }
}

export const getTimeZoneDateParts = (
  info: TimeZoneLike,
  date: Date,
  options: Intl.DateTimeFormatOptions,
) => {
  const formatter = new NativeIntlDateTimeFormat('en-US', {
    ...options,
    timeZone: resolveTimeZoneName(info),
  })
  return partsToMap(formatter.formatToParts(date))
}

export const toTimeZoneLocalDate = (
  info: TimeZoneLike,
  date: Date,
) => {
  const parts = getTimeZoneDateParts(info, date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false,
  })

  return new NativeDate(
    Number(parts.year ?? '0'),
    Number(parts.month ?? '1') - 1,
    Number(parts.day ?? '1'),
    Number(parts.hour ?? '0'),
    Number(parts.minute ?? '0'),
    Number(parts.second ?? '0'),
    Number(parts.fractionalSecond ?? '0'),
  )
}

export const fromTimeZoneLocalDate = (
  info: TimeZoneLike,
  date: Date,
) => {
  const baseUtcMs = nativeDateUtc(
    nativeGetFullYear.call(date),
    nativeGetMonth.call(date),
    nativeGetDate.call(date),
    nativeGetHours.call(date),
    nativeGetMinutes.call(date),
    nativeGetSeconds.call(date),
    nativeGetMilliseconds.call(date),
  )

  let utcMs = baseUtcMs
  for (let index = 0; index < 4; index += 1) {
    const offset = resolveTimeZoneOffset(info, new NativeDate(utcMs))
    const nextUtcMs = baseUtcMs - (offset * 60 * 60 * 1000)
    if (nextUtcMs === utcMs) {
      return utcMs
    }
    utcMs = nextUtcMs
  }

  return utcMs
}
