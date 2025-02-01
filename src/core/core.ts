import deepmerge from "deepmerge";
import { HookType } from '@/types/enum'
import {
  randomCanvasNoise,
  randomFontNoise,
  randomLanguage,
  randomLanguages,
  randomScreenSize,
  randomWebglNoise,
  seededEl,
  seededRandom,
} from "../utils/data";
import { debounce, debounceByFirstArg } from "../utils/timer";
import { postSetHookRecords, unwrapMessage } from "@/message/content";
import { genRandomSeed } from "../utils/base";
import { ContentMsg } from '@/types/enum'
import hookTasks from "./tasks";

export type HookTask = {
  name: string
  onlyOnceEnable?: boolean  // 是否onEnable只执行一次
  condition?: (fh: FingerprintHandler) => boolean | undefined
  onEnable?: (fh: FingerprintHandler) => void
  onDisable?: (fh: FingerprintHandler) => void
}

export interface RawHookObject {
  navigatorDescriptor: PropertyDescriptor
  screenDescriptor: PropertyDescriptor

  DateTimeFormat: typeof Intl.DateTimeFormat
  Date: typeof Date

  getOwnPropertyDescriptor: typeof Object.getOwnPropertyDescriptor

  toDataURL: typeof HTMLCanvasElement.prototype.toDataURL
  getImageData: typeof CanvasRenderingContext2D.prototype.getImageData
  getContext: typeof HTMLCanvasElement.prototype.getContext

  readPixels: typeof WebGLRenderingContext.prototype.readPixels
  getSupportedExtensions: typeof WebGLRenderingContext.prototype.getSupportedExtensions
  readPixels2: typeof WebGL2RenderingContext.prototype.readPixels
  getSupportedExtensions2: typeof WebGL2RenderingContext.prototype.getSupportedExtensions

  createDynamicsCompressor: typeof OfflineAudioContext.prototype.createDynamicsCompressor

  dateGetTimezoneOffset: typeof Date.prototype.getTimezoneOffset
  dateToString: typeof Date.prototype.toString
  dateToDateString: typeof Date.prototype.toDateString
  dateToTimeString: typeof Date.prototype.toTimeString
  dateToLocaleString: typeof Date.prototype.toLocaleString
  dateToLocaleDateString: typeof Date.prototype.toLocaleDateString
  dateToLocaleTimeString: typeof Date.prototype.toLocaleTimeString

  appendChild: typeof HTMLElement.prototype.appendChild
  insertBefore: typeof HTMLElement.prototype.insertBefore
  replaceChild: typeof HTMLElement.prototype.replaceChild
}

const RAW = {
  // chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  hardwareConcurrencys: [8, 12, 16],
  colorDepths: [16, 24, 32],
  pixelDepths: [16, 24, 32],
}

/**
 * Random Value
 */
// type RandomFuncMap = Record<FuncKey, RandomFunc>
const randomFuncMap = {
  'navigator.language': randomLanguage,
  'navigator.languages': randomLanguages,
  'navigator.hardwareConcurrency': (seed: number) => seededEl(RAW.hardwareConcurrencys, seed),
  'screen.height': (seed: number) => randomScreenSize(seed).height,
  'screen.width': (seed: number) => randomScreenSize(seed).width,
  'screen.colorDepth': (seed: number) => seededEl(RAW.colorDepths, seed),
  'screen.pixelDepth': (seed: number) => seededEl(RAW.pixelDepths, seed),
  'other.canvas': randomCanvasNoise,
  'other.audio': undefined,
  'other.webgl': randomWebglNoise,
  'other.font': randomFontNoise,
  'other.webgpu': undefined,
}

/**
 * Custom Value
 */
// type ValueFuncMap = Record<FuncKey, ValueFunc>
const valueFuncMap = {
  'other.timezone': undefined,
}

type RandomFunc = (seed: number, args?: any) => any
type ValueFunc = (value: any, args?: any) => any
type FuncKey = keyof typeof randomFuncMap | keyof typeof valueFuncMap

// record缓存
const hookRecords: Map<string, number> = new Map()

/**
 * 发送record消息
 */
export const sendRecordMessage = debounce(() => {
  postSetHookRecords(Object.fromEntries(hookRecords))
})

/**
 * 记录并发送消息
 */
export const recordAndSend = function (key: string) {
  const parts = key.split('.')
  key = parts[parts.length - 1]
  const oldValue = hookRecords.get(key) ?? 0
  hookRecords.set(key, oldValue + 1)
  sendRecordMessage()
}

export const recordAndSendDebounce = debounceByFirstArg(recordAndSend, 200)

export type WindowInfo = {
  tabId: number,
  host: string,
  inWhitelist: boolean,
}

type SeedInfo = {
  page: number
  domain: number
  browser: number
  global: number
}

export class FingerprintHandler {
  public win: Window & typeof globalThis
  public info: WindowInfo
  public seed: SeedInfo

  public conf: LocalStorageConfig

