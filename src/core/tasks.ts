import { HookType } from '@/types/enum'
import { genRandomVersionUserAgent } from "@/utils/equipment";
import { HookTask, recordHook } from "./core";
import { drawNoise, drawNoiseToWebgl, proxyUserAgentData } from './utils';
import { getStandardDateTimeParts } from '@/utils/time';

const hookTaskMap: Record<string, Omit<HookTask, 'name'>> = {

  'iframe html hook': {
    condition: ({ conf }) => conf.hookBlankIframe,
    onEnable: ({ win, hookIframe }) => {
      // 监听DOM初始化
      const observer = new MutationObserver((mutations) => {
        if (mutations.length == 1) return;
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
    condition: ({ conf }) => conf.hookBlankIframe,
    onEnable: ({ win, hookIframe }) => {
      const apply = (target: any, thisArg: Object, args: any) => {
        const res = target.apply(thisArg, args)
        const node = args[0]
        if (node?.tagName === 'IFRAME') {
          hookIframe(node as HTMLIFrameElement)
        }
        return res
      }

      const _appendChild = win.HTMLElement.prototype.appendChild
      win.HTMLElement.prototype.appendChild = new Proxy(_appendChild, { apply })

      const _insertBefore = win.HTMLElement.prototype.insertBefore
      win.HTMLElement.prototype.insertBefore = new Proxy(_insertBefore, { apply })

      const _replaceChild = win.HTMLElement.prototype.replaceChild
      win.HTMLElement.prototype.replaceChild = new Proxy(_replaceChild, { apply })
    },
  },

  // 'hook getOwnPropertyDescriptor': {
  //   condition: () => true,
  //   onEnable: ({ win, rawObjects }) => {
  //     if (!rawObjects.getOwnPropertyDescriptor) {
  //       rawObjects.getOwnPropertyDescriptor = win.Object.getOwnPropertyDescriptor

  //       const navigatorDesc = rawObjects.navigatorDescriptor ?? win.Object.getOwnPropertyDescriptor(win, 'navigator')
  //       const screenDesc = rawObjects.screenDescriptor ?? win.Object.getOwnPropertyDescriptor(win, 'screen')

  //       win.Object.getOwnPropertyDescriptor = new Proxy(rawObjects.getOwnPropertyDescriptor, {
  //         apply: (target, thisArg: Object, args: Parameters<typeof Object.getOwnPropertyDescriptor>) => {
  //           const [obj, prop] = args
  //           if (obj === win) {
  //             if (prop === 'navigator') return navigatorDesc
  //             if (prop === 'screen') return screenDesc
  //           }
  //           return target.apply(thisArg, args)
  //         }
  //       })
  //     }
  //   },
  // },

  'hook navigator': {
    condition: ({ conf, isAllDefault }) => !isAllDefault(conf.fingerprint.navigator) || conf.fingerprint.other.webrtc.type !== HookType.default,
    onEnable: ({ win, conf, getSeed, getValue }) => {
      const _navigator = Object.getOwnPropertyDescriptor(win, "navigator")?.get;
      _navigator && Object.defineProperty(win, 'navigator', {
        get: new Proxy(_navigator, {
          apply: (target: any, thisArg, args) => {
            const result = target.apply(thisArg, args)
            return new Proxy(result, {
              get: (target: any, key: keyof Navigator | (string & {})) => {
                switch (key) {
                  /* ua */
                  case 'userAgent': {
                    const seed = getSeed(conf.fingerprint.navigator.equipment.type)
                    if (seed !== null) {
                      recordHook(key)
                      return genRandomVersionUserAgent(seed, target)
                    }
                  }
                  case 'appVersion': {
                    const seed = getSeed(conf.fingerprint.navigator.equipment.type)
                    if (seed !== null) {
                      recordHook(key)
                      return genRandomVersionUserAgent(seed, target, true)
                    }
                  }
                  case 'userAgentData' as any: {
                    const seed = getSeed(conf.fingerprint.navigator.equipment.type)
                    if (seed !== null) {
                      recordHook(key)
                      return proxyUserAgentData(seed, target[key])
                    }
                  }
                  /* webrtc */
                  case 'getUserMedia':
                  case 'mozGetUserMedia':
                  case 'webkitGetUserMedia': {
                    if (conf.fingerprint.other.webrtc.type === HookType.disabled) return undefined;
                    break
                  }
                  case 'mediaDevices': {
                    if (conf.fingerprint.other.webrtc.type === HookType.disabled) return null;
                    break
                  }
                  case 'languages':
                  case 'hardwareConcurrency': {
                    const mode: HookMode | undefined = (conf.fingerprint.navigator as any)[key]
                    const _key: any = 'navigator.' + key
                    const value = getValue(_key, mode)
                    if (value !== null) return value;
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
    condition: ({ conf, isAllDefault }) => !isAllDefault(conf.fingerprint.screen),
    onEnable: ({ win, conf, getValue }) => {
      const _screen = Object.getOwnPropertyDescriptor(win, "screen")?.get;
      _screen && Object.defineProperty(win, 'screen', {
        get: new Proxy(_screen, {
          apply: (target: any, thisArg, args) => {
            const result = target.apply(thisArg, args);
            return new Proxy(result, {
              get: (target: any, key: keyof Screen | (string & {})) => {
                switch (key) {
                  case 'width':
                  case 'height':
                  case 'colorDepth':
                  case 'pixelDepth': {
                    const mode: HookMode | undefined = (conf.fingerprint.screen as any)[key]
                    const _key: any = 'screen.' + key
                    const value = getValue(_key, mode)
                    if (value !== null) return value;
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
    condition: ({ conf }) => conf.fingerprint.other.canvas.type !== HookType.default,
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
          const value: number[] = getValue('other.canvas', conf.fingerprint.other.canvas)
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
    condition: ({ conf }) => conf.fingerprint.other.webgl.type !== HookType.default,
    onEnable: ({ win, conf, getValue }) => {
      /* Image */
      {
        const _readPixels = win.WebGLRenderingContext.prototype.readPixels
        const _readPixels2 = win.WebGL2RenderingContext.prototype.readPixels

        const hook = {
          apply: (target: any, thisArg: WebGLRenderingContext | WebGL2RenderingContext, args: any) => {
            const value: [number, number] = getValue('other.webgl', conf.fingerprint.other.webgl)
            value && drawNoiseToWebgl(thisArg, value)
            return target.apply(thisArg, args as any);
          }
        }
        win.WebGLRenderingContext.prototype.readPixels = new Proxy(_readPixels, hook)
        win.WebGL2RenderingContext.prototype.readPixels = new Proxy(_readPixels2, hook)
      }

      /* Report */
      {
        const _getSupportedExtensions = win.WebGLRenderingContext.prototype.getSupportedExtensions
        const _getSupportedExtensions2 = win.WebGL2RenderingContext.prototype.getSupportedExtensions

        const hook = {
          apply: (target: any, thisArg: WebGLRenderingContext, args: any) => {
            const res = target.apply(thisArg, args)
            if (res) {
              const value: [number, number] = getValue('other.webgl', conf.fingerprint.other.webgl)
              res.push?.('EXT_' + value[0] + value[1])
            }
            return res;
          }
        }
        win.WebGLRenderingContext.prototype.getSupportedExtensions = new Proxy(_getSupportedExtensions, hook)
        win.WebGL2RenderingContext.prototype.getSupportedExtensions = new Proxy(_getSupportedExtensions2, hook)
      }
    },
  },

  'hook toDataURL': {
    condition: ({ conf }) =>
      conf.fingerprint.other.canvas.type !== HookType.default ||
      conf.fingerprint.other.webgl.type !== HookType.default,
    onEnable: ({ win, conf, rawObjects, getValue }) => {
      const _toDataURL = win.HTMLCanvasElement.prototype.toDataURL
      win.HTMLCanvasElement.prototype.toDataURL = new Proxy(_toDataURL, {
        apply: (target, thisArg: HTMLCanvasElement, args: Parameters<typeof HTMLCanvasElement.prototype.toDataURL>) => {
          /* 2d */
          if (conf.fingerprint.other.canvas.type !== HookType.default) {
            const ctx = thisArg.getContext('2d');
            if (ctx) {
              const value: number[] = getValue('other.canvas', conf.fingerprint.other.canvas)
              value && rawObjects.getImageData && drawNoise(
                rawObjects.getImageData, value,
                ctx, 0, 0, thisArg.width, thisArg.height)
              return target.apply(thisArg, args);
            }
          }
          /* webgl */
          if (conf.fingerprint.other.webgl.type !== HookType.default) {
            const gl = thisArg.getContext('webgl') ?? thisArg.getContext('webgl2')
            if (gl) {
              const value: [number, number] = getValue('other.webgl', conf.fingerprint.other.webgl)
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
    condition: ({ conf }) => conf.fingerprint.other.audio.type !== HookType.default,
    onEnable: ({ win, conf, random }) => {
      const _createDynamicsCompressor = win.OfflineAudioContext.prototype.createDynamicsCompressor
      win.OfflineAudioContext.prototype.createDynamicsCompressor = new Proxy(_createDynamicsCompressor, {
        apply: (target, thisArg: OfflineAudioContext, args: Parameters<typeof OfflineAudioContext.prototype.createDynamicsCompressor>) => {
          const value: number | null = random('other.audio', conf.fingerprint.other.audio)
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
    condition: ({ conf }) => conf.fingerprint.other.timezone.type !== HookType.default,
    onEnable: ({ win, conf, getValue }) => {
      /* DateTimeFormat */
      {
        const _DateTimeFormat = win.Intl.DateTimeFormat
        win.Intl.DateTimeFormat = new Proxy(_DateTimeFormat, {
          construct: (target, args: Parameters<typeof Intl.DateTimeFormat>, newTarget) => {
            const currTimeZone: TimeZoneInfo = getValue('other.timezone', conf.fingerprint.other.timezone)
            args[0] = args[0] ?? currTimeZone.locale
            args[1] = Object.assign({ timeZone: currTimeZone.zone }, args[1]);
            return new target(...args)
          },
          apply: (target, thisArg: Intl.DateTimeFormat, args: Parameters<typeof Intl.DateTimeFormat>) => {
            const currTimeZone: TimeZoneInfo = getValue('other.timezone', conf.fingerprint.other.timezone)
            args[0] = args[0] ?? currTimeZone.locale
            args[1] = Object.assign({ timeZone: currTimeZone.zone }, args[1]);
            return target.apply(thisArg, args)
          },
        })
      }

      /* getTimezoneOffset & toString */
      {
        const _getTimezoneOffset = win.Date.prototype.getTimezoneOffset
        const _toString = win.Date.prototype.toString
        const _toDateString = win.Date.prototype.toDateString
        const _toTimeString = win.Date.prototype.toTimeString

        const useHook = (handle: (thisArg: Date, tz: TimeZoneInfo) => any) => ({
          apply: (target: any, thisArg: Date, args: Parameters<typeof Date.prototype.toString>) => {
            const tz: TimeZoneInfo | null = getValue('other.timezone', conf.fingerprint.other.timezone)
            if (tz === null) return target.apply(thisArg, args);
            return handle(thisArg, tz)
          }
        })
        win.Date.prototype.getTimezoneOffset = new Proxy(_getTimezoneOffset, useHook((_, tz) => {
          return tz.offset * -60
        }))
        win.Date.prototype.toString = new Proxy(_toString, useHook((thisArg, tz) => {
          const ps = getStandardDateTimeParts(thisArg, tz.zone)
          return `${ps.weekday} ${ps.month} ${ps.day} ${ps.year} ${ps.hour}:${ps.minute}:${ps.second} ${ps.timeZoneName?.replace(':', '')}`
        }))
        win.Date.prototype.toDateString = new Proxy(_toDateString, useHook((thisArg, tz) => {
          const ps = getStandardDateTimeParts(thisArg, tz.zone)
          return `${ps.weekday} ${ps.month} ${ps.day} ${ps.year}`
        }))
        win.Date.prototype.toTimeString = new Proxy(_toTimeString, useHook((thisArg, tz) => {
          const ps = getStandardDateTimeParts(thisArg, tz.zone)
          return `${ps.hour}:${ps.minute}:${ps.second} ${ps.timeZoneName?.replace(':', '')}`
        }))
      }

      /* toLocaleString */
      {
        const _toLocaleString = win.Date.prototype.toLocaleString
        const _toLocaleDateString = win.Date.prototype.toLocaleDateString
        const _toLocaleTimeString = win.Date.prototype.toLocaleTimeString

        const hook = {
          apply: (target: any, thisArg: Date, args: Parameters<typeof Date.prototype.toLocaleString>) => {
            const tz: TimeZoneInfo | null = getValue('other.timezone', conf.fingerprint.other.timezone)
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

      /* Date */
      {
        const _Date = win.Date
        win.Date = new Proxy(_Date, {
          apply: (target, thisArg: Date, args: Parameters<typeof Date>) => {
            return new Date().toString()
          }
        })
      }
    },
  },

  'hook webrtc': {
    condition: ({ conf }) => conf.fingerprint.other.webrtc.type !== HookType.default,
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
    condition: ({ conf }) => conf.fingerprint.other.font.type !== HookType.default,
    onEnable: ({ win, conf, getValueDebounce }) => {
      const _offsetHeight = Object.getOwnPropertyDescriptor(win.HTMLElement.prototype, "offsetHeight")?.get
      if (_offsetHeight) {
        Object.defineProperty(win.HTMLElement.prototype, "offsetHeight", {
          get: new Proxy(_offsetHeight, {
            apply(target, thisArg: HTMLElement, args: any) {
              try {
                // const height = Math.floor(thisArg.getBoundingClientRect().height);
                const height = target.apply(thisArg, args);
                const noise: number = getValueDebounce('other.font', conf.fingerprint.other.font, height)
                return height + noise;
              } catch (_) {
              }
            }
          })
        });
      }
      const _offsetWidth = Object.getOwnPropertyDescriptor(win.HTMLElement.prototype, "offsetWidth")?.get
      if (_offsetWidth) {
        Object.defineProperty(win.HTMLElement.prototype, "offsetWidth", {
          get: new Proxy(_offsetWidth, {
            apply(target, thisArg: HTMLElement, args: any) {
              try {
                // const width = Math.floor(thisArg.getBoundingClientRect().width);
                const width = target.apply(thisArg, args);
                const noise: number = getValueDebounce('other.font', conf.fingerprint.other.font, width)
                return width + noise;
              } catch (_) {
              }
            }
          })
        });
      }
    },
  },

  'hook webgpu': {
    condition: ({ conf }) => conf.fingerprint.other.webgpu.type !== HookType.default,
    onEnable: ({ win, conf, randomDebounce }) => {
      /*** GPUAdapter ***/
      // @ts-ignore
      if (win.GPUAdapter) {
        try {
          const genNoise = (raw: any, offset: number) => {
            const rn = randomDebounce('other.webgpu', conf.fingerprint.other.webgpu, offset, 1, 64)!
            return raw ? raw - Math.floor(rn) : raw;
          }
          // @ts-ignore
          const _GPUAdapter = Object.getOwnPropertyDescriptor(win.GPUAdapter.prototype, "limits")!.get!;
          // @ts-ignore
          Object.defineProperty(win.GPUAdapter.prototype, "limits", {
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
            const rn = randomDebounce('other.webgpu', conf.fingerprint.other.webgpu, offset, 1, 64)!
            return raw ? raw - Math.floor(rn) : raw;
          }
          // @ts-ignore
          const _GPUDevice = Object.getOwnPropertyDescriptor(win.GPUDevice.prototype, "limits")!.get!;
          // @ts-ignore
          Object.defineProperty(win.GPUDevice.prototype, "limits", {
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
                    const noise: number = randomDebounce('other.webgpu', conf.fingerprint.other.webgpu, offset++, 0.01, 0.001)!
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
                    .sort(() => randomDebounce('other.webgpu', conf.fingerprint.other.webgpu, offset++, 1, -1)!)
                    .slice(0, count);

                  offset = 0
                  for (let i = 0; i < selected.length; i++) {
                    const index = selected[i];
                    let value = _data[index];
                    const noise: number = randomDebounce('other.webgpu', conf.fingerprint.other.webgpu, offset++, +0.0001, -0.0001)!
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