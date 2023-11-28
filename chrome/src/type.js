const Mode = {
  enable: '0',
  seed: '1',
  config: '2',
  basic: 'a',
  special: 'b',
}

const Config = {
  proxyNavigator: 0,
  proxyScreen: 1,
}

const SelectOpt = {
  default: {k: '0', v: "系统值"},
  page: {k: '1', v: "根据标签页随机"},
  browser: {k: '2', v: "每次启动浏览器随机"},
  domain: {k: '3', v: "根据域名随机"},
}

const timeOpt = [
  {
    text: '上海',
    zone: 'Asia/Shanghai',
    locale: 'zh-CN',
    offset: +8
  },{
    text: '纽约',
    zone: 'America/New_York',
    locale: 'en-US',
    offset: -5
  },{
    text: '伦敦',
    zone: 'Europe/London',
    locale: 'en-GB',
    offset: 0
  },{
    text: '巴黎',
    zone: 'Europe/Paris',
    locale: 'fr-FR',
    offset: +1
  },{
    text: '东京',
    zone: 'Asia/Tokyo',
    locale: 'ja-JP',
    offset: +9
  },{
    text: '迪拜',
    zone: 'Asia/Dubai',
    locale: 'ar-AE',
    offset: +4
  },{
    text: '首尔',
    zone: 'Asia/Seoul',
    locale: 'ko-KR',
    offset: +9
  },{
    text: '曼谷',
    zone: 'Asia/Bangkok',
    locale: 'th-TH',
    offset: +7
  },{
    text: '雅加达',
    zone: 'Asia/Jakarta',
    locale: 'id-ID',
    offset: +7
  },
]


const BasicConf = {
  language: 0,
  platform: 1,
  hardwareConcurrency: 2,
  appVersion: 3,
  userAgent: 4,

  height: 10,
  width: 11,
  colorDepth: 12,
  pixelDepth: 13,
}

const SpecialConf = {
  languages: 20,
  canvas: 21,
  timezone: 22,
  audio: 23,
}