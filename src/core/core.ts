import deepmerge from "deepmerge";
import { HookType } from '@/types/enum'
import { randomAudioNoise, randomCanvasNoise, randomColorDepth, randomHardwareConcurrency, randomLanguage, randomPixelDepth, randomScreenSize, randomWebglColor, randomWebglRander, seededRandom } from "../utils/data";
import { debounce } from "../utils/timer";
import { postSetHookRecords, unwrapMessage } from "@/message/content";
import { genRandomSeed, hashNumberFromString } from "../utils/base";
import { ContentMsg } from '@/types/enum'
import { EquipmentInfoHandler } from "@/utils/equipment";
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

  getOwnPropertyDescriptor: typeof Object.getOwnPropertyDescriptor
  toDataURL: typeof HTMLCanvasElement.prototype.toDataURL
  createDynamicsCompressor: typeof OfflineAudioContext.prototype.createDynamicsCompressor
  wglGetParameter: typeof WebGLRenderingContext.prototype.getParameter
  wgl2GetParameter: typeof WebGL2RenderingContext.prototype.getParameter
  wglShaderSource: typeof WebGLRenderingContext.prototype.shaderSource
  wgl2ShaderSource: typeof WebGL2RenderingContext.prototype.shaderSource
  getTimezoneOffset: typeof Date.prototype.getTimezoneOffset
  appendChild: typeof HTMLElement.prototype.appendChild
  insertBefore: typeof HTMLElement.prototype.insertBefore
  replaceChild: typeof HTMLElement.prototype.replaceChild
}

/**
 * 允许随机的getValue
 * [prefix.key#opt]
 */
const seedFuncMap = {
  'navigator.language': randomLanguage,
  'navigator.hardwareConcurrency': randomHardwareConcurrency,
  'screen.height': (seed: number) => randomScreenSize(seed).height,
  'screen.width': (seed: number) => randomScreenSize(seed).width,
  'screen.colorDepth': randomColorDepth,
  'screen.pixelDepth': randomPixelDepth,
  'other.canvas': randomCanvasNoise,
  'other.audio': randomAudioNoise,
  'other.webgl#info': randomWebglRander,
  'other.webgl#color': randomWebglColor,
  'other.webrtc': (seed: number) => {},
}

/**
 * 非随机的getValue
 */
const valueFuncMap = {
  'other.timezone': (value: TimeZoneInfo) => value,
}

// hook缓存
// const cache: Partial<Record<HookFingerprintKey, any>> = {}
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
  const oldValue = hookRecords.get(key) ?? 0
  hookRecords.set(key, oldValue + 1)
  sendRecordMessage()
}

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

  public conf: DeepPartial<LocalStorageConfig>

  public equipmentHandler?: EquipmentInfoHandler

  public rawObjects: Partial<RawHookObject> = {}
  private onlyRecord: Record<string, boolean> = {}

  public constructor(win: Window & typeof globalThis, info: WindowInfo, config: DeepPartial<LocalStorageConfig>) {
    this.win = win
    this.info = info
    this.conf = config
    this.seed = {
      page: seededRandom(info.tabId),
      domain: hashNumberFromString(info.host),
      browser: config.browserSeed ?? genRandomSeed(),
      global: config.customSeed ?? genRandomSeed(),
    }

    if(!win)return
    const key = '__MyFingerprint__' + info.tabId
    if(!win[key as any]){  
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
      this.conf = deepmerge(this.conf, config)
    } else {
      this.conf = config
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
        if (task.onlyOnceEnable === true){
          // 仅执行一次onEnable
          if (!this.onlyRecord[task.name]){
            task.onEnable?.(this)
            this.onlyRecord[task.name] = true
          }
        }else{
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
  public hookIframe(iframe: HTMLIFrameElement) {
    new FingerprintHandler(iframe.contentWindow as any, this.info, this.conf)
  }

  /**
   * 是否所有字段的type都是default
   * ops为空则返回true
   */
  public isAllDefault(ops?: DeepPartial<Record<string, HookMode>>) {
    if (!ops) return true
    for (const value of Object.values(ops)) {
      if (value!.type !== HookType.default) return false
    }
    return true
  }

  /**
   * 获取value对应的的seed
   */
  public getSeedByHookValue = (value?: any) => {
    switch (value?.type) {
      case HookType.page: {
        return this.seed.page
      }
      case HookType.domain: {
        return this.seed.domain
      }
      case HookType.browser: {
        return this.seed.browser
      }
      case HookType.global: {
        return this.seed.global
      }
      case HookType.default:
      default: return null
    }
  }

  public getValue(prefix: string, key: string, opt?: string): any | null{
    // @ts-ignore
    const mode: HookMode = this.conf.fingerprint?.[prefix]?.[key]
    if(!mode) return null;

    recordAndSend(key)  // 记录
    const target = `${prefix}.${key}${opt ? '#'+opt : ''}`

    // @ts-ignore
    const seedFunc = seedFuncMap[target]
    if(seedFunc){
      if(mode.type === HookType.value) return null;
      const seed = this.getSeedByHookValue(mode)
      return seedFunc(seed)
    }

    // @ts-ignore
    const valueFunc = valueFuncMap[target]
    if(valueFunc){
      if(mode.type !== HookType.value || mode.value === undefined) return null;
      return valueFunc(mode.value)
    }

    return null
  }

}
