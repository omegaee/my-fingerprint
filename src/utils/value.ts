export const platforms = [
  'Win32', 'Win64',
  'MacIntel', 'MacPPC', 'Mac68K', 
  'Linux i686', 'Linux x86_64', 'Linux armv7l', 'Linux armv8l',
  'iPhone', 'iPad', 'iPod',
]
export const randomPlatform = function (seed: number) {
  return platforms[seed % platforms.length];
}

export const timeZoneOptions: TimeZoneInfo[] = [
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