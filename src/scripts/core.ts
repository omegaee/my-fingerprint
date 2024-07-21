import deepmerge from "deepmerge";
import { HookType } from '@/types/enum'
import { randomAudioNoise, randomCanvasNoise, randomColorDepth, randomEquipmentInfo, randomHardwareConcurrency, randomLanguage, randomPixelDepth, randomScreenSize, randomWebglRander, seededRandom } from "../utils/data";
import { debounce } from "../utils/timer";
import { postSetHookRecords, unwrapMessage } from "@/message/content";
import { genRandomSeed, hashNumberFromString } from "../utils/base";
import { ContentMsg } from '@/types/enum'
import { EquipmentInfoHandler } from "@/utils/equipment";

// hook缓存
const cache: Partial<Record<HookFingerprintKey, any>> = {}
// record缓存
const hookRecords: Map<HookFingerprintKey, number> = new Map()

/**
 * 发送record消息
 */
const sendRecordMessage = debounce(() => {
  postSetHookRecords(Object.fromEntries(hookRecords))
})

/**
 * 记录并发送消息
 */
const recordAndSend = function (key: HookFingerprintKey) {
  const oldValue = hookRecords.get(key) ?? 0
  hookRecords.set(key, oldValue + 1)
  sendRecordMessage()
}

export class FingerprintHandler {
  private win: Window & typeof globalThis
  private tabId: number
  private host: string

  private enabled: boolean = true
  private conf?: DeepPartial<LocalStorageConfig>

  private pageSeed: number
  private domainSeed: number
  private browserSeed: number
  private curstomSeed: number

  private equipmentHandler?: EquipmentInfoHandler

  public constructor(win: Window & typeof globalThis, tabId: number, host: string) {
    this.win = win
    this.tabId = tabId
    this.host = host
    this.pageSeed = seededRandom(tabId)
    this.domainSeed = hashNumberFromString(host)
    this.browserSeed = this.conf?.browserSeed ?? genRandomSeed()
    this.curstomSeed = this.conf?.customSeed ?? genRandomSeed()

    // 接收顶级window对象的消息
    window.addEventListener('message', (ev) => {
      if (ev.origin != location.origin) return
      const msg = unwrapMessage(ev.data) as ContentRequest | undefined
      switch (msg?.type) {
        case ContentMsg.SetConfig: {
          this.setConfig(msg.config)
          break
        }
        case ContentMsg.UpdateState: {
          if (msg.mode === 'enable') {
            this.enable()
          } else if (msg.mode === 'disable') {
            this.disable()
          }
          break
        }
      }
    })
  }

  /**
   * 配置
   */
  public setConfig(config?: DeepPartial<LocalStorageConfig>) {
    if (!config) return

    if (this.conf) {
      this.conf = deepmerge(this.conf, config)
    } else {
      this.conf = config
    }

    const reExecute = config.enable !== undefined

    if (reExecute) {
      this.refresh()
    } else {
      if (config.fingerprint?.navigator) {
        this.proxyNavigator()
      }
      if (config.fingerprint?.screen) {
        this.proxyScreen()
      }
      if (config.fingerprint?.other?.timezone) {
        this.proxyTimeZone()
      }
      if (config.fingerprint?.other?.canvas) {
        this.proxyCanvas()
      }
      if (config.fingerprint?.other?.audio) {
        this.proxyAudio()
      }
      if (config.fingerprint?.other?.webgl) {
        this.proxyWebGL()
      }
      if (config.fingerprint?.other?.webrtc) {
        this.proxyWebRTC()
      }
      if (config.hookBlankIframe) {
        this.injectHtmlBlankIframe()
        this.proxyBlankIframeInsertDocument()
      }
    }

    if (config.browserSeed !== undefined) {
      this.browserSeed = config.browserSeed
    }
    if (config.customSeed !== undefined) {
      this.curstomSeed = config.customSeed
    }
  }

  private refresh() {
    this.proxyNavigator()
    this.proxyScreen()
    this.proxyTimeZone()
    this.proxyCanvas()
    this.proxyAudio()
    this.proxyWebGL()
    this.proxyWebRTC()
    this.proxyGetOwnPropertyDescriptor()
    this.injectHtmlBlankIframe()
    this.proxyBlankIframeInsertDocument()
  }

  public disable() {
    if (this.enabled && this.conf?.enable) {
      // 已启动
      this.enabled = false
      this.refresh()
    } else {
      // 未启动
      this.enabled = false
    }
  }

