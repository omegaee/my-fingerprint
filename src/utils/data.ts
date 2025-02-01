import { hashNumberFromString } from "./base"

/**
 * 线性同余，根据seed产生随机数
 */
export const seededRandom = function (seed: number | string, max: number = 1, min: number = 0): number {
  if (typeof seed === 'string') {
    seed = hashNumberFromString(seed)
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
  const _array = [...array]
  let m = _array.length, t: T, i: number;

  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  while (m) {
    i = Math.floor(random() * m--);
    t = _array[m];
    _array[m] = _array[i];
    _array[i] = t;
  }

  return _array;
}


/**
 * 随机屏幕宽高信息
 */
export const randomScreenSize = (seed: number): SizeInfo => {
  const offset = (seed % 100) - 50  // 偏移幅度为50
  const rawWidth = screen.width
  const rawHeight = screen.height
  const width = rawWidth + offset
  return {
    width: width,
    height: Math.round((width * rawHeight) / rawWidth),
  }
}

const rawLanguages = navigator.languages

/**
 * 随机语言标识
 */
export const randomLanguage = (seed: number) => {
  return seededEl(rawLanguages, seed)
}

/**
 * 随机语言标识
 */
export const randomLanguages = (seed: number) => {
  return shuffleArray(rawLanguages, seed)
}

/**
 * 随机canvas噪音
 */
export const randomCanvasNoise = (seed: number) => {
  const noise: number[] = []
  for (let i = 0; i < 10; i++) {
    noise.push(Math.floor(seededRandom(seed++, 255, 0)))
  }
  return noise
}

/**
 * 获取[x, y]，区间[-1, 1]
 */
export const randomWebglNoise = (seed: number): [number, number] => {
  return [seededRandom(seed, 1, -1), seededRandom(seed + 1, 1, -1)]
}

/**
 * 获取随机字体噪音 [-2, 2]
 */
export const randomFontNoise = (seed: number, len: number): number => {
  const random = seededRandom(hashNumberFromString(String(seed + len)), 1, 0)
  if (random < 0.9) return 0;
  return (Math.floor(random * 1000) % 5) - 2
}