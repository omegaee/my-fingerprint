import deepmerge from "deepmerge";
import { HookType } from '@/types/enum'
import { randomAudioNoise, randomCanvasNoise, randomColorDepth, randomEquipmentInfo, randomHardwareConcurrency, randomLanguage, randomPixelDepth, randomScreenSize, randomWebglRander } from "./data";
import { debounce } from "./timer";
import { postSetHookRecords } from "@/message/content";

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

/**
 * 从hook缓存或指定函数中获取值
 */
const getValueFromCacheOrFunc = (key: HookFingerprintKey, seedFunc: (seed: number) => any): any | null => {
  if (!cache[key]) {
    const res = seedFunc(1000000)
    if(res === null || res === undefined) return null 
    if(typeof(res) === 'object'){
      Object.assign(cache, res)
    }else{
      cache[key] = res
    }
  }
  return cache[key] ?? null
}

export class FingerprintHandler {
  private conf: DeepPartial<LocalStorageConfig> | undefined

  public constructor(config?: DeepPartial<LocalStorageConfig>) {
    if (!config) return
    this.set(config)
  }

  /**
   * 配置
   */
  public set(config: DeepPartial<LocalStorageConfig>) {
    if (this.conf) {
      deepmerge(this.conf, config, { clone: false })
    } else {
      this.conf = config
    }

    const reExecute = config.enable !== undefined

    if (reExecute || config.fingerprint?.navigator) {
      this.proxyNavigator()
    }
    if (reExecute || config.fingerprint?.screen) {
      this.proxyScreen()
    }
    if (reExecute || config.fingerprint?.other?.timezone) {
      this.proxyTimeZone()
    }
    if (reExecute || config.fingerprint?.other?.canvas) {
      this.proxyCanvas()
    }
    if (reExecute || config.fingerprint?.other?.audio) {
      this.proxyAudio()
    }
    if (reExecute || config.fingerprint?.other?.webgl) {
      this.proxyWebGL()
    }
    if (reExecute || config.fingerprint?.other?.webrtc) {
      this.proxyWebRTC()
    }

    if (reExecute) {
      this.proxyGetOwnPropertyDescriptor()
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
 * 获取并记录值
 */
  private getValue(key: string): any | null {
    let res = null
    switch (key) {
      case "appVersion": {
        res = getValueFromCacheOrFunc(key, randomEquipmentInfo)
        break
      }
      case "platform": {
        res = getValueFromCacheOrFunc(key, randomEquipmentInfo)
        break
      }
      case "userAgent": {
        res = getValueFromCacheOrFunc(key, randomEquipmentInfo)
        break
      }
      case "language": {
        res = getValueFromCacheOrFunc(key, randomLanguage)
        break
      }
      case "hardwareConcurrency": {
        res = getValueFromCacheOrFunc(key, randomHardwareConcurrency)
        break
      }
      case "height": {
        res = getValueFromCacheOrFunc(key, randomScreenSize)
        break
      }
      case "width": {
        res = getValueFromCacheOrFunc(key, randomScreenSize)
        break
      }
      case "colorDepth": {
        res = getValueFromCacheOrFunc(key, randomColorDepth)
        break
      }
      case "pixelDepth": {
        res = getValueFromCacheOrFunc(key, randomPixelDepth)
        break
      }
      case "canvas": {
        res = getValueFromCacheOrFunc(key, randomCanvasNoise)
        break
      }
      case "audio": {
        res = getValueFromCacheOrFunc(key, randomAudioNoise)
        break
      }
      case "webgl": {
        res = getValueFromCacheOrFunc(key, randomWebglRander)
        break
      }
      case "webrtc": {
        break
      }
      case "timezone": {
        res = getValueFromCacheOrFunc(key, () => {
          const timezoneMode = this.conf?.fingerprint?.other?.timezone
          if(timezoneMode?.type === HookType.value){
            return timezoneMode.value
          }
        })
        break
      }
    }
    if (res !== null) {
      // 记录
      recordAndSend(key as HookFingerprintKey)
    }
    return res
  }

  /**
   * proxy Object.getOwnPropertyDescriptor
   */
  private proxyGetOwnPropertyDescriptor() {
    if (this.conf?.enable) {
      // proxy
      if (!this.rawGetOwnPropertyDescriptor) {
        this.rawGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
      }
      const navigatorDesc = this.rawNavigatorDescriptor ?? Object.getOwnPropertyDescriptor(window, 'navigator')
      const screenDesc = this.rawScreenDescriptor ?? Object.getOwnPropertyDescriptor(window, 'screen')

      Object.getOwnPropertyDescriptor = new Proxy(this.rawGetOwnPropertyDescriptor, {
        apply: (target, thisArg: Object, args: Parameters<typeof Object.getOwnPropertyDescriptor>) => {
          const [obj, prop] = args
          if (obj === window) {
            if (prop === 'navigator') return navigatorDesc
            if (prop === 'screen') return screenDesc
          }
          return target.apply(thisArg, args)
        }
      })
    } else {
      // unproxy
      if (this.rawGetOwnPropertyDescriptor) {
        Object.getOwnPropertyDescriptor = this.rawGetOwnPropertyDescriptor
      }
    }
  }

  /**
   * proxy navigator
   */
  private proxyNavigator() {
    if (this.conf?.enable && !this.isAllDefault(this.conf?.fingerprint?.navigator)) {
      // proxy
      if (!this.rawNavigatorDescriptor) {
        this.rawNavigatorDescriptor = Object.getOwnPropertyDescriptor(window, "navigator");
      }
      Object.defineProperty(window, 'navigator', {
        value: new Proxy(window.navigator, {
          get: (target, key: string) => {
            if (key in target) {
              const value = this.getValue(key)
              if (value !== null) {
                return value
              }
              const res = target[key as keyof Navigator]
              if (typeof res === "function") return res.bind(target)
              else return res
            } else {
              return undefined
            }
          }
        })
      });
    } else {
      // unproxy
      if (this.rawNavigatorDescriptor) {
        Object.defineProperty(window, "navigator", this.rawNavigatorDescriptor)
      }
    }

  }

  /**
   * proxy screen
   */
  private proxyScreen() {
    if (this.conf?.enable && !this.isAllDefault(this.conf?.fingerprint?.screen)) {
      // proxy
      if (!this.rawScreenDescriptor) {
        this.rawScreenDescriptor = Object.getOwnPropertyDescriptor(window, "screen");
      }
      Object.defineProperty(window, 'screen', {
        value: new Proxy(window.screen, {
          get: (target, key: string) => {
            if (key in target) {
              const value = this.getValue(key)
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
        Object.defineProperty(window, "screen", this.rawScreenDescriptor)
      }
    }
  }

  /**
   * proxy canvas
   */
  private proxyCanvas() {
    if (this.conf?.enable && this.conf.fingerprint?.other?.canvas?.type !== HookType.default) {
      // proxy
      if (!this.rawToDataURL) {
        this.rawToDataURL = HTMLCanvasElement.prototype.toDataURL
      }
      HTMLCanvasElement.prototype.toDataURL = new Proxy(this.rawToDataURL, {
        apply: (target, thisArg, args: Parameters<typeof HTMLCanvasElement.prototype.toDataURL>) => {
          const value = this.getValue('canvas')
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
        HTMLCanvasElement.prototype.toDataURL = this.rawToDataURL
      }
    }
  }

  /**
   * proxy audio
   * 会稍微影响某些audio的质量
   */
  private proxyAudio() {
    if (this.conf?.enable && this.conf.fingerprint?.other?.audio?.type !== HookType.default) {
      // proxy
      if (!this.rawCreateDynamicsCompressor) {
        this.rawCreateDynamicsCompressor = OfflineAudioContext.prototype.createDynamicsCompressor
      }
      OfflineAudioContext.prototype.createDynamicsCompressor = new Proxy(this.rawCreateDynamicsCompressor, {
        apply: (target, thisArg: OfflineAudioContext, args: Parameters<typeof OfflineAudioContext.prototype.createDynamicsCompressor>) => {
          const value = this.getValue('audio')
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
        OfflineAudioContext.prototype.createDynamicsCompressor = this.rawCreateDynamicsCompressor
      }
    }
  }

  /**
   * proxy WebGL
   */
  private proxyWebGL() {
    if (this.conf?.enable && this.conf.fingerprint?.other?.webgl?.type !== HookType.default) {
      // proxy
      if (!this.rawWglGetParameter) {
        this.rawWglGetParameter = WebGLRenderingContext.prototype.getParameter
      }
      if (!this.rawWgl2GetParameter) {
        this.rawWgl2GetParameter = WebGL2RenderingContext.prototype.getParameter
      }

      const apply = (
        target: typeof WebGLRenderingContext.prototype.getParameter | typeof WebGL2RenderingContext.prototype.getParameter,
        thisArg: WebGLRenderingContext | WebGL2RenderingContext,
        args: Parameters<typeof WebGLRenderingContext.prototype.getParameter> | Parameters<typeof WebGL2RenderingContext.prototype.getParameter>
      ) => {
        const value = this.getValue('webgl')
        if (value !== null) {
          const debugEx = thisArg.getExtension('WEBGL_debug_renderer_info')
          if (debugEx !== null && args[0] === debugEx.UNMASKED_RENDERER_WEBGL) {
            return value
          }
        }
        return target.apply(thisArg, args)
      }

      WebGLRenderingContext.prototype.getParameter = new Proxy(this.rawWglGetParameter, { apply })
      WebGL2RenderingContext.prototype.getParameter = new Proxy(this.rawWgl2GetParameter, { apply })
    } else {
      // unproxy
      if (this.rawWglGetParameter) {
        WebGLRenderingContext.prototype.getParameter = this.rawWglGetParameter
      }
      if (this.rawWgl2GetParameter) {
        WebGL2RenderingContext.prototype.getParameter = this.rawWgl2GetParameter
      }
    }
  }

  /**
   * proxy time zone
   */
  private proxyTimeZone() {
    if (this.conf?.enable && this.conf.fingerprint?.other?.timezone?.type !== HookType.default) {
      // proxy
      if(!this.rawDateTimeFormat){
        this.rawDateTimeFormat = Intl.DateTimeFormat
      }
      if(!this.rawGetTimezoneOffset){
        this.rawGetTimezoneOffset = Date.prototype.getTimezoneOffset
      }
      const currTimeZone = this.getValue('timezone') as TimeZoneInfo

      Intl.DateTimeFormat = new Proxy(this.rawDateTimeFormat, {
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

      Date.prototype.getTimezoneOffset = new Proxy(this.rawGetTimezoneOffset, {
        apply(target, thisArg: Date, args: Parameters<typeof Date.prototype.getTimezoneOffset>) {
          // return target.apply(thisArg, args)
          return currTimeZone.offset * -60
        }
      })
    } else {
      // unproxy
      if(this.rawDateTimeFormat){
        Intl.DateTimeFormat = this.rawDateTimeFormat
      }
      if(this.rawGetTimezoneOffset){
        Date.prototype.getTimezoneOffset = this.rawGetTimezoneOffset
      }
    }
  }

  /**
   * proxy WebRTC
   */
  private proxyWebRTC() {
    if (this.conf?.enable && this.conf.fingerprint?.other?.webrtc?.type !== HookType.default) {
      // proxy

    } else {
      // unproxy

    }
  }

}
