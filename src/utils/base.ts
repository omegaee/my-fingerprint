/**
 * 线性同余，根据seed产生随机数
 */
export const seededRandom = function (seed: number | string, max: number = 1, min: number = 0): number {
  if (typeof seed === 'string') {
    seed = hashNumberFromString(seed);
  }
  const mod = 233280;
  seed = (seed * 9301 + 49297) % mod;
  if (seed < 0) seed += mod; // 确保 seed 为正数
  const rnd = seed / mod;
  return min + rnd * (max - min);
}

/**
 * 根据种子随机获取数组中的元素
 */
export const seededEl = <T>(arr: Readonly<T[]>, seed: number): T => {
  return arr[seed % arr.length];
}

/**
 * 数组洗牌
 */
export const shuffleArray = <T>(array: Readonly<T[]>, seed: number): T[] => {
  const _array = [...array];
  let m = _array.length, t: T, i: number;

  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  while (m) {
    i = Math.floor(random() * m--);
    t = _array[m];
    _array[m] = _array[i];
    _array[i] = t;
  }

  return _array;
}

/**
 * 版本号比较
 * @returns v1大于v2，返回1；v1小于v2，返回-1；v1等于v2，返回0
 */
export const compareVersions = function (v1: string, v2: string): -1 | 0 | 1 {
  const parse = (v: string) => {
    const [main, pre = ''] = v.split('-');
    const parts = main.split('.').map(n => parseInt(n, 10));
    return { parts, pre };
  };

  const { parts: p1, pre: pre1 } = parse(v1);
  const { parts: p2, pre: pre2 } = parse(v2);
  const maxLen = Math.max(p1.length, p2.length);

  for (let i = 0; i < maxLen; i++) {
    const a = p1[i] ?? 0;
    const b = p2[i] ?? 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }

  if (pre1 && !pre2) return -1; // 预发布版本 < 正式版本
  if (!pre1 && pre2) return 1;
  if (pre1 && pre2) return pre1.localeCompare(pre2) as -1 | 0 | 1;

  return 0;
}

/**
 * 生成随机的种子
 */
export const genRandomSeed = function () {
  return Math.floor(seededRandom(Math.random() * 1e6, Number.MAX_SAFE_INTEGER, 1))
}

/**
 * 字符串的number类型hash
 */
export const hashNumberFromString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    let char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % Number.MAX_SAFE_INTEGER);
}

/**
 * 过滤arr中的undefined和false值
 */
export const arrayFilter = function <T>(arr: (T | undefined | boolean)[]): T[] {
  return arr.filter(item => item !== undefined && item !== false) as T[]
}

export const tryUrl = (url: string) => {
  try {
    return new URL(url);
  } catch (err) {
    return undefined
  }
}

/**
 * 版本号随机偏移
 * @param sourceVersion 源版本号
 * @param seed 种子
 * @param maxSubVersionNumber 最大子版本数量 
 * @param mainVersionOffset 最大主版本号偏移
 * @param subVersionOffset 最大子版本号偏移
 * @returns 
 */
export const versionRandomOffset = (sourceVersion: string, seed: number, maxSubVersionNumber?: number, maxMainVersionOffset?: number, maxSubVersionOffset?: number): string => {
  // 将源版本号分解为主版本号和子版本号
  const [mainVersion, ...subversions] = sourceVersion.split('.')
  if (mainVersion === undefined) return sourceVersion
  let nMainVersion = Number(mainVersion)
  if (Number.isNaN(nMainVersion)) return sourceVersion

  maxMainVersionOffset = maxMainVersionOffset ?? 2
  maxSubVersionOffset = maxSubVersionOffset ?? 50
  maxSubVersionNumber = maxSubVersionNumber ?? subversions.length

  nMainVersion += (seed % ((maxMainVersionOffset * 2) + 1)) - maxMainVersionOffset;

  const nSubversions: string[] = []
  for (let i = 0; i < maxSubVersionNumber; i++) {
    const subversion = subversions[i]
    let nSubversion = Number(subversion)
    if (Number.isNaN(nSubversion)) {
      nSubversions.push(subversion)
      continue
    }
    const ss = Math.floor(seededRandom(seed + i, -maxSubVersionOffset, maxSubVersionOffset))
    nSubversion = Math.abs((nSubversion ?? 0) + ss)
    nSubversions.push(nSubversion.toString())
  }

  // 将主版本号和子版本号重新组合成完整的版本号
  return [nMainVersion, ...nSubversions].join('.');
}