  public enable() {
    if (this.enabled && this.conf?.enable) {
      // 已启动
      this.enabled = true
      this.refresh()
    } else {
      // 未启动
      this.enabled = true
      this.refresh()
    }
  }

  private rawNavigatorDescriptor: PropertyDescriptor | undefined
  private rawScreenDescriptor: PropertyDescriptor | undefined

  private rawGetOwnPropertyDescriptor: typeof Object.getOwnPropertyDescriptor | undefined
  private rawToDataURL: typeof HTMLCanvasElement.prototype.toDataURL | undefined
  private rawCreateDynamicsCompressor: typeof OfflineAudioContext.prototype.createDynamicsCompressor | undefined
  private rawWglGetParameter: typeof WebGLRenderingContext.prototype.getParameter | undefined
  private rawWgl2GetParameter: typeof WebGL2RenderingContext.prototype.getParameter | undefined

  private rawDateTimeFormat: typeof Intl.DateTimeFormat | undefined
  private rawGetTimezoneOffset: typeof Date.prototype.getTimezoneOffset | undefined

  private rawAppendChild: typeof HTMLElement.prototype.appendChild | undefined
  private rawInsertBefore: typeof HTMLElement.prototype.insertBefore | undefined
  private rawReplaceChild: typeof HTMLElement.prototype.replaceChild | undefined

  private isInjectHtmlBlankIframe = false

  /**
   * hook iframe
   */
  private hookIframe(iframe: HTMLIFrameElement) {
    const fh = new FingerprintHandler(iframe.contentWindow as any, this.tabId, this.host)
    fh.setConfig(this.conf)
    if (this.enabled === false) {
      fh.disable()
    }
  }

  /**
   * 将代理注入到<iframe>中
   */
  private injectHtmlBlankIframe() {
    if (this.isInjectHtmlBlankIframe) return
    if (this.enabled && this.conf?.enable && this.conf.hookBlankIframe) {
      this.isInjectHtmlBlankIframe = true
      const iframes = this.win.document.querySelectorAll('iframe')
      for (const iframe of iframes) {
        this.hookIframe(iframe)
        // if (!iframe.src || iframe.src === 'about:blank') {
        //   this.hookIframe(iframe)
        // }
      }
    }
  }

  /**
   * 是否所有字段的type都是default
   * ops为空则返回true
   */
  private isAllDefault(ops?: DeepPartial<Record<string, HookMode>>) {
    if (!ops) return true
    for (const value of Object.values(ops)) {
      if (value!.type !== HookType.default) return false
    }
    return true
  }

  /**
   * 获取value对应的的seed
   */
  private getSeedByHookValue = (value?: any) => {
    switch (value?.type) {
      case HookType.page: {
        return this.pageSeed
      }
      case HookType.domain: {
        return this.domainSeed
      }
      case HookType.browser: {
        return this.browserSeed
      }
      case HookType.seed: {
        return this.curstomSeed
      }
      case HookType.default:
      default: return null
    }
  }

  /**
   * 从hook缓存或指定函数中获取值
   */
  private getValueFromCacheOrFunc(key: HookFingerprintKey, value: any, seedFunc: (seed: number) => any): any | null {
    if (value && !cache[key]) {
      const type = (value as HookMode).type
      let res
      if(type === HookType.value){
        res = seedFunc(1)
      }else{
        let seed = this.getSeedByHookValue(value)
        if (seed === null) return null
        res = seedFunc(seed)
      }

      if (res === null || res === undefined) return null
      if(key === 'timezone'){
        cache[key] = res
      } 
      else if (typeof (res) === 'object') {
        Object.assign(cache, res)
      }
      else {
        cache[key] = res
      }
    }
    return cache[key] ?? null
  }