  public rawObjects: Partial<RawHookObject> = {}
  private onlyRecord: Record<string, boolean> = {}

  public constructor(win: Window & typeof globalThis, info: WindowInfo, config: LocalStorageConfig) {
    this.win = win
    this.info = info
    this.conf = config
    
    this.seed = {
      page: Math.floor(seededRandom(info.tabId, Number.MAX_SAFE_INTEGER, 1)),
      domain: Math.floor(seededRandom(info.host, Number.MAX_SAFE_INTEGER, 1)),
      browser: config.browserSeed ?? genRandomSeed(),
      global: config.customSeed ?? genRandomSeed(),
    }

    if (!win) return
    const key = '__MyFingerprint__' + info.tabId
    if (!win[key as any]) {
      // @ts-ignore
      win[key] = true
      this.listenMessage()
      this.refresh()
    }
  }

  /**
   * 监听消息
   */
  private listenMessage() {
    // 接收顶级window对象的消息
    this.win.addEventListener('message', (ev) => {
      // if (ev.origin != location.origin) return
      const msg = unwrapMessage(ev.data) as ContentRequest | undefined
      switch (msg?.type) {
        case ContentMsg.SetConfig: {
          this.setConfig(msg.config)
          break
        }
        case ContentMsg.ChangeWhitelist: {
          if (msg.mode === 'into') {
            this.info.inWhitelist = true
          } else if (msg.mode === 'leave') {
            this.info.inWhitelist = false
          }
          this.refresh()
          break
        }
      }
    })
  }

  /**
   * 脚本是否启动
   */
  public isEnable() {
    return !!this.conf.enable && !this.info.inWhitelist
  }

  /**
   * 配置
   */
  public setConfig(config?: DeepPartial<LocalStorageConfig>) {
    if (!config) return
    if (this.conf) {
      this.conf = deepmerge(this.conf, config) as LocalStorageConfig
    } else {
      this.conf = config as LocalStorageConfig
    }
    this.refresh()
  }

  /**
   * 刷新hook内容
   */
  public refresh() {
    const enable = this.isEnable()
    for (const task of hookTasks) {
      if (enable && (!task.condition || task.condition(this) === true)) {
        if (task.onlyOnceEnable === true) {
          // 仅执行一次onEnable
          if (!this.onlyRecord[task.name]) {
            task.onEnable?.(this)
            this.onlyRecord[task.name] = true
          }
        } else {
          task.onEnable?.(this)
        }
      } else {
        task.onDisable?.(this)
      }
    }
  }

  /**
   * hook iframe
   */
  public hookIframe = (iframe: HTMLIFrameElement) => {
    new FingerprintHandler(iframe.contentWindow as any, this.info, this.conf)
  }

  /**
   * 是否所有字段的type都是default
   * ops为空则返回true
   */
  public isAllDefault(ops?: Record<string, HookMode>) {
    if (!ops) return true
    for (const value of Object.values(ops)) {
      if (value!.type !== HookType.default) return false
    }
    return true
  }

  /**
   * 获取value对应的的seed
   */
  public getSeedByHookValue = (value?: any): number | null => {
    switch (value?.type) {
      case HookType.page:
        return this.seed.page
      case HookType.domain:
        return this.seed.domain
      case HookType.browser:
        return this.seed.browser
      case HookType.global:
        return this.seed.global
      case HookType.default:
      default:
        return null
    }
  }

  private _getValue = (key: FuncKey, mode: HookMode, args?: any): any | null => {
    switch (mode.type) {
      case HookType.default: {
        return null
      }
      case HookType.value: {
        const func: ValueFunc | undefined = (valueFuncMap as any)[key];
        return func ? func(mode.value, args) : mode.value;
      }
      case HookType.browser:
      case HookType.domain:
      case HookType.global:
      case HookType.page: {
        const func: RandomFunc | undefined = (randomFuncMap as any)[key];
        if (func) {
          const seed = this.getSeedByHookValue(mode)
          if (seed !== null) return func(seed, args);
        }
        return null
      }
      default: {
        return null
      }
    }
  }

  public getValue = (key: FuncKey, mode?: HookMode, args?: any): any | null => {
    if (!mode) return null;
    recordAndSend(key)
    return this._getValue(key, mode, args)
  }

  public getValueDebounce = (key: FuncKey, mode?: HookMode, args?: any): any | null => {
    if (!mode) return null;
    recordAndSendDebounce(key)
    return this._getValue(key, mode, args)
  }

  public random = (key: FuncKey, mode?: HookMode, offset: number = 0, max: number = 1, min: number = 0) => {
    recordAndSend(key)
    const seed = this.getSeedByHookValue(mode)
    return seed === null ? null : seededRandom(seed + (offset * 10), max, min)
  }

  public randomDebounce = (key: FuncKey, mode?: HookMode, offset: number = 0, max: number = 1, min: number = 0) => {
    recordAndSendDebounce(key)
    const seed = this.getSeedByHookValue(mode)
    return seed === null ? null : seededRandom(seed + (offset * 10), max, min)
  }

}
