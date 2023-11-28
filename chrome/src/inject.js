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
    audio: 23,
    webgl: 24,
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

  /**
   * 发送可以动作到background
   * @param {number} id 
   */
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

  /**
   * proxy navigator
   * @param {*} data 
   */
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

  /**
   * proxy screen
   * @param {*} data 
   */
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

  /**
   *  hook canvas
   * @param {string} noise 
   */
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

  /**
   * modify time zone
   * @param {{text: string, zone: string, locale: string, offset: number}} value 
   */
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

  /**
   * 音频指纹混淆 - 压缩器噪音
   * 会影响audio质量 - pass
   * @param {number} noise 随机值
   */
  const hookAudioCompressor = function (noise) {
    let oriCreateDynamicsCompressor = OfflineAudioContext.prototype.createDynamicsCompressor
    OfflineAudioContext.prototype.createDynamicsCompressor = function () {
      let compressor = oriCreateDynamicsCompressor.apply(this, arguments)
      // 创建一个增益节点，用来添加一些噪音
      let gain = this.createGain();
      // 这是一个可调的参数，可以根据需要设置噪音的强度
      gain.gain.value = noise * 0.1;
      // 将增益节点连接到压缩器的输出
      compressor.connect(gain);
      // 将增益节点的输出连接到上下文的目标
      gain.connect(this.destination);
  
      recordAndSend(Opt.audio);  // 统计
      return compressor
    }
  }

  // /**
  //  * 音频指纹混淆 - AudioBuffer噪音
  //  * 会影响指纹生成速度
  //  * getChannelData调用次数多，无法很好的统计
  //  * @param {number[]} noises 
  //  */
  // const hookAudioBuffer = function (noises) {
  //   let oriGetChannelData = AudioBuffer.prototype.getChannelData
  //   AudioBuffer.prototype.getChannelData = function () {
  //     // 获取渲染缓冲区中的数据
  //     let data = oriGetChannelData.apply(this, arguments)
  //     // 遍历数据，进行一些随机的修改（步长可调节，减少遍历内容）
  //     for (let i = 0; i < data.length; i+=9) {
  //       let noise = noises[i % noises.length]
  //       if(0.1 < noise || noise < 0.9){
  //         // 以一定的概率添加或减去一些小数值
  //         data[i] += (noise * 0.0001 - 0.00005)*2;
  //       }else{
  //         // 以一定的概率交换一些数据的位置
  //         var j = Math.floor(noise * data.length);
  //         var temp = data[i];
  //         data[i] = data[j];
  //         data[j] = temp;
  //       }
  //     }
  //     // recordAndSend(Opt.audio);  // getChannelData调用次数多，无法很好的统计（pass）
  //     return data
  //   }
  // }

  /**
   * hook AudioContext
   * @param {number[]} value 
   */
  const hookAudioContext = function (value) {
    if(!value)return
    // hookAudioBuffer(value)
    hookAudioCompressor(value[0])
  }

  /**
   * hook WebGL
   * @param {string} value 
   */
  const hookWebGL = function (value) {
    if(!value)return
    const wglGetParameter = WebGLRenderingContext.prototype.getParameter
    const wgl2GetParameter = WebGL2RenderingContext.prototype.getParameter
    WebGLRenderingContext.prototype.getParameter = function () {
      const debugEx = this.getExtension('WEBGL_debug_renderer_info')
      if(arguments[0] === debugEx.UNMASKED_RENDERER_WEBGL)return value
      return wglGetParameter.apply(this, arguments)
    }
    WebGL2RenderingContext.prototype.getParameter = function () {
      const debugEx = this.getExtension('WEBGL_debug_renderer_info')
      if(arguments[0] === debugEx.UNMASKED_RENDERER_WEBGL)return value
      return wgl2GetParameter.apply(this, arguments)
    }
  }

  if(config[Config.proxyNavigator])proxyNavigator(basicValues);
  if(config[Config.proxyScreen])proxyScreen(basicValues);
  hookCanvas(specialValues[Opt.canvas]);
  hookAudioContext(specialValues[Opt.audio])
  hookWebGL(specialValues[Opt.webgl])
  modifyTimeZone(specialValues[Opt.timezone])

}();