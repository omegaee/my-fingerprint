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

const webglRendererList = [
  'ANGLE (NVIDIA GeForce GTX 1050 Ti Direct3D11 vs_5_0 ps_5_0)',
  'ANGLE (Intel(R) HD Graphics 630 Direct3D11 vs_5_0 ps_5_0)',
  'ANGLE (Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0)',
  'ANGLE (AMD Radeon(TM) R5 Graphics Direct3D11 vs_5_0 ps_5_0)',
  'ANGLE (NVIDIA GeForce RTX 2070 SUPER Direct3D11 vs_5_0 ps_5_0)',
  'ANGLE (Intel, Intel(R) UHD Graphics 630 (0x00003E9B) Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'Mesa DRI Intel(R) HD Graphics 5500 (Broadwell GT2)',
  'Mesa DRI Intel(R) UHD Graphics 630 (Coffeelake 3x8 GT2)',
  'Mesa DRI Intel(R) Iris(R) Plus Graphics 640 (Kaby Lake GT3e)',
  'AMD Radeon Pro 5300M OpenGL Engine',
  'Intel(R) Iris(R) Plus Graphics OpenGL Engine',
]

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

/**
 * 随机语言标识
 */
export const randomLanguage = (seed: number) => {
  return seededEl(navigator.languages, seed)
}

/**
 * 随机逻辑处理器数量
 */
export const randomHardwareConcurrency =  (seed: number) => {
  return seededEl(hardwareConcurrencys, seed)
}

/**
 * 随机颜色深度
 */
export const randomColorDepth =  (seed: number) => {
  return seededEl(colorDepths, seed)
}

/**
 * 随机位深度
 */
export const randomPixelDepth =  (seed: number) => {
  return seededEl(pixelDepths, seed)
}

/**
 * 随机canvas噪音
 */
export const randomCanvasNoise = (seed: number) => {
  let noise = "";
  for (let i = 0; i < 10; i++) {
    let index = Math.floor(seededRandom(seed++, 0, chars.length));
    noise += chars[index];
  }
  return noise;
}

/**
 * 随机音频噪音
 */
export const randomAudioNoise = (seed: number) => {
  return seededRandom(seed)
}

export const randomWebglRander = (seed: number) => {
  return seededEl(webglRendererList, seededRandom(seed))
}