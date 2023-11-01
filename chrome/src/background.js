const init = async function () {
  const dataPromise = chrome.storage.local.get();
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
  const Opt = {
    default: '0',
    page: '1',
    browser: '2',
    domain: '3',

    empty: '10',
    current: '11',
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
  }

  let isUpdateData = false;

  // get data
  const data = await dataPromise;
  // enable
  if(data[Mode.enable] == undefined){
    data[Mode.enable] = true;
    isUpdateData = true;
  }
  // seed
  if(data[Mode.seed] == undefined){
    data[Mode.seed] = Math.floor(Math.random() * 100000);
    isUpdateData = true;
  }
  // config
  if(!data[Mode.config]){
    data[Mode.config] = {
      [Config.proxyNavigator]: true,
      [Config.proxyScreen]: true,
    }
    isUpdateData = true;
  }
  // basic
  if(!data[Mode.basic]){
    data[Mode.basic] = {
      [Item.language]: {select: 0, value: Opt.default},
      [Item.platform]: {select: 0, value: Opt.default},
      [Item.hardwareConcurrency]: {select: 0, value: Opt.default},
      [Item.appVersion]: {select: 0, value: Opt.browser},
      [Item.userAgent]: {select: 0, value: Opt.browser},
      [Item.height]: {select: 0, value: Opt.default},
      [Item.width]: {select: 0, value: Opt.default},
      [Item.colorDepth]: {select: 0, value: Opt.default},
      [Item.pixelDepth]: {select: 0, value: Opt.default},
    }
    isUpdateData = true;
  }
  // spacial
  if(!data[Mode.special]){
    data[Mode.special] = {
      [Item.languages]: Opt.default,
      [Item.canvas]: Opt.page,
      [Item.timezone]: -1,
    }
    isUpdateData = true;
  }
  if(isUpdateData)chrome.storage.local.set(data);
}


/**
 * 初次启动扩展时触发（浏览器更新、扩展更新也触发）
 */
chrome.runtime.onInstalled.addListener(() => {
  init();
});

/**
 * 重启浏览器触发
 */
chrome.runtime.onStartup.addListener(() => {
  init();
});

/**
 * tab每次加载触发
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab)=> {
  if (changeInfo.status == 'loading') {
    // record
    delete data[tabId];
    chrome.action.setBadgeText({tabId, text: ''});
  }
});

// 监听
const data = {}
const getBgColor = function (level) {
  switch(level){
    case 0: return '#7FFFD4';
    case 1: return '#F4A460';
    default: return '#FFFAFA';
  }
}
const getFontColor = function (level) {
  switch(level){
    case 1: return '#FFF';
    case 0:
    default: return '#000';
  }
}
chrome.runtime.onMessage.addListener((msg, sender)=>{
  if(msg.type == 'notify'){
    let tabId = sender.tab.id;

    let total = 0;
    let stotal = 0;
    let sdata = data[tabId];
    if(sdata){
      sdata[msg.seed] = {total: msg.total, stotal: msg.stotal};
      for(let k in sdata){
        let d = sdata[k]
        total += d.total;
        stotal += d.stotal;
      }
    } else {
      total = msg.total;
      stotal = msg.stotal;
      data[tabId] = {[msg.seed]: {total, stotal}}
    }
    let showTotal = stotal > 0 ? stotal : total;
    let showColor = stotal > 0 ? 1 : 0;

    chrome.action.setBadgeText({tabId, text: showTotal.toString()});
    // chrome.action.setBadgeTextColor({tabId, color: getFontColor(showColor)});
    chrome.action.setBadgeBackgroundColor({tabId, color: getBgColor(showColor)});
  }
})