  /**
   * 获取并记录值
   */
  private getValue(prefix: string, key: string): any | null {
    let res = null
    switch (prefix) {
      case "navigator": {
        const value = this.conf?.fingerprint?.navigator?.[key as keyof HookFingerprint['navigator']]
        switch (key) {
          // case "appVersion": {
          //   res = this.getValueFromCacheOrFunc(key, value, randomEquipmentInfo)
          //   break
          // }
          // case "platform": {
          //   res = this.getValueFromCacheOrFunc(key, value, randomEquipmentInfo)
          //   break
          // }
          // case "userAgent": {
          //   res = this.getValueFromCacheOrFunc(key, value, randomEquipmentInfo)
          //   break
          // }
          case "language": {
            res = this.getValueFromCacheOrFunc(key, value, randomLanguage)
            break
          }
          case "hardwareConcurrency": {
            res = this.getValueFromCacheOrFunc(key, value, randomHardwareConcurrency)
            break
          }
        }
      }
      case "screen": {
        const value = this.conf?.fingerprint?.screen?.[key as keyof HookFingerprint['screen']]
        switch (key) {
          case "height": {
            res = this.getValueFromCacheOrFunc(key, value, randomScreenSize)
            break
          }
          case "width": {
            res = this.getValueFromCacheOrFunc(key, value, randomScreenSize)
            break
          }
          case "colorDepth": {
            res = this.getValueFromCacheOrFunc(key, value, randomColorDepth)
            break
          }
          case "pixelDepth": {
            res = this.getValueFromCacheOrFunc(key, value, randomPixelDepth)
            break
          }
        }
      }
      case "other": {
        const value = this.conf?.fingerprint?.other?.[key as keyof HookFingerprint['other']]
        switch (key) {
          case "canvas": {
            res = this.getValueFromCacheOrFunc(key, value, randomCanvasNoise)
            break
          }
          case "audio": {
            res = this.getValueFromCacheOrFunc(key, value, randomAudioNoise)
            break
          }
          case "webgl": {
            res = this.getValueFromCacheOrFunc(key, value, randomWebglRander)
            break
          }
          case "webrtc": {
            break
          }
          case "timezone": {
            res = this.getValueFromCacheOrFunc(key, value, () => {
              const timezoneMode = this.conf?.fingerprint?.other?.timezone
              if (timezoneMode?.type === HookType.value) {
                return timezoneMode.value
              }
            })
            break
          }
        }
      }
    }
    if (res !== null) {
      // 记录
      recordAndSend(key as HookFingerprintKey)
    }
    return res
  }

  /**
   * hook iframe插入文档的行为
   */
  private proxyBlankIframeInsertDocument() {
    if (this.enabled && this.conf?.enable && this.conf.hookBlankIframe) {
      // proxy
      if (!this.rawAppendChild) {
        this.rawAppendChild = this.win.HTMLElement.prototype.appendChild
      }
      if (!this.rawInsertBefore) {
        this.rawInsertBefore = this.win.HTMLElement.prototype.insertBefore
      }
      if (!this.rawReplaceChild) {
        this.rawReplaceChild = this.win.HTMLElement.prototype.replaceChild
      }

      const apply = (target: any, thisArg: Object, args: any) => {
        const res = target.apply(thisArg, args)
        const node = args[0]
        if (node?.tagName === 'IFRAME') {
          this.hookIframe(node as HTMLIFrameElement)
        }
        return res
      }

      this.win.HTMLElement.prototype.appendChild = new Proxy(this.rawAppendChild, { apply })
      this.win.HTMLElement.prototype.insertBefore = new Proxy(this.rawInsertBefore, { apply })
      this.win.HTMLElement.prototype.replaceChild = new Proxy(this.rawReplaceChild, { apply })
    } else {
      // unproxy
      if (this.rawAppendChild) {
        this.win.HTMLElement.prototype.appendChild = this.rawAppendChild
      }
      if (this.rawInsertBefore) {
        this.win.HTMLElement.prototype.insertBefore = this.rawInsertBefore
      }
      if (this.rawReplaceChild) {
        this.win.HTMLElement.prototype.replaceChild = this.rawReplaceChild
      }
    }

  }

  /**
   * proxy Object.getOwnPropertyDescriptor
   */
  private proxyGetOwnPropertyDescriptor() {
    if (this.enabled && this.conf?.enable) {
      // proxy
      if (!this.rawGetOwnPropertyDescriptor) {
        this.rawGetOwnPropertyDescriptor = this.win.Object.getOwnPropertyDescriptor
      }
      const navigatorDesc = this.rawNavigatorDescriptor ?? this.win.Object.getOwnPropertyDescriptor(this.win, 'navigator')
      const screenDesc = this.rawScreenDescriptor ?? this.win.Object.getOwnPropertyDescriptor(this.win, 'screen')

      this.win.Object.getOwnPropertyDescriptor = new Proxy(this.rawGetOwnPropertyDescriptor, {
        apply: (target, thisArg: Object, args: Parameters<typeof Object.getOwnPropertyDescriptor>) => {
          const [obj, prop] = args
          if (obj === this.win) {
            if (prop === 'navigator') return navigatorDesc
            if (prop === 'screen') return screenDesc
          }
          return target.apply(thisArg, args)
        }
      })
    } else {
      // unproxy
      if (this.rawGetOwnPropertyDescriptor) {
        this.win.Object.getOwnPropertyDescriptor = this.rawGetOwnPropertyDescriptor
      }
    }
  }

