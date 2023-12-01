// define
const IDENTIFY = 'my-fingerprint'

const navigatorValues = {}
const screenValues = {}
const specialValues = {}

const dataPromise = chrome.storage.local.get();
// 种子
const maxRandom = 0xFFFF;
const pageSeed = randInt(0, maxRandom);
const urlSeed = hashString(window.location.host, maxRandom);
let sessionSeed;

/**
 * 发送消息到inject
 * @param {string} type
 * @param {any} value
 */
const sendToWin = function (type, value) {
  try {
    postMessage({[IDENTIFY]: {type, value}}, location.origin)
  } catch (error) {}
  // postMessage({[IDENTIFY]: {type, value}}, '*')
}

/**
 * 发送消息到扩展
 * @param {string} type
 * @param {any} value
 */
const sendToEx = function (type, value) {
  try {
    chrome.runtime.sendMessage({type, value})
  } catch (error) {}
}

// 监听script
const allRecords = {};
let total = 0;
let stotal = 0;
const initMessageListener = function (config) {

  /**
   * 监听inject
   */
  window.addEventListener('message', (ev) => {
    if(ev.origin != location.origin)return;
    let data = ev.data[IDENTIFY];
    if(!data)return
    switch(data.type){
      case 'init':
        sendInitConfig()
        break
      case 'record': 
        handleRecord(data.value)
        break
      default: return
    }
  });
}

/**
 * 获取Config
 * @returns {{[string|number]: any}}
 */
const getConfig = function () {
  return {
    [Control.navigator]: navigatorValues,
    [Control.screen]: screenValues,
    [SpecialConf.canvas]: specialValues[SpecialConf.canvas],
    [SpecialConf.timezone]: specialValues[SpecialConf.timezone],
    [SpecialConf.audio]: specialValues[SpecialConf.audio],
    [SpecialConf.webgl]: specialValues[SpecialConf.webgl],
    [SpecialConf.webrtc]: specialValues[SpecialConf.webrtc],
  }
}

/**
 * 发送初始配置给inject
 */
const sendInitConfig = function () {
  sendToWin('config', getConfig())
}

/**
 * 获取json字符串格式的config
 */
const getConfigJson = function () {
  return JSON.stringify(getConfig())
}

/**
 * 处理record
 * @param {{[string]: number}} records 
 */
const handleRecord = function (records) {
  if(!records)return;

  for(let key in records){
    let ac = allRecords[key];
    let rc = records[key];
    if(!ac)ac = rc;
    else ac += rc;
    allRecords[key] = ac;

    total += rc;
    if(key >= SpecialConf.languages)stotal += rc;
  }

  // 发送记录到background
  sendToEx("notify", {
    seed: pageSeed,
    total,
    stotal,
  })
}

// 监听ex
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if(msg.type == 'record'){
    sendResponse(allRecords);
  }
});

const getBasicValue = function (item, randFunc) {
  if(item){
    let {select, value} = item;
    if (select == 1) return value;
    else if (select == 0) {
      switch (value) {
        case SelectOpt.default.k: return null;
        case SelectOpt.page.k: return randFunc(pageSeed);
        case SelectOpt.browser.k: return randFunc(sessionSeed);
        case SelectOpt.domain.k: return randFunc(urlSeed);
      }
    }
  }
  return null;
}

const getSpecialValue = function (value, randFunc) {
  switch (value) {
    case SelectOpt.default.k: return null;
    case SelectOpt.page.k: return randFunc(pageSeed);
    case SelectOpt.browser.k: return randFunc(sessionSeed);
    case SelectOpt.domain.k: return randFunc(urlSeed);
  }
  return null;
}

const getTimeZoneValue = function (value) {
  value = value ?? -1;
  let res = timeOpt[value];
  return res == undefined ? null : res;
}

const getWebRTCValue = function (value, ip) {
  switch (value) {
    case SelectOpt.default.k: return null;
    case SelectOpt.localhost.k: return '127.0.0.1';
    case SelectOpt.proxy.k: return ip ?? '127.0.0.1';
  }
  return null;
}

/**
 * 注入核心脚本
 */
const injectScript = function() {
  // is iframe
  if(window !== window.top && window.frameElement){
    // 备份并修改sandbox属性
    const sandboxBak = frameElement.getAttribute('sandbox')
    frameElement.setAttribute('sandbox', 'allow-same-origin allow-scripts')
    // src属性是否存在
    if(window.frameElement.src && window.frameElement.src != 'about:blank'){
      loadDocScript('/src/inject.js')
    }else{
      // 不能解决blank iframe的问题
      frameElement.src = chrome.runtime.getURL('/src/inject.html')
    }
    // 恢复sandbox属性
    if(sandboxBak)frameElement.setAttribute('sandbox', sandboxBak)
    else frameElement.removeAttribute('sandbox')
  }else{
    loadDocScript('/src/inject.js')
  }
}

/**
 * 在文档中插入script脚本
 * @param {string} url 
 */
const loadDocScript = function (url) {
  let script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = chrome.runtime.getURL(url);
  document.documentElement.appendChild(script);
  script.remove();
}

/**
 * 初始化
 */
const init = async function () {
  const data = await dataPromise;
  
  if(!data[Mode.enable]){
    return;
  }

  sessionSeed = data[Mode.seed] % maxRandom;

  // get basic value
  const bData = data[Mode.basic];
  Object.assign(navigatorValues, {
    [BasicConf.language]: getBasicValue(bData[BasicConf.language], randomLanguage),
    [BasicConf.platform]: getBasicValue(bData[BasicConf.platform], randomPlatform),
    [BasicConf.hardwareConcurrency]: getBasicValue(bData[BasicConf.hardwareConcurrency], randomHardwareConcurrency),
    [BasicConf.appVersion]: getBasicValue(bData[BasicConf.appVersion], randomAppVersion),
    [BasicConf.userAgent]: getBasicValue(bData[BasicConf.userAgent], randomUserAgent),
  })

  Object.assign(screenValues, {
    [BasicConf.height]: getBasicValue(bData[BasicConf.height], randomHeight),
    [BasicConf.width]: getBasicValue(bData[BasicConf.width], randomWidth),
    [BasicConf.colorDepth]: getBasicValue(bData[BasicConf.colorDepth], randomColorDepth),
    [BasicConf.pixelDepth]: getBasicValue(bData[BasicConf.pixelDepth], randomPixelDepth),
  })

  // get special value
  const sData = data[Mode.special]
  Object.assign(specialValues, {
    [SpecialConf.canvas]: getSpecialValue(sData[SpecialConf.canvas], randomNoise),
    [SpecialConf.audio]: getSpecialValue(sData[SpecialConf.audio], randomAudioNoise),
    [SpecialConf.webgl]: getSpecialValue(sData[SpecialConf.webgl], randomWebGLRandom),
    [SpecialConf.timezone]: getTimeZoneValue(sData[SpecialConf.timezone]),
    [SpecialConf.webrtc]: getWebRTCValue(sData[SpecialConf.webrtc], data[Mode.ip]),
  })

  // init message event
  initMessageListener();

  // inject
  // runScript('/src/inject.js', (dataset) => {
  //   dataset.seed = pageSeed;
  //   dataset.config = JSON.stringify(data[Mode.config]);
  //   dataset.basic = JSON.stringify(basicValues);
  //   dataset.special = JSON.stringify(specialValues);
  //   dataset.ip = data[Mode.ip]
  // });
  
  injectScript()

}
init();