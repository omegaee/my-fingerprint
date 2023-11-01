!function(){
  const script = document.currentScript;
  const seed = script.dataset.seed;
  const config = JSON.parse(script.dataset.config);
  const basicValues = JSON.parse(script.dataset.basic);
  const specialValues = JSON.parse(script.dataset.special);

  let records = {};
  let timer;

  const Opt = {
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
  const Config = {
    proxyNavigator: 0,
    proxyScreen: 1,
  }
  
  const sendMessage = function () {
    // let tmp = records;
    postMessage({[seed]: records}, location.origin);
    records = {};
  }

  const recordAndSend = function (id) {
    let count = records[id];
    if(!count)count = 1;
    else count += 1;
    records[id] = count;
    // send msg to content.js
    if(timer)clearTimeout(timer);
    timer = setTimeout(sendMessage, 200);
  }

  const getBasicValue = function (data, id) {
    recordAndSend(id)
    return data[id];
  }

  // proxy navigator
  const proxyNavigator = function (data) {
    if (!data) return;
    let get = function (target, key) {
      let id = null;
      switch (key) {
        case 'language': id = Opt.language; break;
        case 'platform': id = Opt.platform; break;
        case 'hardwareConcurrency': id = Opt.hardwareConcurrency; break;
        case 'appVersion': id = Opt.appVersion; break;
        case 'userAgent': id = Opt.userAgent; break;
      }
      if(id != null){
        let res = getBasicValue(data, id);
        if(res != null)return res;
      }
      let res = target[key];
      if (typeof res === "function") return res.bind(target);
      else return res;
    }
    Object.defineProperty(window, 'navigator', {
      value: new Proxy(window.navigator, { get })
    });
  }

  // proxy screen
  const proxyScreen = function (data) {
    if (!data) return;
    let get = function (target, key) {
      let id = null;
      switch (key) {
        case 'height': id = Opt.height; break;
        case 'width': id = Opt.width; break;
        case 'colorDepth': id = Opt.colorDepth; break;
        case 'pixelDepth': id = Opt.pixelDepth; break;
      }
      if(id != null){
        let res = getBasicValue(data, id);
        if(res != null)return res;
      }
      let res = target[key];
      if (typeof res === "function") return res.bind(target);
      else return res;
    }
    Object.defineProperty(window, 'screen', {
      value: new Proxy(window.screen, { get })
    });
  }

  // hook canvas
  const hookCanvas = function (noise) {
    if(!noise)return;
    let oriToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function () {
      let ctx = this.getContext('2d');
      let style = ctx.fillStyle;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
      ctx.fillText(noise, 0, 2)
      ctx.fillStyle = style;
      recordAndSend(Opt.canvas);
      return oriToDataURL.apply(this, arguments);
    }
  }

  // modify time zone
  const modifyTimeZone = function (value) {
    if(!value)return;
    const OriDateTimeFormat = Intl.DateTimeFormat;
    Intl.DateTimeFormat = function (...args) {
      args[0] = args[0] ?? value.locale;
      args[1] = Object.assign({ timeZone: value.zone }, args[1]);
      recordAndSend(Opt.timezone);
      return OriDateTimeFormat.apply(this, args);
    }
    // const oriGetTimezoneOffset = Date.prototype.getTimezoneOffset;
    Date.prototype.getTimezoneOffset = function () {
      recordAndSend(Opt.timezone);
      return value.offset * -60;
    }
  }

  if(config[Config.proxyNavigator])proxyNavigator(basicValues);
  if(config[Config.proxyScreen])proxyScreen(basicValues);
  hookCanvas(specialValues[Opt.canvas]);
  modifyTimeZone(specialValues[Opt.timezone]);

}();