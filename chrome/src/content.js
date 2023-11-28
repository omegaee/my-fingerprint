const dataPromise = chrome.storage.local.get();

// 种子
const maxRandom = 0xFFFF;
const pageSeed = randInt(0, maxRandom);
const urlSeed = hashString(window.location.host, maxRandom);
let sessionSeed;

// 监听script
let allRecords;
let total = 0;
let stotal = 0;
const initMessageListener = function (config) {
  window.addEventListener('message', (ev) => {
    if(ev.origin != location.origin)return;
    let records = ev.data[pageSeed];
    if(!records)return;
    if(!allRecords)allRecords = {};
  
    for(let key in records){
      let ac = allRecords[key];
      let rc = records[key];
      if(ac == undefined)ac = rc;
      else ac += rc;
      allRecords[key] = ac;
  
      total += rc;
      if(key >= SpecialConf.languages)stotal += rc;
    }

    try{
      chrome.runtime.sendMessage({
        type: "notify",
        seed: pageSeed,
        total,
        stotal,
      });
    }catch(err){
    }
  });
}

// 监听popup
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

// 运行脚本
const runScript = function(url, beforeCall) {
  let file = chrome.runtime.getURL(url);
  let script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = file;
  if(beforeCall)beforeCall(script.dataset);
  document.documentElement.appendChild(script);
  script.remove();
}

const init = async function () {
  const data = await dataPromise;
  
  if(!data[Mode.enable]){
    return;
  }

  sessionSeed = data[Mode.seed] % maxRandom;

  // get basic value
  const bData = data[Mode.basic];
  let basicValues = {
    [BasicConf.language]: getBasicValue(bData[BasicConf.language], randomLanguage),
    [BasicConf.platform]: getBasicValue(bData[BasicConf.platform], randomPlatform),
    [BasicConf.hardwareConcurrency]: getBasicValue(bData[BasicConf.hardwareConcurrency], randomHardwareConcurrency),
    [BasicConf.appVersion]: getBasicValue(bData[BasicConf.appVersion], randomAppVersion),
    [BasicConf.userAgent]: getBasicValue(bData[BasicConf.userAgent], randomUserAgent),
    [BasicConf.height]: getBasicValue(bData[BasicConf.height], randomHeight),
    [BasicConf.width]: getBasicValue(bData[BasicConf.width], randomWidth),
    [BasicConf.colorDepth]: getBasicValue(bData[BasicConf.colorDepth], randomColorDepth),
    [BasicConf.pixelDepth]: getBasicValue(bData[BasicConf.pixelDepth], randomPixelDepth),
  }

  // get special value
  const sData = data[Mode.special]
  let specialValues = {
    [SpecialConf.canvas]: getSpecialValue(sData[SpecialConf.canvas], randomNoise),
    [SpecialConf.audio]: getSpecialValue(sData[SpecialConf.audio], randomAudioNoise),
    [SpecialConf.webgl]: getSpecialValue(sData[SpecialConf.webgl], randomWebGLRandom),
    [SpecialConf.timezone]: getTimeZoneValue(sData[SpecialConf.timezone]),
  }

  // init message event
  initMessageListener(data[Mode.config]);

  // inject
  runScript('/src/inject.js', (dataset) => {
    dataset.seed = pageSeed;
    dataset.config = JSON.stringify(data[Mode.config]);
    dataset.basic = JSON.stringify(basicValues);
    dataset.special = JSON.stringify(specialValues);
  });
}
init();