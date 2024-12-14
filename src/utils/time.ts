type TimeParts = Partial<Record<keyof Intl.DateTimeFormatPartTypesRegistry, string>>
const RawDTFormat = Intl.DateTimeFormat
const RawDate = Date

/**
 * 获取时间片段
 */
export const getStandardDateTimeParts = (date: Date, timezone?: string): TimeParts => {
  const parst = new RawDTFormat('en-US', {
    timeZone: timezone ?? 'Asia/Shanghai',
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false,
    timeZoneName: 'longOffset',
  }).formatToParts(date ?? new RawDate())
  return parst.reduce((acc: TimeParts, cur) => {
    acc[cur.type] = cur.value
    return acc
  }, {})
}