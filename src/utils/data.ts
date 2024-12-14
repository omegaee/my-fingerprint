/**
 * 线性同余，根据seed产生随机数
 */
export const seededRandom = function (seed: number, max?: number, min?: number) {
  max = max ?? 1
  min = min ?? 0
  seed = (seed * 9301 + 49297) % 233280
  const rnd = seed / 233280.0
  return min + rnd * (max - min)
}

/**
 * 根据种子随机获取数组中的元素
 */
const seededEl = <T>(arr: Readonly<T[]>, seed: number): T => {
  return arr[seed % arr.length];
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const hardwareConcurrencys = [8, 12, 16]
const colorDepths = [16, 24, 32]
const pixelDepths = [16, 24, 32]

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
 * 随机逻辑处理器数量
 */
export const randomHardwareConcurrency = (seed: number) => {
  return seededEl(hardwareConcurrencys, seed)
}

/**
 * 随机颜色深度
 */
export const randomColorDepth = (seed: number) => {
  return seededEl(colorDepths, seed)
}

/**
 * 随机位深度
 */
export const randomPixelDepth = (seed: number) => {
  return seededEl(pixelDepths, seed)
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
 * 随机音频噪音
 */
export const randomAudioNoise = (seed: number) => {
  return seededRandom(seed)
}

/**
 * 获取[x, y]，区间[-1, 1]
 */
export const randomWebgNoise = (seed: number): [number, number] => {
  return [seededRandom(seed, 1, -1), seededRandom(seed + 1, 1, -1)]
}