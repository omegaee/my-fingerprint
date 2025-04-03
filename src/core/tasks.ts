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
    onEnable: ({ win, hooks, registry, hookIframe }) => {
      const handler = hooks.useBaseHandler({
        apply(target: any, thisArg: Object, args: any) {
          const res = Reflect.apply(target, thisArg, args)
          const node = args[0]
          if (node?.tagName === 'IFRAME') {
            hookIframe(node as HTMLIFrameElement)
          }
          return res
        }
      })
      win.Node.prototype.appendChild = hooks.newProxy(win.Node.prototype.appendChild, handler)
      win.Node.prototype.insertBefore = hooks.newProxy(win.Node.prototype.insertBefore, handler)
      win.Node.prototype.replaceChild = hooks.newProxy(win.Node.prototype.replaceChild, handler)
    },
  },

  'navigator': {
    condition: ({ conf, isAllDefault }) => !isAllDefault(conf.fp.navigator),
    onEnable: ({ win, conf, info, symbol, getSeed, getValue }) => {
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
    onEnable: ({ win, conf, hooks, random }) => {
      const _createDynamicsCompressor = win.OfflineAudioContext.prototype.createDynamicsCompressor
      win.OfflineAudioContext.prototype.createDynamicsCompressor = hooks.newBaseProxy(_createDynamicsCompressor, {
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
    onEnable: ({ win, conf, hooks, getValueDebounce }) => {
      const _DateTimeFormat = win.Intl.DateTimeFormat;
      const _Date = win.Date;

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
      {
        win.Intl.DateTimeFormat = hooks.newBaseProxy(_DateTimeFormat, {
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
      }

      /* Date */
      {
        win.Date = hooks.newBaseProxy(_Date, {
          apply: (target, thisArg: Date, args: Parameters<typeof Date>) => {
            return new target(...args).toString()
          }
        })
      }

      /* getTimezoneOffset & toString */
      {
        const useHook = (handle: (thisArg: Date, tz: TimeZoneInfo) => string | number | null) => hooks.useBaseHandler({
          apply: (target: any, thisArg: Date, args: Parameters<typeof Date.prototype.toString>) => {
            const tz: TimeZoneInfo | null = getValueDebounce('other.timezone', conf.fp.other.timezone)
            if (tz === null) return target.apply(thisArg, args);
            const result = handle(thisArg, tz)
            return result === null ? target.apply(thisArg, args) : result
          }
        })
        win.Date.prototype.getTimezoneOffset = hooks.newProxy(
          win.Date.prototype.getTimezoneOffset,
          useHook((_, tz) => {
            return tz.offset * -60
          }))
        win.Date.prototype.toString = hooks.newProxy(
          win.Date.prototype.toString,
          useHook((thisArg, tz) => {
            const ps = getStandardDateTimeParts(thisArg, tz.zone)
            return ps === null ? null : `${ps.weekday} ${ps.month} ${ps.day} ${ps.year} ${ps.hour}:${ps.minute}:${ps.second} ${ps.timeZoneName?.replace(':', '')}`
          }))
        win.Date.prototype.toDateString = hooks.newProxy(
          win.Date.prototype.toDateString,
          useHook((thisArg, tz) => {
            const ps = getStandardDateTimeParts(thisArg, tz.zone)
            return ps === null ? null : `${ps.weekday} ${ps.month} ${ps.day} ${ps.year}`
          }))
        win.Date.prototype.toTimeString = hooks.newProxy(
          win.Date.prototype.toTimeString,
          useHook((thisArg, tz) => {
            const ps = getStandardDateTimeParts(thisArg, tz.zone)
            return ps === null ? null : `${ps.hour}:${ps.minute}:${ps.second} ${ps.timeZoneName?.replace(':', '')}`
          }))
      }

      /* toLocaleString */
      {
        const handler = hooks.useBaseHandler({
          apply: (target: any, thisArg: Date, args: Parameters<typeof Date.prototype.toLocaleString>) => {
            const tz: TimeZoneInfo | null = getValueDebounce('other.timezone', conf.fp.other.timezone)
            if (tz) {
              args[0] = args[0] ?? tz.locale
              args[1] = Object.assign({ timeZone: tz.zone }, args[1]);
            }
            return target.apply(thisArg, args);
          }
        })
        win.Date.prototype.toLocaleString = hooks.newProxy(win.Date.prototype.toLocaleString, handler)
        win.Date.prototype.toLocaleDateString = hooks.newProxy(win.Date.prototype.toLocaleDateString, handler)
        win.Date.prototype.toLocaleTimeString = hooks.newProxy(win.Date.prototype.toLocaleTimeString, handler)
      }
    },
  },

  'webrtc': {
    condition: ({ conf }) => conf.fp.other.webrtc.type !== HookType.default,
    onEnable: ({ win }) => {
      // mediaDevices
      const _mediaDevices = Object.getOwnPropertyDescriptor(win.Navigator.prototype, "mediaDevices")?.get
      _mediaDevices && Object.defineProperty(win.navigator, "mediaDevices", {
        get() { return null }
      })
      // @ts-ignore
      if (win.Navigator.prototype.getUserMedia) win.Navigator.prototype.getUserMedia = undefined;
      // @ts-ignore
      if (win.Navigator.prototype.mozGetUserMedia) win.Navigator.prototype.mozGetUserMedia = undefined;
      // @ts-ignore
      if (win.Navigator.prototype.webkitGetUserMedia) win.Navigator.prototype.webkitGetUserMedia = undefined;
      // @ts-ignore
      if (win.RTCDataChannel) win.RTCDataChannel = undefined;
      // @ts-ignore
      if (win.RTCIceCandidate) win.RTCIceCandidate = undefined;
      // @ts-ignore
      if (win.RTCConfiguration) win.RTCConfiguration = undefined;
      // @ts-ignore
      if (win.MediaStreamTrack) win.MediaStreamTrack = undefined;
      // @ts-ignore
      if (win.RTCPeerConnection) win.RTCPeerConnection = undefined;
      // @ts-ignore
      if (win.RTCSessionDescription) win.RTCSessionDescription = undefined;
      // @ts-ignore
      if (win.RTCDataChannel) win.RTCDataChannel = undefined;
      // @ts-ignore
      if (win.mozMediaStreamTrack) win.mozMediaStreamTrack = undefined;
      // @ts-ignore
      if (win.mozRTCPeerConnection) win.mozRTCPeerConnection = undefined;
      // @ts-ignore
      if (win.mozRTCSessionDescription) win.mozRTCSessionDescription = undefined;
      // @ts-ignore
      if (win.webkitMediaStreamTrack) win.webkitMediaStreamTrack = undefined;
      // @ts-ignore
      if (win.webkitRTCPeerConnection) win.webkitRTCPeerConnection = undefined;
      // @ts-ignore
      if (win.webkitRTCSessionDescription) win.webkitRTCSessionDescription = undefined;
    },
  },

  'font': {
    condition: ({ conf }) => conf.fp.other.font.type !== HookType.default,
    onEnable: ({ win, conf, getValueDebounce }) => {
      const _offsetHeight = Object.getOwnPropertyDescriptor(win.HTMLElement.prototype, "offsetHeight")?.get
      _offsetHeight && Object.defineProperty(win.HTMLElement.prototype, "offsetHeight", {
        get: new Proxy(_offsetHeight, {
          apply(target, thisArg: HTMLElement, args: any) {
            try {
              const height = _offsetHeight.call(thisArg);
              const mark = thisArg.style.fontFamily ?? 'h' + height;
              const noise: number = getValueDebounce('other.font', conf.fp.other.font, mark)
              return height + noise;
            } catch (_) {
              return _offsetHeight.call(thisArg);
            }
          }
        })
      });

      const _offsetWidth = Object.getOwnPropertyDescriptor(win.HTMLElement.prototype, "offsetWidth")?.get
      _offsetWidth && Object.defineProperty(win.HTMLElement.prototype, "offsetWidth", {
        get: new Proxy(_offsetWidth, {
          apply(target, thisArg: HTMLElement, args: any) {
            try {
              const width = _offsetWidth.call(thisArg);
              const mark = thisArg.style.fontFamily ?? 'w' + width;
              const noise: number = getValueDebounce('other.font', conf.fp.other.font, mark)
              return width + noise;
            } catch (_) {
              return _offsetWidth.call(thisArg);
            }
          }
        })
      });
    },
  },

  'webgpu': {
    condition: ({ conf }) => conf.fp.other.webgpu.type !== HookType.default,
    onEnable: ({ win, conf, hooks, randomDebounce }) => {
      /*** GPUAdapter ***/
      // @ts-ignore
      if (win.GPUAdapter) {
        try {
          const genNoise = (raw: any, offset: number) => {
            const rn = randomDebounce('other.webgpu', conf.fp.other.webgpu, offset, 1, 64)!
            return raw ? raw - Math.floor(rn) : raw;
          }
          // @ts-ignore
          const _GPUAdapter = Object.getOwnPropertyDescriptor(win.GPUAdapter.prototype, "limits")?.get;
          // @ts-ignore
          _GPUAdapter && Object.defineProperty(win.GPUAdapter.prototype, "limits", {
            get: new Proxy(_GPUAdapter, {
              apply(target: any, self, args) {
                const result = target.apply(self, args);
                // const _limits = _GPUAdapter.call(self);
                return new Proxy(result, {
                  get(target, prop) {
                    const value = target[prop];
                    switch (prop) {
                      case "maxBufferSize": return genNoise(value, 0);
                      case "maxStorageBufferBindingSize": return genNoise(value, 1);
                    }
                    return typeof value === "function" ? value.bind(target) : value;
                  }
                });
              }
            })
          });
        } catch (e) { }
      }

      /*** GPUDevice ***/
      // @ts-ignore
      if (win.GPUDevice) {
        try {
          const genNoise = (raw: any, offset: number) => {
            const rn = randomDebounce('other.webgpu', conf.fp.other.webgpu, offset, 1, 64)!
            return raw ? raw - Math.floor(rn) : raw;
          }
          // @ts-ignore
          const _GPUDevice = Object.getOwnPropertyDescriptor(win.GPUDevice.prototype, "limits")?.get;
          // @ts-ignore
          _GPUDevice && Object.defineProperty(win.GPUDevice.prototype, "limits", {
            get: new Proxy(_GPUDevice, {
              apply(target: any, self, args) {
                const result = target.apply(self, args);
                // const _limits = _GPUDevice.call(self);
                return new Proxy(result, {
                  get(target, prop) {
                    const value = target[prop];
                    switch (prop) {
                      case "maxBufferSize": return genNoise(value, 0);
                      case "maxStorageBufferBindingSize": return genNoise(value, 1);
                    }
                    return typeof value === "function" ? value.bind(target) : value;
                  }
                });
              }
            })
          });
        } catch (e) { }
      }

      /*** GPUCommandEncoder ***/
      // @ts-ignore
      if (win.GPUCommandEncoder?.prototype?.beginRenderPass) {
        try {
          // @ts-ignore
          win.GPUCommandEncoder.prototype.beginRenderPass = new Proxy(win.GPUCommandEncoder.prototype.beginRenderPass, hooks.useBaseHandler({
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
          }))
        } catch (e) { }
      }

      /*** GPUQueue ***/
      // @ts-ignore
      if (win.GPUQueue?.prototype?.writeBuffer) {
        try {
          // @ts-ignore
          win.GPUQueue.prototype.writeBuffer = new Proxy(win.GPUQueue.prototype.writeBuffer, hooks.useBaseHandler({
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
          }))
        } catch (e) { }
      }
    },
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