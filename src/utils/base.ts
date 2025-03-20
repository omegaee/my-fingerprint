import { seededRandom } from "./data";

/**
 * 版本号比较
 * @returns v1大于v2，返回1；v1小于v2，返回-1；v1等于v2，返回0
 */
export const compareVersions = function (v1: string, v2: string): -1 | 0 | 1 {
  const v1parts = v1.split('.').map(Number);
  const v2parts = v2.split('.').map(Number);

  for (let i = 0; i < v1parts.length; ++i) {
    if (v2parts.length === i) {
      return 1;
    }
    if (v1parts[i] === v2parts[i]) {
      continue;
    }
    if (v1parts[i] > v2parts[i]) {
      return 1;
    }
    return -1;
  }

  if (v1parts.length !== v2parts.length) {
    return -1;
  }

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

/**
 * url转带端口的host
 */
export const urlToHttpHost = function (url: string) {
  try {
    let _url = new URL(url);
    if (_url.protocol !== 'http:' && _url.protocol !== 'https:') {
      return undefined
    }
    let hostname = _url.hostname
    let port = _url.port
    if (port === "") {
      if (_url.protocol === "http:") {
        port = "80";
      } else if (_url.protocol === "https:") {
        port = "443";
      }
    }
    return `${hostname}:${port}`
  } catch (err) {
    return undefined
  }
}

export const urlToHostname = (url: string) => {
  try {
    let _url = new URL(url);
    return _url.hostname
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