/**
 * 获取主要版本号
 */
export const getMainVersion = (sourceVersion: string) => {
  return sourceVersion.split('.')[0]
}

/**
 * 向上取10的幂次
 */
const getNextPowerOfTen = (num: number) => {
  if (num === 0) return 0;
  else if (num === 1) return 10;

  if (num < 0) num = -num;
  return Math.pow(10, Math.ceil(Math.log10(num)));
}

/**
 * 随机子版本号（同一sourceVersion多次调用结果一致）
 */
export const subversionRandom = (
  seed: number,
  sourceVersion: string,
  maxSegments?: number,
  majorFallbackRange: number = 0,
): FullVersion => {
  let [major, ...sublist] = sourceVersion.split('.')
  if (majorFallbackRange > 0) {
    let _major = Number(major)
    major = !isNaN(_major) && _major >= majorFallbackRange ? String(Math.floor(seededRandom(seed, _major, _major - 10))) : major
  }
  if (sublist.length === 0) return { major, full: major };

  maxSegments = maxSegments ?? sublist.length
  const nSublist: string[] = []

  for (let i = 0; i < maxSegments; i++) {
    const sub = Number(sublist[i])
    if (isNaN(sub)) {
      nSublist.push(sublist[i])
      continue
    }
    const next = getNextPowerOfTen(sub)
    const ss = Math.floor(seededRandom(seed + i, next, 0))
    nSublist.push(ss.toString())
  }

  return {
    major,
    full: [major, ...nSublist].join('.')
  };
}

/**
 * 深度代理
 */
export const deepProxy = <T>(obj: T, handler: ProxyHandler<any>, seen = new WeakMap<any>()): T => {
  if (seen.has(obj)) { return seen.get(obj) }
  const proxy = new Proxy(obj, {
    get(target, property, receiver) {
      const value = target[property];
      if (typeof value === 'object' && value !== null) {
        return deepProxy(value, handler);
      }
      return handler.get ? handler.get(target, property, receiver) : value;
    },
    set: handler.set,
  });
  seen.set(obj, proxy);
  return proxy;
}

/**
 * 是否存在父域名或自身
 * @param src 子域名 
 */
export const existParentDomain = (domains: string[], src: string) => {
  if (!src) return false;
  if (!domains?.length) return false;
  src = '.' + src
  return domains.some((v) => src.endsWith('.' + v))
}

/**
 * 是否存在子域名或自身
 * @param src 父域名
 */
export const existChildDomain = (domains: string[], src: string) => {
  if (!src) return false;
  if (!domains?.length) return false;
  src = '.' + src
  return domains.some((v) => ('.' + v).endsWith(src))
}

/**
 * 查找子域名和自身
 * @param src 父域名
 */
export const selectChildDomains = (domains: string[], src: string) => {
  if (!src) return []
  if (!domains?.length) return []
  src = '.' + src
  const list: string[] = []
  for (const domain of domains) {
    if (('.' + domain).endsWith(src)) list.push(domain);
  }
  return list
}

/**
 * 查找父域名和自身
 * @param src 子域名 
 */
export const selectParentDomains = (domains: string[], src: string) => {
  if (!src) return []
  if (!domains?.length) return []
  src = '.' + src
  const list: string[] = []
  for (const domain of domains) {
    if (src.endsWith('.' + domain)) list.push(domain);
  }
  return list
}

/**
 * 对象提取值
 */
export const pick = <T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> => {
  const res = {} as Pick<T, K>;
  for (const key of keys) {
    res[key] = obj[key];
  }
  return res;
}