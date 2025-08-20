import { HookType } from '@/types/enum'
import { seededRandom } from "@/utils/base";
import { genRandomSeed } from "../utils/base";
import { hookTasks } from "./tasks";
import { notifyIframeOrigin } from './utils';

export type HookTask = {
  // 条件，为空则默认为true
  condition?: (ctx: FingerprintHandler) => boolean | undefined
  // 钩子函数
  onEnable?: (ctx: FingerprintHandler) => void
}

// export const WIN_KEY = Symbol('__my_fingerprint__')
export const WIN_KEY = 'my_fingerprint'

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

  /// hook存储
  public registry = new WeakSet<object>()

  /// hook索引
  public symbol = {
    own: Symbol('OwnProperty'),
    raw: Symbol('RawValue'),
    reflect: Symbol('Reflect'),
  }

  private toProxyHandler = <T extends object>(handler: ProxyHandler<T>): ProxyHandler<T> => {
    return {
      ...handler,
      get: (target: any, prop: any, receiver: any) => {
        if (prop === this.symbol.raw) return target;
        if (prop === 'caller' || prop === 'arguments') return target[prop];
        const getter = handler.get ?? Reflect.get
        return getter(target, prop, receiver)
      },
      setPrototypeOf: (target: any, proto: any) => {
        const raw = this.useRaw(proto)
        if (target === raw && (this.isReg(proto) || this.isReg(proto.__proto__))) {
          if (proto[this.symbol.reflect]) {
            return Reflect.setPrototypeOf(target, raw);
          } else {
            try {
              return Object.setPrototypeOf(target, raw);
            } catch (e: any) {
              // 堆栈伪造
              if (this.info.browser !== 'firefox') {
                const es = e.stack.split('\n')
                es.splice(1, 2);
                e.stack = es.join('\n');
              }
              throw e;
            }
          }
        }
        return Reflect.setPrototypeOf(target, proto)
      },
    }
  }

  /**
   * 判断对象是否注册代理
   */
  public isReg = (target: any) => {
    return this.registry.has(target)
  }

  /**
   * 判断对象以及上游是否注册代理
   */
  public isHasRaw = (target: any) => {
    if (target == null) return false;
    return target[this.symbol.raw] != null
  }

  /**
   * 获取原始值
   * @param target 目标
   */
  public useRaw = <T>(target: T): T => {
    if (target == null) return target;
    const raw = (target as any)[this.symbol.raw]
    return raw ?? target;
  }

  /**
   * 创建代理
   */
  public newProxy = <T extends object>(target: T, handler: ProxyHandler<T>): T => {
    const proxy = new Proxy(target, this.toProxyHandler(handler));
    this.registry.add(proxy);
    return proxy;
  }

  /**
   * 创建代理
   * @param target 目标对象
   * @param key 属性名
   * @param handler 处理对象 | (key) => 处理对象
   */
  public useProxy = <
    T extends object,
    K extends keyof T,
    H extends ProxyHandler<Extract<T[K], object>>,
  >(
    target: T,
    key: K | K[],
    handler: H | ((key: K) => H | void),
  ) => {
    if (Array.isArray(key)) {
      /* multi */
      for (const _k of key) {
        const _handler = typeof handler === 'function' ? handler(_k) : handler;
        if (_handler) {
          const proxy = new Proxy(target[_k] as any, this.toProxyHandler(_handler));
          target[_k] = proxy as T[K];
          this.registry.add(proxy);
        }
      }
    } else {
      /* one */
      const _handler = typeof handler === 'function' ? handler(key) : handler;
      if (_handler) {
        const proxy = new Proxy(target[key] as any, this.toProxyHandler(_handler));
        target[key] = proxy as T[K];
        this.registry.add(proxy);
      }
    }
  }

  /**
   * 定义属性描述符
   * @param target 目标对象 | [获取描述符对象, 写入对象]
   * @param key 属性名
   * @param attributes 属性描述符
   * @returns void
   */
  public useDefine = <
    T extends object,
    K extends keyof T,
    A extends (PropertyDescriptor & ThisType<any>),
    W = any,
  >(
    target: T | [T, W],
    key: K | K[],
    attributes: A | ((key: K, desc: PropertyDescriptor) => A | void)
  ) => {
    /* 处理target */
    let _read: T
    let _write: W | T
    if (Array.isArray(target)) {
      if (!target.length) return;
      _read = target[0]
      _write = target[1] ?? _read
    } else {
      _read = target
      _write = target
    }

    /* 定义属性 */
    if (Array.isArray(key)) {
      /* multi */
      for (const _k of key) {
        const desc = Object.getOwnPropertyDescriptor(_read, _k);
        if (!desc) continue;
        const attr = typeof attributes === 'function' ? attributes(_k, desc) : attributes;
        if (attr) {
          Object.defineProperty(_write, _k, attr);
        }
      }
    } else {
      /* one */
      const desc = Object.getOwnPropertyDescriptor(_read, key);
      if (!desc) return;
      const attr = typeof attributes === 'function' ? attributes(key, desc) : attributes;
      if (attr) {
        Object.defineProperty(_write, key, attr);
      }
    }
  }

  /**
   * 代理getter属性描述符
   * @param target 目标对象 | [获取描述符对象, 写入对象]
   * @param key 属性名
   * @param attributes 属性描述符代理 | ((key, getter) => 属性描述符代理 | 不进行代理)
   * @returns void
   */
  public useGetterProxy = <
    T extends object,
    K extends keyof T,
    H extends ProxyHandler<() => any>,
    W = any,
  >(
    target: T | [T, W],
    key: K | K[],
    handler: H | ((key: K, getter: () => any) => H | void)
  ) => {
    this.useDefine(target, key, (_k, desc) => {
      const getter = desc.get
      if (!getter) return;
      const _handler = typeof handler === 'function' ? handler(_k, getter) : handler
      if (!_handler) return;
      return {
        get: this.newProxy(getter, _handler)
      }
    })
  }

  /**
   * 获取指定项的种子
   */
  public useSeed = (mode?: HookMode) => {
    switch (mode?.type) {
      case HookType.page:
        return this.seed.page
      case HookType.domain:
        return this.seed.domain
      case HookType.browser:
        return this.seed.browser
      case HookType.global:
        return this.seed.global
      default:
        return null
    }
  }

  /**
   * 获取指定项的种子或自定义值
   */
  public useHookMode = <V>(mode?: HookMode<V>): {
    seed?: number
    value?: V
  } => {
    switch (mode?.type) {
      case HookType.default:
        return {};
      case HookType.value:
        return { value: mode.value };
      default:
        const seed = this.useSeed(mode)
        return seed == null ? {} : { seed };
    }
  }

  /**
   * 所有参数是否是默认模式
   * @example !isDefault([...]) // 至少一个元素是非默认值
   */
  public isDefault = (mode?: HookMode | HookMode[]) => {
    if (!mode) return true
    if (Array.isArray(mode)) {
      return mode.every(m => m.type === HookType.default)
    } else {
      return mode.type === HookType.default
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

    if (win !== window.top) {
      notifyIframeOrigin(win.location.origin)
    }
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

}
