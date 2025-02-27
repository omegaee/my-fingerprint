import { HookType } from '@/types/enum'
import { genRandomVersionUserAgent } from "@/utils/equipment";
import { HookTask, recordHook } from "./core";
import { drawNoise, drawNoiseToWebgl, proxyUserAgentData } from './utils';

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
    onEnable: ({ win, hookIframe }) => {
      const apply = (target: any, thisArg: Object, args: any) => {
        const res = target.apply(thisArg, args)
        const node = args[0]
        if (node?.tagName === 'IFRAME') {
          hookIframe(node as HTMLIFrameElement)
        }
        return res
      }

      const _appendChild = win.Node.prototype.appendChild
      win.Node.prototype.appendChild = new Proxy(_appendChild, { apply })

      const _insertBefore = win.Node.prototype.insertBefore
      win.Node.prototype.insertBefore = new Proxy(_insertBefore, { apply })

      const _replaceChild = win.Node.prototype.replaceChild
      win.Node.prototype.replaceChild = new Proxy(_replaceChild, { apply })
    },
  },

  'hook navigator': {
    condition: ({ conf, isAllDefault }) => !isAllDefault(conf.fp.navigator) || conf.fp.other.webrtc.type !== HookType.default,
    onEnable: ({ win, conf, getSeed, getValue }) => {
      const _navigator = Object.getOwnPropertyDescriptor(win, "navigator")?.get;
      _navigator && Object.defineProperty(win, 'navigator', {
        get: new Proxy(_navigator, {
          apply: (target: any, thisArg, args) => {
            const result = _navigator.call(thisArg)
            return new Proxy(result, {
              get: (target: any, key: keyof Navigator | (string & {})) => {
                switch (key) {
                  /* ua */
                  case 'userAgent': {
                    const seed = getSeed(conf.fp.navigator.uaVersion.type)
                    if (seed !== null) {
                      recordHook(key)
                      return genRandomVersionUserAgent(seed, target)
                    }
                    break
                  }
                  case 'appVersion': {
                    const seed = getSeed(conf.fp.navigator.uaVersion.type)
                    if (seed !== null) {
                      recordHook(key)
                      return genRandomVersionUserAgent(seed, target, true)
                    }
                    break
                  }
                  case 'userAgentData' as any: {
                    const seed = getSeed(conf.fp.navigator.uaVersion.type)
                    if (seed !== null) {
                      recordHook(key)
                      return proxyUserAgentData(seed, target[key])
                    }
                    break
                  }
                  /* webrtc */
                  case 'getUserMedia':
                  case 'mozGetUserMedia':
                  case 'webkitGetUserMedia': {
                    if (conf.fp.other.webrtc.type === HookType.disabled) return undefined;
                    break
                  }
                  case 'mediaDevices': {
                    if (conf.fp.other.webrtc.type === HookType.disabled) return null;
                    break
                  }
                  case 'languages':
                  case 'hardwareConcurrency': {
                    const mode: HookMode | undefined = (conf.fp.navigator as any)[key]
                    const _key: any = 'navigator.' + key
                    const value = getValue(_key, mode)
                    if (value !== null) return value;
                    break
                  }
                }
                const value = target[key]
                return typeof value === 'function' ? value.bind(target) : value
              }
            })
          },
        })
      });

    },
  },

  'hook screen': {
    condition: ({ conf, isAllDefault }) => !isAllDefault(conf.fp.screen),
    onEnable: ({ win, conf, getValue }) => {
      const _screen = Object.getOwnPropertyDescriptor(win, "screen")?.get;
      _screen && Object.defineProperty(win, 'screen', {
        get: new Proxy(_screen, {
          apply: (target: any, thisArg, args) => {
            const result = _screen.call(thisArg);
            return new Proxy(result, {
              get: (target: any, key: keyof Screen | (string & {})) => {
                switch (key) {
                  case 'width':
                  case 'height':
                  case 'colorDepth':
                  case 'pixelDepth': {
                    const mode: HookMode | undefined = (conf.fp.screen as any)[key]
                    const _key: any = 'screen.' + key
                    const value = getValue(_key, mode)
                    if (value !== null) return value;
                    break
                  }
                }
                const value = target[key]
                return typeof value === 'function' ? value.bind(target) : value
              }
            })
          },
        })
      })
    },
  },

  'hook canvas': {
    condition: ({ conf }) => conf.fp.other.canvas.type !== HookType.default,
    onEnable: ({ win, conf, rawObjects, getValue }) => {
      /* getContext */
      const _getContext = win.HTMLCanvasElement.prototype.getContext
      win.HTMLCanvasElement.prototype.getContext = new Proxy(_getContext, {
        apply: (target, thisArg, args: Parameters<typeof HTMLCanvasElement.prototype.getContext>) => {
          if (args[0] === '2d') {
            const option = args[1] ?? {};
            option.willReadFrequently = true;
            args[1] = option
          }
          return target.apply(thisArg, args);
        }
      });

      /* getImageData */
      const _getImageData = win.CanvasRenderingContext2D.prototype.getImageData
      rawObjects.getImageData = _getImageData
      win.CanvasRenderingContext2D.prototype.getImageData = new Proxy(_getImageData, {
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

  'hook webgl': {
    condition: ({ conf }) => conf.fp.other.webgl.type !== HookType.default ||
      conf.fp.normal.glVendor.type !== HookType.default ||
      conf.fp.normal.glRenderer.type !== HookType.default,
    onEnable: ({ win, conf, getValue }) => {
      const isHookWebgl = conf.fp.other.webgl.type !== HookType.default
      const isHookInfo = conf.fp.normal.glVendor.type !== HookType.default || conf.fp.normal.glRenderer.type !== HookType.default

      /* Image */
      if (isHookWebgl) {
        const _readPixels = win.WebGLRenderingContext.prototype.readPixels
        const _readPixels2 = win.WebGL2RenderingContext.prototype.readPixels

        const hook = {
          apply: (target: any, thisArg: WebGLRenderingContext | WebGL2RenderingContext, args: any) => {
            const value: [number, number] = getValue('other.webgl', conf.fp.other.webgl)
            value && drawNoiseToWebgl(thisArg, value)
            return target.apply(thisArg, args as any);
          }
        }
        win.WebGLRenderingContext.prototype.readPixels = new Proxy(_readPixels, hook)
        win.WebGL2RenderingContext.prototype.readPixels = new Proxy(_readPixels2, hook)
      }

      /* Report: Supported Extensions */
      if (isHookWebgl) {
        const _getSupportedExtensions = win.WebGLRenderingContext.prototype.getSupportedExtensions
        const _getSupportedExtensions2 = win.WebGL2RenderingContext.prototype.getSupportedExtensions

        const hook = {
          apply: (target: any, thisArg: WebGLRenderingContext, args: any) => {
            const res = target.apply(thisArg, args)
            if (res) {
              const value: [number, number] = getValue('other.webgl', conf.fp.other.webgl)
              res.push?.('EXT_' + value[0] + value[1])
            }
            return res;
          }
        }
        win.WebGLRenderingContext.prototype.getSupportedExtensions = new Proxy(_getSupportedExtensions, hook)
        win.WebGL2RenderingContext.prototype.getSupportedExtensions = new Proxy(_getSupportedExtensions2, hook)
      }

      /* Report: Parameter */
      if (isHookInfo) {
        const _getParameter = win.WebGLRenderingContext.prototype.getParameter
        const _getParameter2 = win.WebGL2RenderingContext.prototype.getParameter

        const hook = {
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
        }
        win.WebGLRenderingContext.prototype.getParameter = new Proxy(_getParameter, hook)
        win.WebGL2RenderingContext.prototype.getParameter = new Proxy(_getParameter2, hook)
      }
    },
  },

  'hook toDataURL': {
    condition: ({ conf }) =>
      conf.fp.other.canvas.type !== HookType.default ||
      conf.fp.other.webgl.type !== HookType.default,
    onEnable: ({ win, conf, rawObjects, getValue }) => {
      const _toDataURL = win.HTMLCanvasElement.prototype.toDataURL
      win.HTMLCanvasElement.prototype.toDataURL = new Proxy(_toDataURL, {
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

  'hook audio': {
    condition: ({ conf }) => conf.fp.other.audio.type !== HookType.default,
    onEnable: ({ win, conf, random }) => {
      const _createDynamicsCompressor = win.OfflineAudioContext.prototype.createDynamicsCompressor
      win.OfflineAudioContext.prototype.createDynamicsCompressor = new Proxy(_createDynamicsCompressor, {
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

  'hook timezone': {
    condition: ({ conf }) => conf.fp.other.timezone.type !== HookType.default,
    onEnable: ({ win, conf, getValueDebounce }) => {
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
        win.Intl.DateTimeFormat = new Proxy(_DateTimeFormat, {
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
        win.Date = new Proxy(_Date, {
          apply: (target, thisArg: Date, args: Parameters<typeof Date>) => {
            return new target(...args).toString()
          }
        })
      }

      /* getTimezoneOffset & toString */
      {
        const _getTimezoneOffset = win.Date.prototype.getTimezoneOffset
        const _toString = win.Date.prototype.toString
        const _toDateString = win.Date.prototype.toDateString
        const _toTimeString = win.Date.prototype.toTimeString

        const useHook = (handle: (thisArg: Date, tz: TimeZoneInfo) => string | number | null) => ({
          apply: (target: any, thisArg: Date, args: Parameters<typeof Date.prototype.toString>) => {
            const tz: TimeZoneInfo | null = getValueDebounce('other.timezone', conf.fp.other.timezone)
            if (tz === null) return target.apply(thisArg, args);
            const result = handle(thisArg, tz)
            return result === null ? target.apply(thisArg, args) : result
          }
        })
        win.Date.prototype.getTimezoneOffset = new Proxy(_getTimezoneOffset, useHook((_, tz) => {
          return tz.offset * -60
        }))
        win.Date.prototype.toString = new Proxy(_toString, useHook((thisArg, tz) => {
          const ps = getStandardDateTimeParts(thisArg, tz.zone)
          return ps === null ? null : `${ps.weekday} ${ps.month} ${ps.day} ${ps.year} ${ps.hour}:${ps.minute}:${ps.second} ${ps.timeZoneName?.replace(':', '')}`
        }))
        win.Date.prototype.toDateString = new Proxy(_toDateString, useHook((thisArg, tz) => {
          const ps = getStandardDateTimeParts(thisArg, tz.zone)
          return ps === null ? null : `${ps.weekday} ${ps.month} ${ps.day} ${ps.year}`
        }))
        win.Date.prototype.toTimeString = new Proxy(_toTimeString, useHook((thisArg, tz) => {
          const ps = getStandardDateTimeParts(thisArg, tz.zone)
          return ps === null ? null : `${ps.hour}:${ps.minute}:${ps.second} ${ps.timeZoneName?.replace(':', '')}`
        }))
      }

      /* toLocaleString */
      {
        const _toLocaleString = win.Date.prototype.toLocaleString
        const _toLocaleDateString = win.Date.prototype.toLocaleDateString
        const _toLocaleTimeString = win.Date.prototype.toLocaleTimeString

        const hook = {
          apply: (target: any, thisArg: Date, args: Parameters<typeof Date.prototype.toLocaleString>) => {
            const tz: TimeZoneInfo | null = getValueDebounce('other.timezone', conf.fp.other.timezone)
            if (tz) {
              args[0] = args[0] ?? tz.locale
              args[1] = Object.assign({ timeZone: tz.zone }, args[1]);
            }
            return target.apply(thisArg, args);
          }
        }
        win.Date.prototype.toLocaleString = new Proxy(_toLocaleString, hook)
        win.Date.prototype.toLocaleDateString = new Proxy(_toLocaleDateString, hook)
        win.Date.prototype.toLocaleTimeString = new Proxy(_toLocaleTimeString, hook)
      }
    },
  },

  'hook webrtc': {
    condition: ({ conf }) => conf.fp.other.webrtc.type !== HookType.default,
    onEnable: ({ win }) => {
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

  'hook font': {
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

  'hook webgpu': {
    condition: ({ conf }) => conf.fp.other.webgpu.type !== HookType.default,
    onEnable: ({ win, conf, randomDebounce }) => {
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
          win.GPUCommandEncoder.prototype.beginRenderPass = new Proxy(win.GPUCommandEncoder.prototype.beginRenderPass, {
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
          });
        } catch (e) { }
      }

      /*** GPUQueue ***/
      // @ts-ignore
      if (win.GPUQueue?.prototype?.writeBuffer) {
        try {
          // @ts-ignore
          win.GPUQueue.prototype.writeBuffer = new Proxy(win.GPUQueue.prototype.writeBuffer, {
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
          });
        } catch (e) { }
      }
    },
  }

}

export const hookTasks = Object.entries(hookTaskMap).map(([name, task]): HookTask => ({ ...task, name }))
export default hookTasks