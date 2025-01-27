import { HookType } from '@/types/enum'
import { genRandomVersionUserAgent } from "@/utils/equipment";
import { HookTask, recordAndSend } from "./core";
import { drawNoise, drawNoiseToWebgl, proxyUserAgentData } from './utils';
import { getStandardDateTimeParts } from '@/utils/time';

const hookTaskMap: Record<string, Omit<HookTask, 'name'>> = {

  'iframe html hook': {
    onlyOnceEnable: true,
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
    onEnable: ({ win, rawObjects, hookIframe }) => {
      if (!rawObjects.appendChild || !rawObjects.insertBefore || !rawObjects.replaceChild) {
        const apply = (target: any, thisArg: Object, args: any) => {
          const res = target.apply(thisArg, args)
          const node = args[0]
          if (node?.tagName === 'IFRAME') {
            hookIframe(node as HTMLIFrameElement)
          }
          return res
        }

        if (!rawObjects.appendChild) {
          rawObjects.appendChild = win.HTMLElement.prototype.appendChild
          win.HTMLElement.prototype.appendChild = new Proxy(rawObjects.appendChild, { apply })
        }
        if (!rawObjects.insertBefore) {
          rawObjects.insertBefore = win.HTMLElement.prototype.insertBefore
          win.HTMLElement.prototype.insertBefore = new Proxy(rawObjects.insertBefore, { apply })
        }
        if (!rawObjects.replaceChild) {
          rawObjects.replaceChild = win.HTMLElement.prototype.replaceChild
          win.HTMLElement.prototype.replaceChild = new Proxy(rawObjects.replaceChild, { apply })
        }
      }
    },
    onDisable: ({ win, rawObjects }) => {
      if (rawObjects.appendChild) {
        win.HTMLElement.prototype.appendChild = rawObjects.appendChild
        rawObjects.appendChild = undefined
      }
      if (rawObjects.insertBefore) {
        win.HTMLElement.prototype.insertBefore = rawObjects.insertBefore
        rawObjects.insertBefore = undefined
      }
      if (rawObjects.replaceChild) {
        win.HTMLElement.prototype.replaceChild = rawObjects.replaceChild
        rawObjects.replaceChild = undefined
      }
    },
  },

  'hook getOwnPropertyDescriptor': {
    condition: () => true,
    onEnable: ({ win, rawObjects }) => {
      if (!rawObjects.getOwnPropertyDescriptor) {
        rawObjects.getOwnPropertyDescriptor = win.Object.getOwnPropertyDescriptor

        const navigatorDesc = rawObjects.navigatorDescriptor ?? win.Object.getOwnPropertyDescriptor(win, 'navigator')
        const screenDesc = rawObjects.screenDescriptor ?? win.Object.getOwnPropertyDescriptor(win, 'screen')

        win.Object.getOwnPropertyDescriptor = new Proxy(rawObjects.getOwnPropertyDescriptor, {
          apply: (target, thisArg: Object, args: Parameters<typeof Object.getOwnPropertyDescriptor>) => {
            const [obj, prop] = args
            if (obj === win) {
              if (prop === 'navigator') return navigatorDesc
              if (prop === 'screen') return screenDesc
            }
            return target.apply(thisArg, args)
          }
        })
      }
    },
    onDisable: ({ win, rawObjects }) => {
      if (rawObjects.getOwnPropertyDescriptor) {
        win.Object.getOwnPropertyDescriptor = rawObjects.getOwnPropertyDescriptor
        rawObjects.getOwnPropertyDescriptor = undefined
      }
    }
  },

  'hook navigator': {
    condition: ({ conf, isAllDefault }) => !isAllDefault(conf.fingerprint.navigator) || conf.fingerprint.other.webrtc.type !== HookType.default,
    onEnable: ({ win, conf, rawObjects, getSeedByHookValue, getValue }) => {
      if (!rawObjects.navigatorDescriptor) {
        rawObjects.navigatorDescriptor = win.Object.getOwnPropertyDescriptor(win, "navigator");
        win.Object.defineProperty(win, 'navigator', {
          value: new Proxy(win.navigator, {
            get: (target: any, key: keyof Navigator | (string & {})) => {
              switch (key) {
                /* ua */
                case 'userAgent': {
                  const seed = getSeedByHookValue(conf.fingerprint.navigator.equipment)
                  recordAndSend(key)
                  return seed === null ? target[key] : genRandomVersionUserAgent(seed, target)
                }
                case 'appVersion': {
                  const seed = getSeedByHookValue(conf.fingerprint.navigator.equipment)
                  recordAndSend(key)
                  return seed === null ? target[key] : genRandomVersionUserAgent(seed, target, true)
                }
                case 'userAgentData' as any: {
                  const seed = getSeedByHookValue(conf.fingerprint.navigator.equipment)
                  recordAndSend(key)
                  return seed === null ? target[key] : proxyUserAgentData(seed, target[key])
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
                  return value === null ? target[key] : value
                }
              }

              const value = target[key]
              return typeof value === 'function' ? value.bind(target) : value
            }
          })
        });
      }
    },
    onDisable: ({ win, rawObjects }) => {
      if (rawObjects.navigatorDescriptor) {
        win.Object.defineProperty(win, "navigator", rawObjects.navigatorDescriptor)
        rawObjects.navigatorDescriptor = undefined
      }
    }
  },

  'hook screen': {
    condition: ({ conf, isAllDefault }) => !isAllDefault(conf.fingerprint.screen),
    onEnable: ({ win, conf, rawObjects, getValue }) => {
      if (!rawObjects.screenDescriptor) {
        rawObjects.screenDescriptor = win.Object.getOwnPropertyDescriptor(win, "screen");
        win.Object.defineProperty(win, 'screen', {
          value: new Proxy(win.screen, {
            get: (target: any, key: keyof Screen | (string & {})) => {
              switch (key) {
                case 'width':
                case 'height':
                case 'colorDepth':
                case 'pixelDepth': {
                  const mode: HookMode | undefined = (conf.fingerprint.screen as any)[key]
                  const _key: any = 'screen.' + key
                  const value = getValue(_key, mode)
                  return value === null ? target[key] : value
                }
              }

              const value = target[key]
              return typeof value === 'function' ? value.bind(target) : value
            }
          })
        })
      }
    },
    onDisable: ({ win, rawObjects }) => {
      if (rawObjects.screenDescriptor) {
        win.Object.defineProperty(win, "screen", rawObjects.screenDescriptor)
        rawObjects.screenDescriptor = undefined
      }
    }
  },

  'hook canvas': {
    condition: ({ conf }) => conf.fingerprint.other.canvas.type !== HookType.default,
    onEnable: ({ win, conf, rawObjects, getValue }) => {
      if (!rawObjects.getContext) {
        rawObjects.getContext = win.HTMLCanvasElement.prototype.getContext
        win.HTMLCanvasElement.prototype.getContext = new Proxy(rawObjects.getContext, {
          apply: (target, thisArg, args: Parameters<typeof HTMLCanvasElement.prototype.getContext>) => {
            if (args[0] === '2d') {
              const option = args[1] ?? {};
              option.willReadFrequently = true;
              args[1] = option
            }
            return target.apply(thisArg, args);
          }
        });
      }
      if (!rawObjects.getImageData) {
        rawObjects.getImageData = win.CanvasRenderingContext2D.prototype.getImageData
        win.CanvasRenderingContext2D.prototype.getImageData = new Proxy(rawObjects.getImageData, {
          apply: (target, thisArg: CanvasRenderingContext2D, args: Parameters<typeof CanvasRenderingContext2D.prototype.getImageData>) => {
            const value: number[] = getValue('other.canvas', conf.fingerprint.other.canvas)
            if (value !== null) {
              return drawNoise(
                rawObjects.getImageData!, value,
                thisArg, ...args)
            }
            return target.apply(thisArg, args);
          }
        })
      }
    },
    onDisable: ({ win, rawObjects }) => {
      if (rawObjects.getImageData) {
        win.CanvasRenderingContext2D.prototype.getImageData = rawObjects.getImageData
        rawObjects.getImageData = undefined
      }
      if (rawObjects.getContext) {
        win.HTMLCanvasElement.prototype.getContext = rawObjects.getContext
        rawObjects.getContext = undefined
      }
    }
  },

  'hook webgl': {
    condition: ({ conf }) => conf.fingerprint.other.webgl.type !== HookType.default,
    onEnable: ({ win, conf, rawObjects, getValue }) => {
      /* Image */
      if (!rawObjects.readPixels || !rawObjects.readPixels2) {
        rawObjects.readPixels = win.WebGLRenderingContext.prototype.readPixels
        rawObjects.readPixels2 = win.WebGL2RenderingContext.prototype.readPixels

        const hook = {
          apply: (target: any, thisArg: WebGLRenderingContext | WebGL2RenderingContext, args: any) => {
            const value: [number, number] = getValue('other.webgl', conf.fingerprint.other.webgl)
            value && drawNoiseToWebgl(thisArg, value)
            return target.apply(thisArg, args as any);
          }
        }
        win.WebGLRenderingContext.prototype.readPixels = new Proxy(rawObjects.readPixels, hook)
        win.WebGL2RenderingContext.prototype.readPixels = new Proxy(rawObjects.readPixels2, hook)
      }
      /* Report */
      if (!rawObjects.getSupportedExtensions || !rawObjects.getSupportedExtensions2) {
        rawObjects.getSupportedExtensions = win.WebGLRenderingContext.prototype.getSupportedExtensions
        rawObjects.getSupportedExtensions2 = win.WebGL2RenderingContext.prototype.getSupportedExtensions

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
        win.WebGLRenderingContext.prototype.getSupportedExtensions = new Proxy(rawObjects.getSupportedExtensions, hook)
        win.WebGL2RenderingContext.prototype.getSupportedExtensions = new Proxy(rawObjects.getSupportedExtensions2, hook)
      }
    },
    onDisable: ({ win, rawObjects }) => {
      if (rawObjects.readPixels) {
        win.WebGLRenderingContext.prototype.readPixels = rawObjects.readPixels
        rawObjects.readPixels = undefined
      }
      if (rawObjects.readPixels2) {
        win.WebGL2RenderingContext.prototype.readPixels = rawObjects.readPixels2
        rawObjects.readPixels2 = undefined
      }
      if (rawObjects.getSupportedExtensions) {
        win.WebGLRenderingContext.prototype.getSupportedExtensions = rawObjects.getSupportedExtensions
        rawObjects.getSupportedExtensions = undefined
      }
      if (rawObjects.getSupportedExtensions2) {
        win.WebGL2RenderingContext.prototype.getSupportedExtensions = rawObjects.getSupportedExtensions2
        rawObjects.getSupportedExtensions2 = undefined
      }
    }
  },

  'hook toDataURL': {
    condition: ({ conf }) =>
      conf.fingerprint.other.canvas.type !== HookType.default ||
      conf.fingerprint.other.webgl.type !== HookType.default,
    onEnable: ({ win, conf, rawObjects, getValue }) => {
      if (!rawObjects.toDataURL) {
        rawObjects.toDataURL = win.HTMLCanvasElement.prototype.toDataURL
        win.HTMLCanvasElement.prototype.toDataURL = new Proxy(rawObjects.toDataURL, {
          apply: (target, thisArg: HTMLCanvasElement, args: Parameters<typeof HTMLCanvasElement.prototype.toDataURL>) => {
            /* 2d */
            if (conf?.fingerprint?.other?.canvas?.type !== HookType.default) {
              const ctx = thisArg.getContext('2d');
              if (ctx) {
                const value: number[] = getValue('other.canvas', conf.fingerprint.other.canvas)
                value && drawNoise(
                  rawObjects.getImageData!, value,
                  ctx, 0, 0, thisArg.width, thisArg.height)
                return target.apply(thisArg, args);
              }
            }
            /* webgl */
            if (conf?.fingerprint?.other?.webgl?.type !== HookType.default) {
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
      }
    },
    onDisable: ({ win, rawObjects }) => {
      if (rawObjects.toDataURL) {
        win.HTMLCanvasElement.prototype.toDataURL = rawObjects.toDataURL
        rawObjects.toDataURL = undefined
      }
    }
  },

  'hook audio': {
    condition: ({ conf }) => conf.fingerprint.other.audio.type !== HookType.default,
    onEnable: ({ win, conf, rawObjects, getValue }) => {
      if (!rawObjects.createDynamicsCompressor) {
        rawObjects.createDynamicsCompressor = win.OfflineAudioContext.prototype.createDynamicsCompressor
        win.OfflineAudioContext.prototype.createDynamicsCompressor = new Proxy(rawObjects.createDynamicsCompressor, {
          apply: (target, thisArg: OfflineAudioContext, args: Parameters<typeof OfflineAudioContext.prototype.createDynamicsCompressor>) => {
            const value: number | null = getValue('other.audio', conf.fingerprint.other.audio)
            if (value === null) return target.apply(thisArg, args)
            const compressor = target.apply(thisArg, args)
            // 创建一个增益节点，添加噪音
            const gain = thisArg.createGain()
            // 根据需要设置噪音的强度
            gain.gain.value = value * 0.01
            compressor.connect(gain)
            // 将增益节点的输出连接到上下文的目标
            gain.connect(thisArg.destination)
            return compressor
          }
        })
      }
    },
    onDisable: ({ win, rawObjects }) => {
      if (rawObjects.createDynamicsCompressor) {
        win.OfflineAudioContext.prototype.createDynamicsCompressor = rawObjects.createDynamicsCompressor
        rawObjects.createDynamicsCompressor = undefined
      }
    }
  },

  'hook timezone': {
    condition: ({ conf }) => conf.fingerprint.other.timezone.type !== HookType.default,
    onEnable: ({ win, conf, rawObjects, getValue }) => {
      if (!rawObjects.DateTimeFormat) {
        rawObjects.DateTimeFormat = win.Intl.DateTimeFormat
        win.Intl.DateTimeFormat = new Proxy(rawObjects.DateTimeFormat, {
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
      if (!rawObjects.dateGetTimezoneOffset || !rawObjects.dateToString || !rawObjects.dateToDateString || !rawObjects.dateToTimeString) {
        rawObjects.dateGetTimezoneOffset = win.Date.prototype.getTimezoneOffset
        rawObjects.dateToString = win.Date.prototype.toString
        rawObjects.dateToDateString = win.Date.prototype.toDateString
        rawObjects.dateToTimeString = win.Date.prototype.toTimeString

        const useHook = (handle: (thisArg: Date, tz: TimeZoneInfo) => any) => ({
          apply: (target: any, thisArg: Date, args: Parameters<typeof Date.prototype.toString>) => {
            const tz: TimeZoneInfo | null = getValue('other.timezone', conf.fingerprint.other.timezone)
            if (tz === null) return target.apply(thisArg, args);
            return handle(thisArg, tz)
          }
        })
        win.Date.prototype.getTimezoneOffset = new Proxy(rawObjects.dateGetTimezoneOffset, useHook((_, tz) => {
          return tz.offset * -60
        }))
        win.Date.prototype.toString = new Proxy(rawObjects.dateToString, useHook((thisArg, tz) => {
          const ps = getStandardDateTimeParts(thisArg, tz.zone)
          return `${ps.weekday} ${ps.month} ${ps.day} ${ps.year} ${ps.hour}:${ps.minute}:${ps.second} ${ps.timeZoneName?.replace(':', '')}`
        }))
        win.Date.prototype.toDateString = new Proxy(rawObjects.dateToDateString, useHook((thisArg, tz) => {
          const ps = getStandardDateTimeParts(thisArg, tz.zone)
          return `${ps.weekday} ${ps.month} ${ps.day} ${ps.year}`
        }))
        win.Date.prototype.toTimeString = new Proxy(rawObjects.dateToTimeString, useHook((thisArg, tz) => {
          const ps = getStandardDateTimeParts(thisArg, tz.zone)
          return `${ps.hour}:${ps.minute}:${ps.second} ${ps.timeZoneName?.replace(':', '')}`
        }))
      }
      if (!rawObjects.dateToLocaleString || !rawObjects.dateToLocaleDateString || !rawObjects.dateToLocaleTimeString) {
        rawObjects.dateToLocaleString = win.Date.prototype.toLocaleString
        rawObjects.dateToLocaleDateString = win.Date.prototype.toLocaleDateString
        rawObjects.dateToLocaleTimeString = win.Date.prototype.toLocaleTimeString

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
        win.Date.prototype.toLocaleString = new Proxy(rawObjects.dateToLocaleString, hook)
        win.Date.prototype.toLocaleDateString = new Proxy(rawObjects.dateToLocaleDateString, hook)
        win.Date.prototype.toLocaleTimeString = new Proxy(rawObjects.dateToLocaleTimeString, hook)
      }
      if (!rawObjects.Date) {
        rawObjects.Date = win.Date
        win.Date = new Proxy(rawObjects.Date, {
          apply: (target, thisArg: Date, args: Parameters<typeof Date>) => {
            return new Date().toString()
          }
        })
      }
    },
    onDisable: ({ win, rawObjects }) => {
      if (rawObjects.DateTimeFormat) {
        win.Intl.DateTimeFormat = rawObjects.DateTimeFormat
        rawObjects.DateTimeFormat = undefined
      }
      if (rawObjects.Date) {
        win.Date = rawObjects.Date
        rawObjects.Date = undefined
      }
      if (rawObjects.dateToString) {
        win.Date.prototype.toString = rawObjects.dateToString
        rawObjects.dateToString = undefined
      }
      if (rawObjects.dateToDateString) {
        win.Date.prototype.toDateString = rawObjects.dateToDateString
        rawObjects.dateToDateString = undefined
      }
      if (rawObjects.dateToTimeString) {
        win.Date.prototype.toTimeString = rawObjects.dateToTimeString
        rawObjects.dateToTimeString = undefined
      }
      if (rawObjects.dateToLocaleString) {
        win.Date.prototype.toLocaleString = rawObjects.dateToLocaleString
        rawObjects.dateToLocaleString = undefined
      }
      if (rawObjects.dateToLocaleDateString) {
        win.Date.prototype.toLocaleDateString = rawObjects.dateToLocaleDateString
        rawObjects.dateToLocaleDateString = undefined
      }
      if (rawObjects.dateToLocaleTimeString) {
        win.Date.prototype.toLocaleTimeString = rawObjects.dateToLocaleTimeString
        rawObjects.dateToLocaleTimeString = undefined
      }
    }
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
    onDisable: (_) => { }
  },

}

export const hookTasks = Object.entries(hookTaskMap).map(([name, task]): HookTask => ({ ...task, name }))
export default hookTasks