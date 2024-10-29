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
  'ANGLE (NVIDIA GeForce GTX 1650 Direct3D9Ex vs_3_0 ps_3_0)',
  'ANGLE (Intel, Intel(R) UHD Graphics 630 (0x00003E9B) Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (Intel(R) HD Graphics 630 Direct3D11 vs_5_0 ps_5_0)',
  'ANGLE (Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0)',
  "ANGLE (Intel(R) HD Graphics 4400 Direct3D11 vs_5_0 ps_5_0)",
  "ANGLE (Intel(R) HD Graphics 3000 Direct3D11 vs_4_1 ps_4_1)",
  "ANGLE (Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0)",
  "ANGLE (NVIDIA GeForce GTX 560 Ti Direct3D11 vs_5_0 ps_5_0)",
  "ANGLE (NVIDIA GeForce GTS 450 Direct3D11 vs_5_0 ps_5_0)",
  "ANGLE (NVIDIA GeForce GTX 570 Direct3D11 vs_5_0 ps_5_0)",
  "ANGLE (NVIDIA GeForce 210 Direct3D11 vs_4_1 ps_4_1)",
  "ANGLE (NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0)",
  "ANGLE (NVIDIA GeForce GTX 750 Ti Direct3D11 vs_5_0 ps_5_0)",
  "ANGLE (NVIDIA GeForce GTX 960 Direct3D11 vs_5_0 ps_5_0)",
  'ANGLE (NVIDIA GeForce RTX 2070 SUPER Direct3D11 vs_5_0 ps_5_0)',
  "ANGLE (AMD Mobility Radeon HD 5000 Series Direct3D11 vs_5_0 ps_5_0)",
  'ANGLE (AMD Radeon(TM) R5 Graphics Direct3D11 vs_5_0 ps_5_0)',
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
  return seededEl(webglRendererList, seed)
}

export const randomWebglColor = (seed: number) => {
  const str = Array.from({ length: 4 }, (_, i) => seededRandom(seed + i, 0, 1).toFixed(2)).join(',')
  return `vec4(${str})`
}

export const randomWebgNoise = (seed: number): [number, number] => {
  return [seededRandom(seed, 1, -1), seededRandom(seed + 1, 1, -1)]
}