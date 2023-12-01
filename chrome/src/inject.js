!function () {
  const IDENTIFY = 'my-fingerprint'

  // 代理状态
  const pTable = {}
  // 代理方法
  const hookMethods = {}
  /**
   * undefined: 未设置
   * null: 空值
   * other: 代理值
   */
  const config = {}

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
  const Control = {
    navigator: 0,
    screen: 1,
  }

  /**
   * 发送消息到content
   * @param {string} type
   * @param {any} value
   */
  const sendToWin = function (type, value) {
    try {
      postMessage({ [IDENTIFY]: { type, value } }, location.origin)
    } catch (error) {}
    // else postMessage({[IDENTIFY]: {type, value}}, '*')
  }

  /**
   * 监听content
   */
  const listenMessage = function () {
    window.addEventListener('message', (ev) => {
      // if(ev.origin !== location.origin)return;
      const data = ev.data?.[IDENTIFY]
      if (!data) return
      // 根据type执行不同代码
      switch (data.type) {
        case 'config': {
          changeConfig(data.value)
          break
        }
        default: return
      }
    });
  }

  // 记录
  let records = {};
  // 记录发送定时器
  let recordTimer;

  /**
   * 发送可疑记录到content
   */
  const sendRecordsMessage = function () {
    // let tmp = records;
    sendToWin('record', records)
    records = {};
  }

  /**
   * 延时发送可疑记录到content
   * @param {number} id 
   */
  const recordAndSend = function (id) {
    let count = records[id];
    if (!count) count = 1;
    else count += 1;
    records[id] = count;
    // send msg to content.js
    if (recordTimer) clearTimeout(recordTimer);
    recordTimer = setTimeout(sendRecordsMessage, 200);
  }

  /**
   * 配置更改
   * @param {{[key: string | number]: any | null | undefined}} conf 
   */
  const changeConfig = function (conf) {
    Object.assign(config, conf)

    configHook(Control.screen)
    configHook(Control.navigator)

    configHook(Opt.canvas)
    configHook(Opt.timezone)
    configHook(Opt.audio)
    configHook(Opt.webgl)
    configHook(Opt.webrtc)
  }

  /**
   * 配置hook内容
   * @param {string | number} identify 
   */
  const configHook = function (identify) {
    value = config[identify]
    if (value == undefined) return
    if (pTable[identify]) {
      // 已hook
      if (value !== null) return
      hookMethods[identify]?.(true)  // 恢复
      pTable[identify] = false
    } else {
      // 未hook
      if (value === null) return
      hookMethods[identify]?.()  // 进行hook
      pTable[identify] = true
    }
  }

  /**
   * hook navigator
   * @param {boolean} isRestore 恢复
   * @param {{[string]: string}} config[Control.navigator] 
   */
  let oriNavigatorDescriptor
  hookMethods[Control.navigator] = function (isRestore) {
    if (isRestore) {
      if (oriNavigatorDescriptor) Object.defineProperty(window, "navigator", oriNavigatorDescriptor);
    } else {
      oriNavigatorDescriptor = Object.getOwnPropertyDescriptor(window, "navigator");
      let get = function (target, key) {
        let id = null;
        switch (key) {
          case 'language': id = Opt.language; break;
          case 'platform': id = Opt.platform; break;
          case 'hardwareConcurrency': id = Opt.hardwareConcurrency; break;
          case 'appVersion': id = Opt.appVersion; break;
          case 'userAgent': id = Opt.userAgent; break;
        }
        if (id != null) {
          recordAndSend(id)
          const res = config[Control.navigator]?.[id]
          if (res) res;
        }
        let res = target[key];
        if (typeof res === "function") return res.bind(target);
        else return res;
      }
      Object.defineProperty(window, 'navigator', {
        value: new Proxy(window.navigator, { get })
      });
    }
  }

  /**
   * hook screen
   * @param {boolean} isRestore 恢复
   * @param {{[string]: string}} config[Control.screen] 
   */
  let oriScreenDescriptor
  hookMethods[Control.screen] = function (isRestore) {
    if (isRestore) {
      if (oriScreenDescriptor) Object.defineProperty(window, "screen", oriNavigatorDescriptor);
    } else {
      oriScreenDescriptor = Object.getOwnPropertyDescriptor(window, "screen");
      let get = function (target, key) {
        let id = null;
        switch (key) {
          case 'height': id = Opt.height; break;
          case 'width': id = Opt.width; break;
          case 'colorDepth': id = Opt.colorDepth; break;
          case 'pixelDepth': id = Opt.pixelDepth; break;
        }
        if (id != null) {
          recordAndSend(id)
          const res = config[Control.screen]?.[id]
          if (res) res;
        }
        let res = target[key];
        if (typeof res === "function") return res.bind(target);
        else return res;
      }
      Object.defineProperty(window, 'screen', {
        value: new Proxy(window.screen, { get })
      });
    }
  }

  /**
   * hook canvas
   * @param {boolean} isRestore 恢复
   * @param {string} config[Opt.canvas] 
   */
  let oriToDataURL;
  hookMethods[Opt.canvas] = function (isRestore) {
    if (isRestore) {
      if (oriToDataURL) HTMLCanvasElement.prototype.toDataURL = oriToDataURL
    } else {
      // execute hook
      oriToDataURL = HTMLCanvasElement.prototype.toDataURL

      HTMLCanvasElement.prototype.toDataURL = function () {
        let ctx = this.getContext('2d');
        let style = ctx.fillStyle;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
        ctx.fillText(config[Opt.canvas], 0, 2)
        ctx.fillStyle = style;
        recordAndSend(Opt.canvas);
        return oriToDataURL.apply(this, arguments);
      }
    }
  }

  /**
   * hook time zone
   * @param {boolean} isRestore
   * @param {{text: string, zone: string, locale: string, offset: number}} config[Opt.timezone] 
   */
  let oriDateTimeFormat;
  let oriGetTimezoneOffset;
  hookMethods[Opt.timezone] = function (isRestore) {
    if (isRestore) {
      if (oriDateTimeFormat) Intl.DateTimeFormat = oriDateTimeFormat
      if (oriGetTimezoneOffset) Date.prototype.getTimezoneOffset = oriGetTimezoneOffset
    } else {
      // execute hook
      oriDateTimeFormat = Intl.DateTimeFormat;
      oriGetTimezoneOffset = Date.prototype.getTimezoneOffset;

      const curZone = config[Opt.timezone]
      Intl.DateTimeFormat = function (...args) {
        args[0] = args[0] ?? curZone.locale;
        args[1] = Object.assign({ timeZone: curZone.zone }, args[1]);
        recordAndSend(Opt.timezone);
        return oriDateTimeFormat.apply(this, args);
      }
      Date.prototype.getTimezoneOffset = function () {
        recordAndSend(Opt.timezone);
        return curZone.offset * -60;
      }
    }
  }

  /**
   * 音频指纹混淆 - 压缩器噪音
   * 可能会影响audio质量
   * @param {number} config[Opt.audio] 随机值
   * @param {boolean} isRestore
   */
  let oriCreateDynamicsCompressor;
  hookMethods[Opt.audio] = function (isRestore) {
    if (isRestore) {
      if (oriCreateDynamicsCompressor) OfflineAudioContext.prototype.createDynamicsCompressor = oriCreateDynamicsCompressor
    } else {
      oriCreateDynamicsCompressor = OfflineAudioContext.prototype.createDynamicsCompressor

      OfflineAudioContext.prototype.createDynamicsCompressor = function () {
        let compressor = oriCreateDynamicsCompressor.apply(this, arguments)
        // 创建一个增益节点，用来添加一些噪音
        let gain = this.createGain();
        // 这是一个可调的参数，可以根据需要设置噪音的强度
        gain.gain.value = config[Opt.audio] ?? Math.random() * 0.01;
        // 将增益节点连接到压缩器的输出
        compressor.connect(gain);
        // 将增益节点的输出连接到上下文的目标
        gain.connect(this.destination);
        recordAndSend(Opt.audio);  // 统计
        return compressor
      }
    }
  }

  // /**
  //  * 音频指纹混淆 - AudioBuffer噪音
  //  * 会影响指纹生成速度
  //  * getChannelData调用次数多，无法很好的统计
  //  * @param {number[]} noises 
  //  */
  // hookMethods[Opt.audio] = function (noises) {
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
   * hook WebGL
   * @param {string} config[Opt.webgl] 
   * @param {boolean} isRestore
   */
  let wglGetParameter
  let wgl2GetParameter
  hookMethods[Opt.webgl] = function (isRestore) {
    if (isRestore) {
      if (wglGetParameter) WebGLRenderingContext.prototype.getParameter = wglGetParameter
      if (wgl2GetParameter) WebGL2RenderingContext.prototype.getParameter = wgl2GetParameter
    } else {
      wglGetParameter = WebGLRenderingContext.prototype.getParameter
      wgl2GetParameter = WebGL2RenderingContext.prototype.getParameter

      WebGLRenderingContext.prototype.getParameter = function () {
        const debugEx = this.getExtension('WEBGL_debug_renderer_info')
        if (arguments[0] === debugEx.UNMASKED_RENDERER_WEBGL) return config[Opt.webgl]
        return wglGetParameter.apply(this, arguments)
      }
      WebGL2RenderingContext.prototype.getParameter = function () {
        const debugEx = this.getExtension('WEBGL_debug_renderer_info')
        if (arguments[0] === debugEx.UNMASKED_RENDERER_WEBGL) return config[Opt.webgl]
        return wgl2GetParameter.apply(this, arguments)
      }
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
        if (!pubIP) return res

        // 修改candidate中的address
        let candSplit = res.candidate.split(' ')
        candSplit[4] = config[Opt.webrtc]

        // 统计
        recordAndSend(Opt.webrtc);

        // 返回修改后的RTCIceCandidate
        return Object.setPrototypeOf({
          ...res.toJSON(),
          candidate: candSplit.join(' '),
          address: config[Opt.webrtc],
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
   * @param {string} config[Opt.webrtc] 
   * @param {boolean} isRestore
   */
  let oriRTCAddEvent
  let oriRTCPeerConnection
  hookMethods[Opt.webrtc] = function (isRestore) {
    if (isRestore) {
      if (oriRTCPeerConnection) RTCPeerConnection = oriRTCPeerConnection
      if (oriRTCAddEvent) RTCPeerConnection.prototype.addEventListener = oriRTCAddEvent
    } else {
      oriRTCPeerConnection = RTCPeerConnection
      oriRTCAddEvent = RTCPeerConnection.prototype.addEventListener

      // hook addEventListener
      RTCPeerConnection.prototype.addEventListener = function () {
        if ('icecandidate' == arguments[0]) {
          const call = arguments[1]
          if (call) {
            arguments[1] = (event) => {
              call(new Proxy(event, handlerRTCPeerConnectionIceEvent))
            }
          }
          return oriRTCAddEvent.apply(this, arguments)
        }
        return oriRTCAddEvent.apply(this, arguments)
      }
      // hook onicecandidate
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
  }

  listenMessage()
  sendToWin('init')

}();