  /**
   * proxy navigator
   */
  private proxyNavigator() {
    if (this.enabled && this.conf?.enable && !this.isAllDefault(this.conf?.fingerprint?.navigator)) {
      // proxy
      if (!this.rawNavigatorDescriptor) {
        this.rawNavigatorDescriptor = this.win.Object.getOwnPropertyDescriptor(this.win, "navigator");
      }
      this.win.Object.defineProperty(this.win, 'navigator', {
        value: new Proxy(this.win.navigator, {
          get: (target, key: string) => {
            if (key in target) {
              let value: any | null
              if(key === 'userAgent' || key === 'appVersion' || key === 'userAgentData'){
                /// Equipment
                const seed = this.getSeedByHookValue(this.conf?.fingerprint?.navigator?.equipment)
                if(seed !== null){
                  if(!this.equipmentHandler){
                    this.equipmentHandler = new EquipmentInfoHandler(target, seed)
                  }
                  value = this.equipmentHandler.getValue(key)
                  if (value !== null) {
                    // 记录
                    recordAndSend(key as HookFingerprintKey)
                  }
                }else{
                  value = null
                }
              }else{
                /// Other
                value = this.getValue('navigator', key)
              }
              if (value !== null) {
                return value
              }
              const res = target[key as keyof Navigator]
              if (typeof res === "function") {
                return res.bind(target)
              } else {
                return res
              }
            } else {
              return undefined
            }
          }
        })
      });
    } else {
      // unproxy
      if (this.rawNavigatorDescriptor) {
        this.win.Object.defineProperty(this.win, "navigator", this.rawNavigatorDescriptor)
      }
    }

  }

  /**
   * proxy screen
   */
  private proxyScreen() {
    if (this.enabled && this.conf?.enable && !this.isAllDefault(this.conf?.fingerprint?.screen)) {
      // proxy
      if (!this.rawScreenDescriptor) {
        this.rawScreenDescriptor = this.win.Object.getOwnPropertyDescriptor(this.win, "screen");
      }
      this.win.Object.defineProperty(this.win, 'screen', {
        value: new Proxy(this.win.screen, {
          get: (target, key: string) => {
            if (key in target) {
              const value = this.getValue('screen', key)
              if (value !== null) {
                return value
              }
              const res = target[key as keyof Screen]
              // @ts-ignore
              if (typeof res === "function") return res.bind(target)
              else return res
            } else {
              return undefined
            }
          }
        })
      })
    } else {
      // unproxy
      if (this.rawScreenDescriptor) {
        this.win.Object.defineProperty(this.win, "screen", this.rawScreenDescriptor)
      }
    }
  }

  /**
   * proxy canvas
   */
  private proxyCanvas() {
    if (this.enabled && this.conf?.enable && this.conf.fingerprint?.other?.canvas?.type !== HookType.default) {
      // proxy
      if (!this.rawToDataURL) {
        this.rawToDataURL = this.win.HTMLCanvasElement.prototype.toDataURL
      }
      this.win.HTMLCanvasElement.prototype.toDataURL = new Proxy(this.rawToDataURL, {
        apply: (target, thisArg, args: Parameters<typeof HTMLCanvasElement.prototype.toDataURL>) => {
          const value = this.getValue('other', 'canvas')
          if (value !== null) {
            let ctx = thisArg.getContext('2d');
            if (ctx !== null) {
              let style = ctx.fillStyle;
              ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
              ctx.fillText(value, 0, 2)
              ctx.fillStyle = style;
            }
          }
          return target.apply(thisArg, args);
        }
      })
    } else {
      // unproxy
      if (this.rawToDataURL) {
        this.win.HTMLCanvasElement.prototype.toDataURL = this.rawToDataURL
      }
    }
  }

  /**
   * proxy audio
   * 会稍微影响某些audio的质量
   */
  private proxyAudio() {
    if (this.enabled && this.conf?.enable && this.conf.fingerprint?.other?.audio?.type !== HookType.default) {
      // proxy
      if (!this.rawCreateDynamicsCompressor) {
        this.rawCreateDynamicsCompressor = this.win.OfflineAudioContext.prototype.createDynamicsCompressor
      }
      this.win.OfflineAudioContext.prototype.createDynamicsCompressor = new Proxy(this.rawCreateDynamicsCompressor, {
        apply: (target, thisArg: OfflineAudioContext, args: Parameters<typeof OfflineAudioContext.prototype.createDynamicsCompressor>) => {
          const value = this.getValue('other', 'audio')
          if (value === null) return target.apply(thisArg, args)
          const compressor = target.apply(thisArg, args)
          // 创建一个增益节点，添加噪音
          const gain = thisArg.createGain()
          // 根据需要设置噪音的强度
          gain.gain.value = (value as number) ?? Math.random() * 0.01
          compressor.connect(gain)
          // 将增益节点的输出连接到上下文的目标
          gain.connect(thisArg.destination)
          return compressor
        }
      })
    } else {
      // unproxy
      if (this.rawCreateDynamicsCompressor) {
        this.win.OfflineAudioContext.prototype.createDynamicsCompressor = this.rawCreateDynamicsCompressor
      }
    }
  }

