// 线性同余（待修改）
const seededRandom = function(seed, max, min) {
  max = max || 1;
  min = min || 0;
  seed = (seed * 9301 + 49297) % 233280;
  var rnd = seed / 233280.0;
  return min + rnd * (max - min);
};

const hashString = function (str, max) {
  let hashCode = 0;
  for (let i = 0; i < str.length; i++) {
    hashCode = 37 * hashCode + str.charCodeAt(i); 
  }
  return max ? hashCode % max : hashCode;
}

const randInt = function (from, to) {
  return Math.floor(Math.random() * (to - from)) + from;
}

const gcd = function(a, b) {
  if (b === 0) return a;
  return gcd(b, a % b);
}
const reduce = function(a, b) {
  let g = gcd(a, b);
  return [a / g, b / g];
}
const ratio = function (x1, y1, x2, y2) {
  // x1 * y2 = x2 * y1
  if(!x2)return x1 * y2 / y1;
  else if(!y2)return x2 * y1 / x1;
  return 0;
}



const randomLanguage = function(seed) {
  let arr = navigator.languages;
  return arr[seed % arr.length];
}

const platforms = [
  'Win32', 'Win64',
  'MacIntel', 'MacPPC', 'Mac68K', 
  'Linux i686', 'Linux x86_64', 'Linux armv7l', 'Linux armv8l',
  'iPhone', 'iPad', 'iPod',
]
const randomPlatform = function (seed) {
  return platforms[seed % platforms.length];
}

const hardwareConcurrencys = [4, 8, 12, 16]
const randomHardwareConcurrency = function (seed) {
  return hardwareConcurrencys[seed % hardwareConcurrencys.length];
}

const appVersions = [
  '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36 Edg/92.0.902.55',
  '5.0 (Linux; Android 11; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36 EdgA/90',
  '5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Mobile/15E148 Safari/604.1 EdgiOS/46',
  '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.203',
  '5.0 (Macintosh; Intel Mac OS X 11_4) AppleWebKit/537. (KHTML, like Gecko) Chrome/92 Safari/537.36 Edg/115.0.1901.203',
  '5.0 (Linux; Android 11; Pixel 4a) AppleWebKit/537. (KHTML, like Gecko) Chrome/91 Mobile Safari/537.36 Edg/115.0.1901.202',
  '5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605. (KHTML, like Gecko) CriOS/87 Mobile/15E148 Safari/604.22 Edg/115.0.1901.200',
  '5.0 (X11; Linux x86_64) AppleWebKit/537. (KHTML, like Gecko) Chrome/90 Safari/537.36 Edg/115.0.1901.201'
];
const randomAppVersion = function(seed) {
  return appVersions[seed % appVersions.length];
}

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36 Edg/92.0.902.55',
  'Mozilla/5.0 (Linux; Android 11; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36 EdgA/90',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Mobile/15E148 Safari/604.1 EdgiOS/46',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 11; Pixel 4a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/87 Mobile/15E148 Safari/604.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.203'
]
const randomUserAgent = function (seed) {
  return userAgents[seed % userAgents.length];
}

const colorDepths = [16, 24, 32]
const randomColorDepth = function (seed) {
  return colorDepths[seed % colorDepths.length];
}

const pixelDepths = [16, 24, 32]
const randomPixelDepth = function (seed) {
  return pixelDepths[seed % pixelDepths.length];
}

// 保持宽高比
let aspect;
let mw;
let mh;
const randomWidth = function (seed) {
  if(!aspect){
    aspect = reduce(screen.width, screen.height);
    let offset = Math.floor(seededRandom(seed, -30, 30));
    mw = screen.width + offset;
    return mw;
  }else{
    return parseInt(ratio(aspect[0], aspect[1], null, mh));
  }
}
const randomHeight = function (seed) {
  if(!aspect){
    aspect = reduce(screen.width, screen.height);
    let offset = Math.floor(seededRandom(seed, -30, 30));
    mh = screen.height + offset;
    return mh;
  }else{
    return parseInt(ratio(aspect[0], aspect[1], mw, null));
  }
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
/**
 * canvas噪音
 * @param {number} seed 
 */
const randomNoise = function (seed) {
  let noise = "";
  for (let i = 0; i < 10; i++) {
    let index = Math.floor(seededRandom(seed, 0, chars.length));
    noise += chars[index];
    ++seed;
  }
  return noise;
}

/**
 * audio噪音
 * @param {number} seed 
 * @returns {number}
 */
const randomAudioNoise = function (seed) {
  // let noise = [];
  // for (let i = 0; i < 20; i++) {
  //   noise.push(seededRandom(seed + i))
  // }
  // return noise;
  return seededRandom(seed)
}

const renderer_webgl_arr = [
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
 * 获取webgl渲染器随机值
 */
const randomWebGLRandom = function (seed) {
  return renderer_webgl_arr[seed % renderer_webgl_arr.length];
}

const getProxyIP = async function () {
  // 获取代理ip
  const data = await fetch('https://api.ipify.org?format=json',{method: 'GET',})
  .then(response => response.json())
  return data.ip
}
