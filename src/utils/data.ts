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
const equipmentInfos: EquipmentInfo[] = [
  {
    platform: 'MacIntel',
    appVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Safari/605.1.15',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Safari/605.1.15',
  },
  {
    platform: 'Win32',
    appVersion: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  },
  {
    platform: 'MacIntel',
    appVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
  },
  {
    platform: 'Win32',
    appVersion: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3 Edge/16.16299',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3 Edge/16.16299',
  },
  {
    platform: 'Linux armv8l',
    appVersion: '5.0 (Linux; Android 9; SM-G950F Build/PPR1.180610.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.101 Mobile Safari/537.36',
    userAgent: 'Mozilla/5.0 (Linux; Android 9; SM-G950F Build/PPR1.180610.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.101 Mobile Safari/537.36',
  },
  {
    platform: 'MacIntel',
    appVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36 OPR/70.0.3728.71',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36 OPR/70.0.3728.71',
  },
  {
    platform: 'Win32',
    appVersion: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3 OPR/44.0.2510.1449',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3 OPR/44.0.2510.1449',
  },
  {
    platform: 'MacIntel',
    appVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_6) Gecko/20100101 Firefox/80.0',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) Gecko/20100101 Firefox/80.0',
  },
  {
    platform: 'Linux x86_64',
    appVersion: '5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3 Edge/16.16299',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3 Edge/16.16299',
  },
  {
    platform: 'Win32',
    appVersion: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3 OPR/44.0.2510.1449',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3 OPR/44.0.2510.1449',
  },
  {
    platform: 'MacIntel',
    appVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36 Edg/85.0.564.51',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36 Edg/85.0.564.51',
  },
]
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
 * 随机设备信息
 */
export const randomEquipmentInfo = (seed: number): EquipmentInfo => {
  return seededEl(equipmentInfos, seed)
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