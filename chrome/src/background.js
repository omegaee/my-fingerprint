const Mode = {
  enable: '0',
  seed: '1',
  config: '2',
  basic: 'a',
  special: 'b',
  ip: 'ip',
}

const Config = {
  proxyNavigator: 0,
  proxyScreen: 1,
}

const Opt = {
  default: '0',
  page: '1',
  browser: '2',
  domain: '3',

  localhost: '10',
  proxy: '11',
}

const Item = {
  language: 0,
  platform: 1,
  hardwareConcurrency: 2,
  appVersion: 3,
  userAgent: 4,

  height: 10,
  width: 11,
  colorDepth: 12,
  pixelDepth: 13,

  languages: 20,
  canvas: 21,
  timezone: 22,
  audio: 23,
  webgl: 24,
  webrtc: 25,
}

/**
 * 各标签页的通知内容
 */
const notify = {}

/**
 * 扩展初始化
 * @param {string} prevVersion 上个版本号
 */
const init = async function (prevVersion) {
  // get data
  const data = await chrome.storage.local.get();
  
  // get manifest
  let manifest = chrome.runtime.getManifest()
  let currVersion = manifest.version  // 扩展当前版本号

  // 若已初始化，跳过
  if(data[`init-${currVersion}`]) return

  // enable
  data[Mode.enable] = data[Mode.enable] ?? true;
  // seed
  data[Mode.seed] = Math.floor(Math.random() * 100000);
  // config
  data[Mode.config] = Object.assign({
    [Config.proxyNavigator]: true,
    [Config.proxyScreen]: true,
  }, data[Mode.config])
  // basic
  data[Mode.basic] = Object.assign({
    [Item.language]: {select: 0, value: Opt.default},
    [Item.platform]: {select: 0, value: Opt.default},
    [Item.hardwareConcurrency]: {select: 0, value: Opt.default},
    [Item.appVersion]: {select: 0, value: Opt.browser},
    [Item.userAgent]: {select: 0, value: Opt.browser},
    [Item.height]: {select: 0, value: Opt.default},
    [Item.width]: {select: 0, value: Opt.default},
    [Item.colorDepth]: {select: 0, value: Opt.default},
    [Item.pixelDepth]: {select: 0, value: Opt.default},
  }, data[Mode.basic])
  // spacial
  data[Mode.special] = Object.assign({
    [Item.languages]: Opt.default,
    [Item.canvas]: Opt.page,
    [Item.audio]: Opt.page,
    [Item.webgl]: Opt.page,
    [Item.timezone]: -1,
    [Item.webrtc]: Opt.default,
  }, data[Mode.special])
  // 获取ip
  rePubIP()
  // save
  chrome.storage.local.set(data);
  chrome.storage.local.set({[`init-${currVersion}`]: true})  // 初始化成功标志
  if(prevVersion)chrome.storage.local.remove(`init-${prevVersion}`)
}

/**
 * 初次启动扩展时触发（浏览器更新、扩展更新也触发）
 * @param {'install' || 'update' || 'chrome_update' } reason 操作
 * @param {string} previousVersion 上个版本号
 */
chrome.runtime.onInstalled.addListener(({reason, previousVersion}) => {
  init(previousVersion);
});

/**
 * 重启浏览器触发
 */
chrome.runtime.onStartup.addListener(() => {
  // seed
  chrome.storage.local.set({
    [Mode.seed]: Math.floor(Math.random() * 100000)
  });
  // 获取ip
  rePubIP()
});

let isGettingIP = false
/**
 * 重新获取公网ip并存储
 */
const rePubIP = function () {
  if(isGettingIP)return
  isGettingIP = true
  fetch('https://api.ipify.org?format=json',{method: 'GET',})
  .then(response => response.json())
  .then((data) => {
    if(!data.ip)return
    chrome.storage.local.set({
      [Mode.ip]: data.ip
    });
  })
  .finally(() => {
    isGettingIP = false
  })
}

/**
 * tab每次加载触发
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab)=> {
  if (changeInfo.status == 'loading') {
    // notify
    delete notify[tabId];
    chrome.action.setBadgeText({tabId, text: ''});
  }
});

/**
 * 监听tab关闭
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  delete notify[tabId];
})

/**
 * 监听扩展消息
 */
chrome.runtime.onMessage.addListener((data, sender)=>{
  switch(data.type){
    case 'notify':
      handleNotify(sender.tab.id, data.value)
      break
    case 're-ip':
      rePubIP()
      break
    default: return
  }
})

const bgColorMap = {
  'low': '#7FFFD4',
  'high': '#F4A460',
}
const fontColorMap = {
  'record': '#FFF',
}

/**
 * 处理可疑记录
 * @param {number} tabId 
 * @param {{total: number, stotal: number, seed: number}} data 
 */
const handleNotify = function (tabId, data) {
  let total = 0;
  let stotal = 0;
  let tabData = notify[tabId];
  if(tabData){
    tabData[data.seed] = {total: data.total, stotal: data.stotal};
    for(let k in tabData){
      let d = tabData[k]
      total += d.total;
      stotal += d.stotal;
    }
  } else {
    total = data.total
    stotal = data.stotal
    notify[tabId] = {[data.seed]: { total, stotal }}
  }
  let showTotal = stotal > 0 ? stotal : total
  let showColor = bgColorMap[stotal > 0 ? 'high' : 'low']
  showTotalStr = showTotal > 99 ? '99+' : showTotal.toString()

  chrome.action.setBadgeText({tabId, text: showTotalStr});
  // chrome.action.setBadgeTextColor({tabId, color: getFontColor(showColor)});
  chrome.action.setBadgeBackgroundColor({tabId, color: showColor});
}