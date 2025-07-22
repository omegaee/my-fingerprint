import { HookType } from '@/types/enum'
import {
  randomCanvasNoise,
  randomFontNoise,
  randomWebglNoise,
} from "../utils/data";
import { shuffleArray, seededEl, seededRandom } from "@/utils/base";
import { debounce, debounceByFirstArg } from "../utils/timer";
import { MContentType, sendContentMessage } from "@/message/content";
import { genRandomSeed } from "../utils/base";
import hookTasks from "./tasks";

export type HookTask = {
  name: string
  condition?: (fh: FingerprintHandler) => boolean | undefined
  onEnable?: (fh: FingerprintHandler) => void
}

export interface RawHookObject {
  getImageData: typeof CanvasRenderingContext2D.prototype.getImageData
}

// export const WIN_KEY = Symbol('__my_fingerprint__')
export const WIN_KEY = 'my_fingerprint'

const RAW = {
  languages: navigator.languages,
  width: screen.width,
  height: screen.height,
}

const RANDOM = {
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
  'navigator.language': (seed: number) => seededEl(RAW.languages, seed),
  'navigator.languages': (seed: number) => shuffleArray(RAW.languages, seed),
  'navigator.hardwareConcurrency': (seed: number) => seededEl(RANDOM.hardwareConcurrencys, seed),
  'screen.height': (seed: number) => {
    const offset = (seed % 100) - 50
    const width = RAW.width + offset
    return Math.round((width * RAW.height) / RAW.width)
  },
  'screen.width': (seed: number) => {
    const offset = (seed % 100) - 50
    return RAW.width + offset
  },
  'screen.colorDepth': (seed: number) => seededEl(RANDOM.colorDepths, seed),
  'screen.pixelDepth': (seed: number) => seededEl(RANDOM.pixelDepths, seed),
  'other.canvas': randomCanvasNoise,
  'other.audio': undefined,
  'other.webgl': randomWebglNoise,
  'other.font': randomFontNoise,
  'other.webgpu': undefined,
  'other.domRect': undefined,
}

/**
 * Custom Value
 */
// type ValueFuncMap = Record<FuncKey, ValueFunc>
const valueFuncMap = {
  'other.timezone': undefined,
  'normal.glVendor': undefined,
  'normal.glRenderer': undefined,
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
  sendContentMessage(window.top ?? window, {
    type: MContentType.SetHookRecords,
    data: Object.fromEntries(hookRecords),
  }, '*')
})

/**
 * 记录并发送消息
 */
export const recordHook = function (key: string) {
  const parts = key.split('.')
  key = parts[parts.length - 1]
  const oldValue = hookRecords.get(key) ?? 0
  hookRecords.set(key, oldValue + 1)
  sendRecordMessage()
}

export const recordHookDebounce = debounceByFirstArg(recordHook, 200)

type SeedInfo = {
  page: number
  domain: number
  browser: number
  global: number
}

export class FingerprintHandler {
  public win: Window & typeof globalThis
  public info: WindowStorage
  public seed: SeedInfo

  public conf: LocalStorageConfig

  public rawObjects: Partial<RawHookObject> = {}

  /// hook存储
  public registry = new WeakSet<object>()

  /// hook索引
  public symbol = {
    own: Symbol('OwnProperty'),
    raw: Symbol('RawValue'),
  }

  /// hook工具
  public hooks = {
    useBaseHandler: <T extends Object = any>(handler: ProxyHandler<T>): ProxyHandler<T> => ({
      ...handler,
      get: (target: any, prop: any, receiver: any) => {
        if (prop === this.symbol.raw) return target;
        if (prop === 'caller' || prop === 'arguments') return target[prop];
        const getter = handler.get ?? Reflect.get
        return getter(target, prop, receiver)
      }
    }),
    newProxy: <T extends object>(target: T, handler: ProxyHandler<T>): T => {
      const proxy = new Proxy(target, handler)
      this.registry.add(proxy)
      return proxy
    },
    newBaseProxy: <T extends object>(target: T, handler: ProxyHandler<T>): T => {
      return this.hooks.newProxy(target, this.hooks.useBaseHandler(handler))
    }
  }

  public constructor(win: Window & typeof globalThis, info: WindowStorage, config: LocalStorageConfig) {
    if (!win) throw new Error('win is required');
    if (win === window.top) {
      if (info.hooked) throw new Error('win is already hooked');
      info.hooked = true;
    } else {
      let hooked: boolean = false
      try {
        // @ts-ignore
        hooked = win[WIN_KEY]
      } catch (_) {
        throw new Error('unable to access cross source');
      }
      if (hooked) throw new Error('win is already hooked');
      // @ts-ignore
      win[WIN_KEY] = true;
    }

    this.win = win
    this.info = info
    this.conf = config

    this.seed = {
      page: info.seed,
      domain: Math.floor(seededRandom(info.host, Number.MAX_SAFE_INTEGER, 1)),
      browser: config.seed.browser ?? genRandomSeed(),
      global: config.seed.global ?? genRandomSeed(),
    }

    // this.listenMessage()
    this.hookContent()
  }

  /**
   * 脚本是否启动
   */
  public isEnable() {
    return !!this.conf.enable
  }

  /**
   * hook内容
   */
  public hookContent() {
    if (!this.isEnable()) return;
    for (const task of hookTasks) {
      if (!task.condition || task.condition(this) === true) {
        task.onEnable?.(this)
      }
    }
  }

  /**
   * hook iframe
   */
  public hookIframe = (iframe: HTMLIFrameElement) => {
    try {
      new FingerprintHandler(iframe.contentWindow as any, this.info, this.conf)
    } catch (_) { }
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
  public getSeed = (type?: HookType): number | null => {
    switch (type) {
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
          const seed = this.getSeed(mode.type)
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
    recordHook(key)
    return this._getValue(key, mode, args)
  }

  public getValueDebounce = (key: FuncKey, mode?: HookMode, args?: any): any | null => {
    if (!mode) return null;
    recordHookDebounce(key)
    return this._getValue(key, mode, args)
  }

  public random = (key: FuncKey, mode?: HookMode, offset: number = 0, max: number = 1, min: number = 0) => {
    recordHook(key)
    const seed = this.getSeed(mode?.type)
    return seed === null ? null : seededRandom(seed + (offset * 10), max, min)
  }

  public randomDebounce = (key: FuncKey, mode?: HookMode, offset: number = 0, max: number = 1, min: number = 0) => {
    recordHookDebounce(key)
    const seed = this.getSeed(mode?.type)
    return seed === null ? null : seededRandom(seed + (offset * 10), max, min)
  }

}
