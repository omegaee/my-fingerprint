/**
 * 版本号比较
 * @returns v1大于v2，返回1；v1小于v2，返回-1；v1等于v2，返回0
 */
export const compareVersions = function(v1: string, v2: string): number {
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
 * 生成最大32位的种子
 */
export const genRandomSeed = function () {
  return Math.floor(Math.random() * Math.pow(2, 32))
}

/**
 * 对字符串hash，生成32位种子
 */
export const hashNumber = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
      let char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
  }
  return hash % 2147483647;
}

/**
 * 过滤arr中的undefined和false值
 */
export const arrayFilter = function<T>(arr: (T | undefined | boolean)[]): T[] {
  return arr.filter(item => item !== undefined && item !== false) as T[]
}

/**
 * url转带端口的host
 */
export const urlToHttpHost = function (url: string) {
  try {
    let _url = new URL(url);
    if(_url.protocol === 'http:' || _url.protocol === 'https:'){
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