  /**
   * proxy WebGL
   */
  private proxyWebGL() {
    if (this.enabled && this.conf?.enable && this.conf.fingerprint?.other?.webgl?.type !== HookType.default) {
      // proxy
      if (!this.rawWglGetParameter) {
        this.rawWglGetParameter = this.win.WebGLRenderingContext.prototype.getParameter
      }
      if (!this.rawWgl2GetParameter) {
        this.rawWgl2GetParameter = this.win.WebGL2RenderingContext.prototype.getParameter
      }

      const apply = (
        target: typeof WebGLRenderingContext.prototype.getParameter | typeof WebGL2RenderingContext.prototype.getParameter,
        thisArg: WebGLRenderingContext | WebGL2RenderingContext,
        args: Parameters<typeof WebGLRenderingContext.prototype.getParameter> | Parameters<typeof WebGL2RenderingContext.prototype.getParameter>
      ) => {
        const value = this.getValue('other', 'webgl')
        if (value !== null) {
          const debugEx = thisArg.getExtension('WEBGL_debug_renderer_info')
          if (debugEx !== null && args[0] === debugEx.UNMASKED_RENDERER_WEBGL) {
            return value
          }
        }
        return target.apply(thisArg, args)
      }

      this.win.WebGLRenderingContext.prototype.getParameter = new Proxy(this.rawWglGetParameter, { apply })
      this.win.WebGL2RenderingContext.prototype.getParameter = new Proxy(this.rawWgl2GetParameter, { apply })
    } else {
      // unproxy
      if (this.rawWglGetParameter) {
        this.win.WebGLRenderingContext.prototype.getParameter = this.rawWglGetParameter
      }
      if (this.rawWgl2GetParameter) {
        this.win.WebGL2RenderingContext.prototype.getParameter = this.rawWgl2GetParameter
      }
    }
  }

  /**
   * proxy time zone
   */
  private proxyTimeZone() {
    if (this.enabled && this.conf?.enable && this.conf.fingerprint?.other?.timezone?.type !== HookType.default) {
      // proxy
      if (!this.rawDateTimeFormat) {
        this.rawDateTimeFormat = this.win.Intl.DateTimeFormat
      }
      if (!this.rawGetTimezoneOffset) {
        this.rawGetTimezoneOffset = this.win.Date.prototype.getTimezoneOffset
      }
      const currTimeZone = this.getValue('other', 'timezone') as TimeZoneInfo

      this.win.Intl.DateTimeFormat = new Proxy(this.rawDateTimeFormat, {
        construct(target, args: Parameters<typeof Intl.DateTimeFormat>, newTarget) {
          args[0] = args[0] ?? currTimeZone.locale
          args[1] = Object.assign({ timeZone: currTimeZone.zone }, args[1]);
          return new target(...args)
        },
        apply(target, thisArg: Intl.DateTimeFormat, args: Parameters<typeof Intl.DateTimeFormat>) {
          args[0] = args[0] ?? currTimeZone.locale
          args[1] = Object.assign({ timeZone: currTimeZone.zone }, args[1]);
          return target.apply(thisArg, args)
        },
      })

      this.win.Date.prototype.getTimezoneOffset = new Proxy(this.rawGetTimezoneOffset, {
        apply(target, thisArg: Date, args: Parameters<typeof Date.prototype.getTimezoneOffset>) {
          // return target.apply(thisArg, args)
          return currTimeZone.offset * -60
        }
      })
    } else {
      // unproxy
      if (this.rawDateTimeFormat) {
        this.win.Intl.DateTimeFormat = this.rawDateTimeFormat
      }
      if (this.rawGetTimezoneOffset) {
        this.win.Date.prototype.getTimezoneOffset = this.rawGetTimezoneOffset
      }
    }
  }

  /**
   * proxy WebRTC
   */
  private proxyWebRTC() {
    if (this.enabled && this.conf?.enable && this.conf.fingerprint?.other?.webrtc?.type !== HookType.default) {
      // proxy

    } else {
      // unproxy

    }
  }

}
