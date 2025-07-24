import { HookType } from '@/types/enum'
import { genRandomVersionUserAgent } from "@/utils/equipment";
import { HookTask, recordHook } from "./core";
import { drawNoise, drawNoiseToWebgl, getOwnProperties, proxyUserAgentData } from './utils';

const hookTaskMap: Record<string, Omit<HookTask, 'name'>> = {

  'iframe html hook': {
    condition: ({ conf }) => conf.action.hookBlankIframe,
    onEnable: ({ win, hookIframe }) => {
      // 监听DOM初始化
      const observer = new MutationObserver((mutations) => {
        // if (mutations.length == 1) return;
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeName === 'IFRAME') {
              hookIframe(node as HTMLIFrameElement)
            }
          }
        }
      });
      observer.observe(win.document.documentElement, { childList: true, subtree: true });

      const closeObserver = () => {
        observer.disconnect()
        win.removeEventListener('DOMContentLoaded', closeObserver, { capture: true })
        win.removeEventListener('load', closeObserver, { capture: true })
      }
      win.addEventListener('DOMContentLoaded', closeObserver, { capture: true })
      win.addEventListener('load', closeObserver, { capture: true })
    },
  },

  'iframe script hook': {
    condition: ({ conf }) => conf.action.hookBlankIframe,
    onEnable: ({ win, hookIframe, useProxy }) => {

      useProxy(win.Node.prototype, [
        'appendChild', 'insertBefore', 'replaceChild'
      ], {
        apply(target: any, thisArg: Object, args: any) {
          const res = Reflect.apply(target, thisArg, args)
          const node = args[0]
          if (node?.tagName === 'IFRAME') {
            hookIframe(node as HTMLIFrameElement)
          }
          return res
        }
      });

    },
  },

  'navigator': {
    condition: ({ conf, isAllDefault }) => !isAllDefault(conf.fp.navigator),
    onEnable: ({ win, conf, info, symbol, getSeed, getValue, useDefine }) => {
      const desc = Object.getOwnPropertyDescriptors(win.Navigator.prototype)
      if (!desc) return;

      // @ts-ignore
      win.navigator[symbol.own] = getOwnProperties(win.navigator)

      const _userAgent = desc.userAgent?.get
      const _appVersion = desc.appVersion?.get
      if (_userAgent && _appVersion) {
        /* ua */
        Object.defineProperty(win.navigator, "userAgent", {
          get() {
            if (info.browser === 'firefox') return _userAgent.call(this);
            const seed = getSeed(conf.fp.navigator.uaVersion.type)
            if (seed !== null) {
              recordHook('userAgent')
              return genRandomVersionUserAgent(seed, {
                userAgent: _userAgent.call(this),
                appVersion: _appVersion.call(this)
              })
            }
            return _userAgent.call(this)
          }
        })
        /* appVersion */
        Object.defineProperty(win.navigator, "appVersion", {
          get() {
            if (info.browser === 'firefox') return _appVersion.call(this);
            const seed = getSeed(conf.fp.navigator.uaVersion.type)
            if (seed !== null) {
              recordHook('appVersion')
              return genRandomVersionUserAgent(seed, {
                userAgent: _userAgent.call(this),
                appVersion: _appVersion.call(this)
              }, true)
            }
            return _appVersion.call(this)
          }
        })
      }

      /* userAgentData */
      const _userAgentData = desc.userAgentData?.get
      _userAgentData && Object.defineProperty(win.navigator, "userAgentData", {
        get: new Proxy(_userAgentData, {
          apply: (target, thisArg, args: any) => {
            if (info.browser === 'firefox') return _userAgentData.call(thisArg);
            const seed = getSeed(conf.fp.navigator.uaVersion.type)
            if (seed !== null) {
              recordHook('userAgent')
              return proxyUserAgentData(seed, target.apply(thisArg, args))
            }
            return _userAgentData.call(thisArg)
          }
        })
      })

      /* Simple hook */
      const hookProp = (key: keyof Navigator) => {
        const getter: (() => any) | undefined = desc[key]?.get
        if (!getter) return;
        Object.defineProperty(win.navigator, key, {
          get() {
            const mode: HookMode | undefined = (conf.fp.navigator as any)[key]
            const _key: any = 'navigator.' + key
            const value = getValue(_key, mode)
            if (value !== null) return value;
            return getter.call(this)
          }
        })
      }
      hookProp('language')
      hookProp('languages')
      hookProp('hardwareConcurrency')
    },
  },

  'screen': {
    condition: ({ conf, isAllDefault }) => !isAllDefault(conf.fp.screen),
    onEnable: ({ win, conf, getValue }) => {
      const desc = Object.getOwnPropertyDescriptors(win.Screen.prototype)
      if (!desc) return;

      // @ts-ignore
      win.screen[symbol.own] = getOwnProperties(win.screen)

      /* Simple hook */
      const hookProp = (key: keyof Screen) => {
        const getter: (() => any) | undefined = desc[key]?.get
        if (!getter) return;
        Object.defineProperty(win.screen, key, {
          get() {
            const mode: HookMode | undefined = (conf.fp.screen as any)[key]
            const _key: any = 'screen.' + key
            const value = getValue(_key, mode)
            if (value !== null) return value;
            return getter.call(this)
          }
        })
      }
      hookProp('width')
      hookProp('height')
      hookProp('colorDepth')
      hookProp('pixelDepth')
    },
  },

  'canvas': {
    condition: ({ conf }) => conf.fp.other.canvas.type !== HookType.default,
    onEnable: ({ win, conf, hooks, rawObjects, getValue }) => {
      /* getContext */
      const _getContext = win.HTMLCanvasElement.prototype.getContext
      win.HTMLCanvasElement.prototype.getContext = hooks.newBaseProxy(_getContext, {
        apply: (target, thisArg, args: Parameters<typeof HTMLCanvasElement.prototype.getContext>) => {
          if (args[0] === '2d') {
            const option = args[1] ?? {};
            option.willReadFrequently = true;
            args[1] = option
          }
          return target.apply(thisArg, args);
        }
      })

      /* getImageData */
      const _getImageData = win.CanvasRenderingContext2D.prototype.getImageData
      rawObjects.getImageData = _getImageData
      win.CanvasRenderingContext2D.prototype.getImageData = hooks.newBaseProxy(_getImageData, {
        apply: (target, thisArg: CanvasRenderingContext2D, args: Parameters<typeof CanvasRenderingContext2D.prototype.getImageData>) => {
          const value: number[] = getValue('other.canvas', conf.fp.other.canvas)
          if (value !== null) {
            return drawNoise(
              _getImageData!, value,
              thisArg, ...args)
          }
          return target.apply(thisArg, args);
        }
      })
    },
  },

  'webgl': {
    condition: ({ conf }) => conf.fp.other.webgl.type !== HookType.default ||
      conf.fp.normal.glVendor.type !== HookType.default ||
      conf.fp.normal.glRenderer.type !== HookType.default,
    onEnable: ({ win, conf, hooks, getValue, random }) => {
      const isHookWebgl = conf.fp.other.webgl.type !== HookType.default
      const isHookInfo = conf.fp.normal.glVendor.type !== HookType.default || conf.fp.normal.glRenderer.type !== HookType.default

      /* Image */
      if (isHookWebgl) {
        const _readPixels = win.WebGLRenderingContext.prototype.readPixels
        const _readPixels2 = win.WebGL2RenderingContext.prototype.readPixels

        const handler = hooks.useBaseHandler({
          apply: (target: any, thisArg: WebGLRenderingContext | WebGL2RenderingContext, args: any) => {
            const value: [number, number] = getValue('other.webgl', conf.fp.other.webgl)
            value && drawNoiseToWebgl(thisArg, value)
            return target.apply(thisArg, args as any);
          }
        })
        win.WebGLRenderingContext.prototype.readPixels = hooks.newProxy(_readPixels, handler)
        win.WebGL2RenderingContext.prototype.readPixels = hooks.newProxy(_readPixels2, handler)
      }

      /* Report: Supported Extensions */
      if (isHookWebgl) {
        const _getSupportedExtensions = win.WebGLRenderingContext.prototype.getSupportedExtensions
        const _getSupportedExtensions2 = win.WebGL2RenderingContext.prototype.getSupportedExtensions

        const handler = hooks.useBaseHandler({
          apply: (target: any, thisArg: WebGLRenderingContext, args: any) => {
            const res = target.apply(thisArg, args)
            if (res) {
              const value = random('other.webgl', conf.fp.other.webgl)
              value && res.push?.('EXT_' + value)
            }
            return res;
          }
        })
        win.WebGLRenderingContext.prototype.getSupportedExtensions = hooks.newProxy(_getSupportedExtensions, handler)
        win.WebGL2RenderingContext.prototype.getSupportedExtensions = hooks.newProxy(_getSupportedExtensions2, handler)
      }

      /* Report: Parameter */
      if (isHookInfo) {
        const _getParameter = win.WebGLRenderingContext.prototype.getParameter
        const _getParameter2 = win.WebGL2RenderingContext.prototype.getParameter

        const handler = hooks.useBaseHandler({
          apply: (target: any, thisArg: WebGLRenderingContext, args: any) => {
            const ex = thisArg.getExtension('WEBGL_debug_renderer_info')
            if (ex) {
              if (args[0] === ex.UNMASKED_VENDOR_WEBGL) {
                const value: string | null = getValue('normal.glVendor', conf.fp.normal.glVendor)
                if (value) return value;
              } else if (args[0] === ex.UNMASKED_RENDERER_WEBGL) {
                const value: string | null = getValue('normal.glRenderer', conf.fp.normal.glRenderer)
                if (value) return value;
              }
            }
            return target.apply(thisArg, args);
          }
        })
        win.WebGLRenderingContext.prototype.getParameter = hooks.newProxy(_getParameter, handler)
        win.WebGL2RenderingContext.prototype.getParameter = hooks.newProxy(_getParameter2, handler)
      }
    },
  },

  'toDataURL': {
    condition: ({ conf }) =>
      conf.fp.other.canvas.type !== HookType.default ||
      conf.fp.other.webgl.type !== HookType.default,
    onEnable: ({ win, conf, hooks, rawObjects, getValue }) => {
      const _toDataURL = win.HTMLCanvasElement.prototype.toDataURL
      win.HTMLCanvasElement.prototype.toDataURL = hooks.newBaseProxy(_toDataURL, {
        apply: (target, thisArg: HTMLCanvasElement, args: Parameters<typeof HTMLCanvasElement.prototype.toDataURL>) => {
          /* 2d */
          if (conf.fp.other.canvas.type !== HookType.default) {
            const ctx = thisArg.getContext('2d');
            if (ctx) {
              const value: number[] = getValue('other.canvas', conf.fp.other.canvas)
              value && rawObjects.getImageData && drawNoise(
                rawObjects.getImageData, value,
                ctx, 0, 0, thisArg.width, thisArg.height)
              return target.apply(thisArg, args);
            }
          }
          /* webgl */
          if (conf.fp.other.webgl.type !== HookType.default) {
            const gl = thisArg.getContext('webgl') ?? thisArg.getContext('webgl2')
            if (gl) {
              const value: [number, number] = getValue('other.webgl', conf.fp.other.webgl)
              value && drawNoiseToWebgl(gl as any, value)
              return target.apply(thisArg, args);
            }
          }
          return target.apply(thisArg, args);
        }
      })
    },
  },

  'audio': {
    condition: ({ conf }) => conf.fp.other.audio.type !== HookType.default,
    onEnable: ({ win, conf, random, useProxy }) => {

      useProxy(win.OfflineAudioContext.prototype, 'createDynamicsCompressor', {
        apply: (target, thisArg: OfflineAudioContext, args: Parameters<typeof OfflineAudioContext.prototype.createDynamicsCompressor>) => {
          const value: number | null = random('other.audio', conf.fp.other.audio)
          if (value === null) return target.apply(thisArg, args)
          const compressor = target.apply(thisArg, args)
          const gain = thisArg.createGain()
          gain.gain.value = value * 0.001
          compressor.connect(gain)
          gain.connect(thisArg.destination)
          return compressor
        }
      })

    },
  },

  'timezone': {
    condition: ({ conf }) => conf.fp.other.timezone.type !== HookType.default,
    onEnable: ({ win, conf, hooks, getValueDebounce, useProxy }) => {
      const _DateTimeFormat = win.Intl.DateTimeFormat;

      type TimeParts = Partial<Record<keyof Intl.DateTimeFormatPartTypesRegistry, string>>
      const getStandardDateTimeParts = (date: Date, timezone?: string): TimeParts | null => {
        const formatter = new _DateTimeFormat('en-US', {
          timeZone: timezone ?? 'Asia/Shanghai',
          weekday: 'short',
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3,
          hour12: false,
          timeZoneName: 'longOffset',
        })
        try {
          const parst = formatter.formatToParts(date)
          return parst.reduce((acc: TimeParts, cur) => {
            acc[cur.type] = cur.value
            return acc
          }, {})
        } catch (e) {
          return null
        }
      }

      /* DateTimeFormat */
      useProxy(win.Intl, 'DateTimeFormat', {
        construct: (target, args: Parameters<typeof Intl.DateTimeFormat>, newTarget) => {
          const currTimeZone: TimeZoneInfo = getValueDebounce('other.timezone', conf.fp.other.timezone)
          args[0] = args[0] ?? currTimeZone.locale
          args[1] = Object.assign({ timeZone: currTimeZone.zone }, args[1]);
          return new target(...args)
        },
        apply: (target, thisArg: Intl.DateTimeFormat, args: Parameters<typeof Intl.DateTimeFormat>) => {
          const currTimeZone: TimeZoneInfo = getValueDebounce('other.timezone', conf.fp.other.timezone)
          args[0] = args[0] ?? currTimeZone.locale
          args[1] = Object.assign({ timeZone: currTimeZone.zone }, args[1]);
          return target.apply(thisArg, args)
        },
      })

      /* Date */
      useProxy(win, 'Date', {
        apply: (target, thisArg: Date, args: Parameters<typeof Date>) => {
          return new target(...args).toString()
        }
      })

      /* getTimezoneOffset & toString */
      {
        const createHandler = (handle: (thisArg: Date, tz: TimeZoneInfo) => string | number | null) => hooks.useBaseHandler({
          apply: (target: any, thisArg: Date, args: Parameters<typeof Date.prototype.toString>) => {
            const tz: TimeZoneInfo | null = getValueDebounce('other.timezone', conf.fp.other.timezone)
            if (tz === null) return target.apply(thisArg, args);
            const result = handle(thisArg, tz)
            return result === null ? target.apply(thisArg, args) : result
          }
        })
        useProxy(win.Date.prototype, 'getTimezoneOffset', createHandler((_, tz) => {
          return tz.offset * -60
        }))
        useProxy(win.Date.prototype, 'toString', createHandler((thisArg, tz) => {
          const ps = getStandardDateTimeParts(thisArg, tz.zone)
          return ps === null ? null : `${ps.weekday} ${ps.month} ${ps.day} ${ps.year} ${ps.hour}:${ps.minute}:${ps.second} ${ps.timeZoneName?.replace(':', '')}`
        }))
        useProxy(win.Date.prototype, 'toDateString', createHandler((thisArg, tz) => {
          const ps = getStandardDateTimeParts(thisArg, tz.zone)
          return ps === null ? null : `${ps.weekday} ${ps.month} ${ps.day} ${ps.year}`
        }))
        useProxy(win.Date.prototype, 'toTimeString', createHandler((thisArg, tz) => {
          const ps = getStandardDateTimeParts(thisArg, tz.zone)
          return ps === null ? null : `${ps.hour}:${ps.minute}:${ps.second} ${ps.timeZoneName?.replace(':', '')}`
        }))
      }

      /* toLocaleString */
      useProxy(win.Date.prototype, [
        'toLocaleString', 'toLocaleDateString', 'toLocaleTimeString'
      ], {
        apply: (target: any, thisArg: Date, args: Parameters<typeof Date.prototype.toLocaleString>) => {
          const tz: TimeZoneInfo | null = getValueDebounce('other.timezone', conf.fp.other.timezone)
          if (tz) {
            args[0] = args[0] ?? tz.locale
            args[1] = Object.assign({ timeZone: tz.zone }, args[1]);
          }
          return target.apply(thisArg, args);
        }
      })

    },
  },

  'webrtc': {
    condition: ({ conf }) => conf.fp.other.webrtc.type !== HookType.default,
    onEnable: ({ win }) => {
      // mediaDevices
      const _mediaDevices = Object.getOwnPropertyDescriptor(win.Navigator.prototype, "mediaDevices")?.get
      _mediaDevices && Object.defineProperty(win.navigator, "mediaDevices", {
        get() { return null }
      });

      [
        'getUserMedia',
        'mozGetUserMedia',
        'webkitGetUserMedia'
      ].forEach((key) => {
        // @ts-ignore
        if (win.Navigator.prototype[key]) win.Navigator.prototype[key] = undefined;
      });

      [
        'RTCDataChannel',
        'RTCIceCandidate',
        'RTCConfiguration',
        'MediaStreamTrack',
        'RTCPeerConnection',
        'RTCSessionDescription',
        'mozMediaStreamTrack',
        'mozRTCPeerConnection',
        'mozRTCSessionDescription',
        'webkitMediaStreamTrack',
        'webkitRTCPeerConnection',
        'webkitRTCSessionDescription',
      ].forEach((key) => {
        // @ts-ignore
        if (win[key]) win[key] = undefined;
      });
    },
  },

  'font': {
    condition: ({ conf }) => conf.fp.other.font.type !== HookType.default,
    onEnable: ({ win, conf, hooks, getValueDebounce, useDefine }) => {

      useDefine(win.HTMLElement.prototype, 'offsetHeight', (_, desc) => {
        const getter = desc.get
        return getter && {
          get() {
            const height = getter.call(this);
            try {
              const mark = this.style.fontFamily ?? 'h' + height;
              const noise: number = getValueDebounce('other.font', conf.fp.other.font, mark)
              return height + noise;
            } catch (_) {
              return height;
            }
          }
        }
      })

      useDefine(win.HTMLElement.prototype, 'offsetWidth', (_, desc) => {
        const getter = desc.get
        return getter && {
          get() {
            const width = getter.call(this);
            try {
              const mark = this.style.fontFamily ?? 'w' + width;
              const noise: number = getValueDebounce('other.font', conf.fp.other.font, mark)
              return width + noise;
            } catch (_) {
              return width;
            }
          }
        }
      })

    },
  },

  'webgpu': {
    condition: ({ conf }) => conf.fp.other.webgpu.type !== HookType.default,
    onEnable: ({ win, conf, randomDebounce, useDefine, useProxy, newProxy }) => {
      /*** GPUAdapter ***/
      // @ts-ignore
      if (win.GPUAdapter) {
        const genNoise = (raw: any, offset: number) => {
          const rn = randomDebounce('other.webgpu', conf.fp.other.webgpu, offset, 1, 64)!
          return raw ? raw - Math.floor(rn) : raw;
        }
        // @ts-ignore
        useDefine(win.GPUAdapter.prototype, 'limits', (_, desc) => {
          const getter = desc.get
          return getter && {
            get() {
              const limits = getter.call(this);
              return newProxy(limits, {
                get(target, prop) {
                  const value = target[prop];
                  switch (prop) {
                    case "maxBufferSize": return genNoise(value, 0);
                    case "maxStorageBufferBindingSize": return genNoise(value, 1);
                  }
                  return typeof value === "function" ? value.bind(target) : value;
                }
              })
            }
          }
        })
      }

      /*** GPUDevice ***/
      // @ts-ignore
      if (win.GPUDevice) {
        const genNoise = (raw: any, offset: number) => {
          const rn = randomDebounce('other.webgpu', conf.fp.other.webgpu, offset, 1, 64)!
          return raw ? raw - Math.floor(rn) : raw;
        }
        // @ts-ignore
        useDefine(win.GPUDevice.prototype, 'limits', (_, desc) => {
          const getter = desc.get
          return getter && {
            get() {
              const limits = getter.call(this);
              return newProxy(limits, {
                get(target, prop) {
                  const value = target[prop];
                  switch (prop) {
                    case "maxBufferSize": return genNoise(value, 0);
                    case "maxStorageBufferBindingSize": return genNoise(value, 1);
                  }
                  return typeof value === "function" ? value.bind(target) : value;
                }
              })
            }
          }
        })
      }

      /*** GPUCommandEncoder ***/
      // @ts-ignore
      if (win.GPUCommandEncoder?.prototype?.beginRenderPass) {
        // @ts-ignore
        useProxy(win.GPUCommandEncoder.prototype, 'beginRenderPass', {
          apply(target, self, args) {
            if (args?.[0]?.colorAttachments?.[0]?.clearValue) {
              try {
                const _clearValue = args[0].colorAttachments[0].clearValue
                let offset = 0
                for (let key in _clearValue) {
                  let value = _clearValue[key]
                  const noise: number = randomDebounce('other.webgpu', conf.fp.other.webgpu, offset++, 0.01, 0.001)!
                  value += value * noise * -1
                  _clearValue[key] = Math.abs(value)
                }
                args[0].colorAttachments[0].clearValue = _clearValue;
              } catch (e) { }
            }
            return target.apply(self, args);
          }
        })
      }

      /*** GPUQueue ***/
      // @ts-ignore
      if (win.GPUQueue?.prototype?.writeBuffer) {
        // @ts-ignore
        useProxy(win.GPUQueue.prototype, 'writeBuffer', {
          apply(target, self, args) {
            const _data = args?.[2]
            if (_data && _data instanceof Float32Array) {
              try {
                const count = Math.ceil(_data.length * 0.05)
                let offset = 0
                const selected = Array(_data.length)
                  .map((_, i) => i)
                  .sort(() => randomDebounce('other.webgpu', conf.fp.other.webgpu, offset++, 1, -1)!)
                  .slice(0, count);

                offset = 0
                for (let i = 0; i < selected.length; i++) {
                  const index = selected[i];
                  let value = _data[index];
                  const noise: number = randomDebounce('other.webgpu', conf.fp.other.webgpu, offset++, +0.0001, -0.0001)!
                  _data[index] += noise * value;
                }
                // args[2] = _data;
              } catch (e) { }
            }
            return target.apply(self, args);
          }
        })
      }
    },
  },

  'domRect': {
    condition: ({ conf }) => conf.fp.other.domRect.type !== HookType.default,
    onEnable: ({ win, conf, random }) => {
      {
        const desc = Object.getOwnPropertyDescriptors(win.DOMRect.prototype)
        const hookProp = (key: keyof DOMRect) => {
          const getter: (() => any) | undefined = desc[key]?.get
          if (!getter) return;
          Object.defineProperty(win.DOMRect.prototype, key, {
            get() {
              const value: number | null = random('other.domRect', conf.fp.other.domRect, 0, 1e-6, -1e-6)
              const res = getter.call(this)
              if (value == null) return res;
              return res + value
            }
          })
        }
        hookProp('x')
        hookProp('y')
        hookProp('width')
        hookProp('height')
      }
      {
        const desc = Object.getOwnPropertyDescriptors(win.DOMRectReadOnly.prototype)
        const hookProp = (key: keyof DOMRectReadOnly, toResult: (rect: DOMRectReadOnly) => any) => {
          const getter: (() => any) | undefined = desc[key]?.get
          if (!getter) return;
          Object.defineProperty(win.DOMRectReadOnly.prototype, key, {
            get() {
              return toResult(this)
            }
          })
        }
        hookProp('top', rect => rect.y)
        hookProp('left', rect => rect.x)
        hookProp('bottom', rect => rect.y + rect.height)
        hookProp('right', rect => rect.x + rect.width)
      }
    }
  },

  '.ownProperties': {
    onEnable: ({ win, symbol, hooks }) => {
      {
        /* multi */
        const useHandler = (type: keyof HookOwnProperties) => hooks.useBaseHandler({
          apply(target: any, self: any, args: any[]) {
            const src = args[0]
            if (src != null && typeof src === 'object') {
              const own: HookOwnProperties | undefined = src[symbol.own]
              if (own) return own[type];
            }
            return target.apply(self, args as any)
          }
        })
        win.Object.getOwnPropertyNames = hooks.newProxy(win.Object.getOwnPropertyNames, useHandler('names'))
        win.Object.getOwnPropertySymbols = hooks.newProxy(win.Object.getOwnPropertySymbols, useHandler('symbols'))
        win.Object.getOwnPropertyDescriptors = hooks.newProxy(win.Object.getOwnPropertyDescriptors, useHandler('descriptors'))
        win.Reflect.ownKeys = hooks.newProxy(win.Reflect.ownKeys, useHandler('keys'))
      }
      {
        /* one */
        const handler = hooks.useBaseHandler({
          apply(target: any, self: any, args: any[]) {
            const src = args[0]
            if (src != null && typeof src === 'object') {
              const own: HookOwnProperties | undefined = src[symbol.own]
              if (own) return own.descriptors?.[args[1]];
            }
            return target.apply(self, args as any)
          }
        })
        win.Object.getOwnPropertyDescriptor = hooks.newProxy(win.Object.getOwnPropertyDescriptor, handler)
        win.Reflect.getOwnPropertyDescriptor = hooks.newProxy(win.Reflect.getOwnPropertyDescriptor, handler)
      }
    }
  },

  '.prototypeOf': {
    onEnable: ({ win, symbol, registry, hooks }) => {
      const handler = hooks.useBaseHandler({
        apply(target: any, self: any, args: any[]) {
          const src = args[0]
          const dst = args[1]
          if (dst != null && registry.has(src)) {
            const raw = dst[symbol.raw]
            if (raw) args[1] = raw;
          }
          return Reflect.apply(target, self, args);
        }
      })
      win.Object.setPrototypeOf = hooks.newProxy(win.Object.setPrototypeOf, handler)
      win.Reflect.setPrototypeOf = hooks.newProxy(win.Reflect.setPrototypeOf, handler)
    }
  },

  '.toString': {
    onEnable: ({ win, symbol, registry, hooks }) => {
      win.Function.prototype.toString = hooks.newBaseProxy(win.Function.prototype.toString, {
        apply(target: any, self: any, args: any[]) {
          if (self != null && registry.has(self)) {
            const raw = self[symbol.raw]
            if (raw) return Reflect.apply(target, raw, args);
          }
          return Reflect.apply(target, self, args);
        }
      })
    }
  },

  '.create': {
    onEnable: ({ win, symbol, registry, hooks }) => {
      win.Object.create = hooks.newBaseProxy(win.Object.create, {
        apply(target: any, self: any, args: any[]) {
          const src = args[0]
          if (src != null && registry.has(src)) {
            const raw = src[symbol.raw]
            if (raw) args[0] = raw;
          }
          return Reflect.apply(target, self, args);
        }
      })
    }
  }
}

export const hookTasks = Object.entries(hookTaskMap).map(([name, task]): HookTask => ({ ...task, name }))
export default hookTasks