!function(){
  const IDENTIFY = 'my-fingerprint'
  console.log("inject...");
  RTCPeerConnection = undefined
  const script = document.currentScript;
  const seed = script.dataset.seed;
  const config = JSON.parse(script.dataset.config);
  const basicValues = JSON.parse(script.dataset.basic);
  const specialValues = JSON.parse(script.dataset.special);
  const proxy_ip = script.dataset.ip  // 代理ip（用于WebRTC）

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
    webrtc: 25,
  }
  const Config = {
    proxyNavigator: 0,
    proxyScreen: 1,
  }

  /**
   * 发送消息
   * @param {{type: string, value: string}} value 
   */
  const sendMessage = function (value) {
    if(!value)return
    postMessage({[IDENTIFY]: value}, location.origin)
  }

  /**
   * 监听content
   */
  window.addEventListener('message', (ev) => {
    if(ev.origin !== location.origin)return;
    const data = ev.data?.[IDENTIFY]
    // 根据type执行不同代码
    switch(data.type){
      case 'config':{
        changeConfig(data.value)
        break
      }
      default: return
    }
  });

  // 可加载配置
  sendMessage({})

  /**
   * 配置更改
   * @param {{[key: string]: any}} conf 
   */
  const changeConfig = function (conf) {
    
  }

  /**
   * 发送可疑记录到content
   */
  const sendRecordsMessage = function () {
    // let tmp = records;
    postMessage({[seed]: records}, location.origin);
    records = {};
  }

  /**
   * 延时发送可疑记录到content
   * @param {number} id 
   */
  const recordAndSend = function (id) {
    let count = records[id];
    if(!count)count = 1;
    else count += 1;
    records[id] = count;
    // send msg to content.js
    if(timer)clearTimeout(timer);
    timer = setTimeout(sendRecordsMessage, 200);
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

  const handlerRTCPeerConnectionIceEvent = {
    get: function (target, key) {
      let res = target[key]
      if (!res) return target[key]
      // 如果属性名是candidate，就返回一个新的对象
      if (key === "candidate") {
        // 判断ip是否存在
        let ipRe = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/g
        let pubIP = ipRe.exec(res.candidate)?.[0]  // 原IP
        if(!pubIP)return res

        // 获取ip字符串
        let ip;
        switch(specialValues[Opt.webrtc]){
          case 'localhost': 
            ip = '127.0.0.1'
            break
          case 'proxy': 
            ip = proxy_ip || '127.0.0.1'
            break
          default: return res
        }
        console.log('proxy==>', ip);
        
        // 修改candidate中的address
        let candSplit = res.candidate.split(' ')
        candSplit[4] = ip

        // 统计
        recordAndSend(Opt.webrtc);

        // 返回修改后的RTCIceCandidate
        return Object.setPrototypeOf({
          ...res.toJSON(),
          candidate: candSplit.join(' '),
          address: ip,
          foundation: res.foundation,
          component: res.component,
          protocol: res.protocol,
          priority: res.priority,
          port: res.port,
          type: res.type,
          tcpType: res.tcpType,
          relatedAddress: res.relatedAddress,
          relatedPort: res.relatedPort,
        }, RTCIceCandidate.prototype)
      }
      if (typeof res === "function") return res.bind(target)
      return res
    },
  }

  const handlerRTCPeerConnection = {
    get: (target, key, aaa) => {
      let res = target[key]
      if (typeof res === "function") return res.bind(target)
      return res
    },
    set: (target, key, value) => {
      if (!value) return true
      if (key === 'onicecandidate') {
        target[key] = (event) => {
          value(new Proxy(event, handlerRTCPeerConnectionIceEvent))
        }
      } else {
        target[key] = value
      }
      return true
    }
  }

  /**
   * hook WebRTC
   * @param {string} value 
   */
  const hookWebRTC = function (value) {
    if(!value)return
    // hook addEventListener
    const oriRTCAddEvent = RTCPeerConnection.prototype.addEventListener
    RTCPeerConnection.prototype.addEventListener = function () {
      if('icecandidate' == arguments[0]){
        const call = arguments[1]
        if(call){
          arguments[1] = (event) => {
            call(new Proxy(event, handlerRTCPeerConnectionIceEvent))
          }
        }
        return oriRTCAddEvent.apply(this, arguments)
      }
      return oriRTCAddEvent.apply(this, arguments)
    }
    // hook onicecandidate
    const oriRTCPeerConnection = RTCPeerConnection
    RTCPeerConnection = function () {
      let connection
      if (this instanceof oriRTCPeerConnection) {
        connection = oriRTCPeerConnection.apply(this, arguments)
      } else {
        connection = new oriRTCPeerConnection(...arguments)
      }
      return new Proxy(connection, handlerRTCPeerConnection)
    }
  }

  let isRun = false
  /**
   * run
   */
  const mainHook = function () {
    if(isRun)return
    if(config[Config.proxyNavigator])proxyNavigator(basicValues);
    if(config[Config.proxyScreen])proxyScreen(basicValues);
    hookCanvas(specialValues[Opt.canvas]);
    hookAudioContext(specialValues[Opt.audio])
    hookWebGL(specialValues[Opt.webgl])
    modifyTimeZone(specialValues[Opt.timezone])
    hookWebRTC(specialValues[Opt.webrtc])
    isRun = true
  }
  mainHook()

}();