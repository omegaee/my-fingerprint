const _Date = Date;
const _DateTimeFormat = Intl.DateTimeFormat;

/**
 * 创建时区偏移量格式化器
 * @example
 * const fmt = createLongOffsetFormatter('Asia/Shanghai')
 * fmt() // GMT+08:00
 */
export const createLongOffsetFormatter = (timeZone: string): undefined | ((d?: Date) => string | undefined) => {
  try {
    const formatter = new _DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    });
    return (d?: Date) => {
      const parts = formatter.formatToParts(d ?? new _Date());
      return parts.find(p => p.type === 'timeZoneName')?.value;
    }
  } catch (e) { }
}

/**
 * 获取时区偏移量
 * @returns "GMT+05:30", "GMT-04:00"
 */
export const timeZoneToLongOffset = (timeZone: string, date?: Date): string | undefined => {
  return createLongOffsetFormatter(timeZone)?.(date)
}

/**
 * 将 longOffset 转换为 ms
 */
export function longOffsetToMs(offsetStr: string) {
  const sign = offsetStr[3] === '+' ? 1 : -1;
  const [hours, minutes] = offsetStr.slice(4).split(':').map(Number);
  return sign * (hours * 60 + minutes) * 60 * 1000;
}

/**
 * 将 longOffset 转换为可读格式
 */
export function longOffsetToReadable(offsetStr: string) {
  return offsetStr.slice(3)
}

/**
 * 判断时区是否处于夏令时
 */
export function isCurrentlyDST(timeZone: string): boolean {
  const fmt = createLongOffsetFormatter(timeZone);
  if (!fmt) return false;

  const year = new Date().getUTCFullYear();

  // 收集全年偏移量
  const offsets = new Set<number>();
  for (let m = 0; m < 12; m++) {
    const date = new Date(Date.UTC(year, m, 1, 12));
    const tzName = fmt(date);
    if (tzName) offsets.add(longOffsetToMs(tzName));
  }

  // 当前偏移量
  const nowTzName = fmt(new Date());
  const currentOffset = nowTzName ? longOffsetToMs(nowTzName) : 0;

  const minOffset = Math.min(...offsets);
  return currentOffset > minOffset;
}