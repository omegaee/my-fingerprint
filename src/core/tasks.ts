import { HookType } from '@/types/enum'
import { genRandomVersionUserAgent } from "@/utils/equipment";
import { HookTask, recordAndSend } from "./core";
import { drawNoise, drawNoiseToWebgl, proxyUserAgentData } from './utils';
import { getStandardDateTimeParts } from '@/utils/time';

const hookTaskMap: Record<string, Omit<HookTask, 'name'>> = {

  'iframe html hook': {
    onlyOnceEnable: true,
    condition: (fh) => fh.conf?.hookBlankIframe,
    onEnable: (fh) => {
      // 监听DOM初始化
      const observer = new MutationObserver((mutations) => {
        if (mutations.length == 1) return;
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeName === 'IFRAME') {
              fh.hookIframe(node as HTMLIFrameElement)
            }
          }
        }
      });
      observer.observe(fh.win.document.documentElement, { childList: true, subtree: true });

      const closeObserver = () => {
        observer.disconnect()
        fh.win.removeEventListener('DOMContentLoaded', closeObserver, { capture: true })
        fh.win.removeEventListener('load', closeObserver, { capture: true })
      }
      fh.win.addEventListener('DOMContentLoaded', closeObserver, { capture: true })
      fh.win.addEventListener('load', closeObserver, { capture: true })
    },
  },

  'iframe script hook': {
    condition: (fh) => fh.conf?.hookBlankIframe,
    onEnable: (fh) => {
      if (!fh.rawObjects.appendChild || !fh.rawObjects.insertBefore || !fh.rawObjects.replaceChild) {
        const apply = (target: any, thisArg: Object, args: any) => {
          const res = target.apply(thisArg, args)
          const node = args[0]
          if (node?.tagName === 'IFRAME') {
            fh.hookIframe(node as HTMLIFrameElement)
          }
          return res
        }

        if (!fh.rawObjects.appendChild) {
          fh.rawObjects.appendChild = fh.win.HTMLElement.prototype.appendChild
          fh.win.HTMLElement.prototype.appendChild = new Proxy(fh.rawObjects.appendChild, { apply })
        }
        if (!fh.rawObjects.insertBefore) {
          fh.rawObjects.insertBefore = fh.win.HTMLElement.prototype.insertBefore
          fh.win.HTMLElement.prototype.insertBefore = new Proxy(fh.rawObjects.insertBefore, { apply })
        }
        if (!fh.rawObjects.replaceChild) {
          fh.rawObjects.replaceChild = fh.win.HTMLElement.prototype.replaceChild
          fh.win.HTMLElement.prototype.replaceChild = new Proxy(fh.rawObjects.replaceChild, { apply })
        }
      }
    },
    onDisable: (fh) => {
      if (fh.rawObjects.appendChild) {
        fh.win.HTMLElement.prototype.appendChild = fh.rawObjects.appendChild
        fh.rawObjects.appendChild = undefined
      }
      if (fh.rawObjects.insertBefore) {
        fh.win.HTMLElement.prototype.insertBefore = fh.rawObjects.insertBefore
        fh.rawObjects.insertBefore = undefined
      }
      if (fh.rawObjects.replaceChild) {
        fh.win.HTMLElement.prototype.replaceChild = fh.rawObjects.replaceChild
        fh.rawObjects.replaceChild = undefined
      }
    },
  },

  'hook getOwnPropertyDescriptor': {
    onEnable: (fh) => {
      if (!fh.rawObjects.getOwnPropertyDescriptor) {
        fh.rawObjects.getOwnPropertyDescriptor = fh.win.Object.getOwnPropertyDescriptor

        const navigatorDesc = fh.rawObjects.navigatorDescriptor ?? fh.win.Object.getOwnPropertyDescriptor(fh.win, 'navigator')
        const screenDesc = fh.rawObjects.screenDescriptor ?? fh.win.Object.getOwnPropertyDescriptor(fh.win, 'screen')

        fh.win.Object.getOwnPropertyDescriptor = new Proxy(fh.rawObjects.getOwnPropertyDescriptor, {
          apply: (target, thisArg: Object, args: Parameters<typeof Object.getOwnPropertyDescriptor>) => {
            const [obj, prop] = args
            if (obj === fh.win) {
              if (prop === 'navigator') return navigatorDesc
              if (prop === 'screen') return screenDesc
            }
            return target.apply(thisArg, args)
          }
        })
      }
    },
    onDisable: (fh) => {
      if (fh.rawObjects.getOwnPropertyDescriptor) {
        fh.win.Object.getOwnPropertyDescriptor = fh.rawObjects.getOwnPropertyDescriptor
        fh.rawObjects.getOwnPropertyDescriptor = undefined
      }
    }
  },

  'hook navigator': {
    condition: (fh) => !fh.isAllDefault(fh.conf?.fingerprint?.navigator),
    onEnable: (fh) => {
      if (!fh.rawObjects.navigatorDescriptor) {
        fh.rawObjects.navigatorDescriptor = fh.win.Object.getOwnPropertyDescriptor(fh.win, "navigator");
        fh.win.Object.defineProperty(fh.win, 'navigator', {
          value: new Proxy(fh.win.navigator, {
            get: (target, key: keyof Navigator) => {
              switch (key) {
                case 'userAgent': {
                  const seed = fh.getSeedByHookValue(fh.conf?.fingerprint?.navigator?.equipment)
                  recordAndSend(key)
                  return seed === null ? target[key] : genRandomVersionUserAgent(seed, target)
                }
                case 'appVersion': {
                  const seed = fh.getSeedByHookValue(fh.conf?.fingerprint?.navigator?.equipment)
                  recordAndSend(key)
                  return seed === null ? target[key] : genRandomVersionUserAgent(seed, target, true)
                }
                case 'userAgentData' as any: {
                  const seed = fh.getSeedByHookValue(fh.conf?.fingerprint?.navigator?.equipment)
                  recordAndSend(key)
                  return seed === null ? target[key] : proxyUserAgentData(seed, target[key])
                }
                case 'languages': {
                  if (fh.conf?.fingerprint?.navigator?.language?.type !== HookType.default) {
                    const language: string = fh.getValue('navigator', 'language')
                    return [...new Set([language, ...Array.from(target[key])])]
                  }
                }
              }

              const hValue = fh.getValue('navigator', key)
              if (hValue !== null) return hValue

              const value = target[key]
              return typeof value === 'function' ? value.bind(target) : value
            }
          })
        });
      }
    },
    onDisable: (fh) => {
      if (fh.rawObjects.navigatorDescriptor) {
        fh.win.Object.defineProperty(fh.win, "navigator", fh.rawObjects.navigatorDescriptor)
        fh.rawObjects.navigatorDescriptor = undefined
      }
    }
  },

  'hook screen': {
    condition: (fh) => !fh.isAllDefault(fh.conf?.fingerprint?.screen),
    onEnable: (fh) => {
      if (!fh.rawObjects.screenDescriptor) {
        fh.rawObjects.screenDescriptor = fh.win.Object.getOwnPropertyDescriptor(fh.win, "screen");
        fh.win.Object.defineProperty(fh.win, 'screen', {
          value: new Proxy(fh.win.screen, {
            get: (target, key: keyof Screen) => {
              const hValue = fh.getValue('screen', key)
              if (hValue !== null) return hValue;

              const value = target[key]
              // @ts-ignore
              return typeof value === 'function' ? value.bind(target) : value
            }
          })
        })
      }
    },
    onDisable: (fh) => {
      if (fh.rawObjects.screenDescriptor) {
        fh.win.Object.defineProperty(fh.win, "screen", fh.rawObjects.screenDescriptor)
        fh.rawObjects.screenDescriptor = undefined
      }
    }
  },

  'hook canvas': {
    condition: (fh) => fh.conf?.fingerprint?.other?.canvas?.type !== HookType.default,
    onEnable: (fh) => {
      if (!fh.rawObjects.getContext) {
        fh.rawObjects.getContext = fh.win.HTMLCanvasElement.prototype.getContext
        fh.win.HTMLCanvasElement.prototype.getContext = new Proxy(fh.rawObjects.getContext, {
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
      if (!fh.rawObjects.getImageData) {
        fh.rawObjects.getImageData = fh.win.CanvasRenderingContext2D.prototype.getImageData
        fh.win.CanvasRenderingContext2D.prototype.getImageData = new Proxy(fh.rawObjects.getImageData, {
          apply: (target, thisArg: CanvasRenderingContext2D, args: Parameters<typeof CanvasRenderingContext2D.prototype.getImageData>) => {
            const value: number[] = fh.getValue('other', 'canvas')
            if (value !== null) {
              return drawNoise(
                fh.rawObjects.getImageData!, value,
                thisArg, ...args)
            }
            return target.apply(thisArg, args);
          }
        })
      }
    },
    onDisable: (fh) => {
      if (fh.rawObjects.getImageData) {
        fh.win.CanvasRenderingContext2D.prototype.getImageData = fh.rawObjects.getImageData
        fh.rawObjects.getImageData = undefined
      }
      if (fh.rawObjects.getContext) {
        fh.win.HTMLCanvasElement.prototype.getContext = fh.rawObjects.getContext
        fh.rawObjects.getContext = undefined
      }
    }
  },

  'hook webgl': {
    condition: (fh) => fh.conf?.fingerprint?.other?.webgl?.type !== HookType.default,
    onEnable: (fh) => {
      /* Image */
      if (!fh.rawObjects.readPixels || !fh.rawObjects.readPixels2) {
        fh.rawObjects.readPixels = fh.win.WebGLRenderingContext.prototype.readPixels
        fh.rawObjects.readPixels2 = fh.win.WebGL2RenderingContext.prototype.readPixels

        const hook = {
          apply: (target: any, thisArg: WebGLRenderingContext | WebGL2RenderingContext, args: any) => {
            const value: [number, number] = fh.getValue('other', 'webgl')
            value && drawNoiseToWebgl(thisArg, value)
            return target.apply(thisArg, args as any);
          }
        }
        fh.win.WebGLRenderingContext.prototype.readPixels = new Proxy(fh.rawObjects.readPixels, hook)
        fh.win.WebGL2RenderingContext.prototype.readPixels = new Proxy(fh.rawObjects.readPixels2, hook)
      }
      /* Report */
      if (!fh.rawObjects.getSupportedExtensions || !fh.rawObjects.getSupportedExtensions2) {
        fh.rawObjects.getSupportedExtensions = fh.win.WebGLRenderingContext.prototype.getSupportedExtensions
        fh.rawObjects.getSupportedExtensions2 = fh.win.WebGL2RenderingContext.prototype.getSupportedExtensions

        const hook = {
          apply: (target: any, thisArg: WebGLRenderingContext, args: any) => {
            const res = target.apply(thisArg, args)
            if (res) {
              const value: [number, number] = fh.getValue('other', 'webgl')
              res.push?.('EXT_' + value[0] + value[1])
            }
            return res;
          }
        }
        fh.win.WebGLRenderingContext.prototype.getSupportedExtensions = new Proxy(fh.rawObjects.getSupportedExtensions, hook)
        fh.win.WebGL2RenderingContext.prototype.getSupportedExtensions = new Proxy(fh.rawObjects.getSupportedExtensions2, hook)
      }
    },
    onDisable: (fh) => {
      if (fh.rawObjects.readPixels) {
        fh.win.WebGLRenderingContext.prototype.readPixels = fh.rawObjects.readPixels
        fh.rawObjects.readPixels = undefined
      }
      if (fh.rawObjects.readPixels2) {
        fh.win.WebGL2RenderingContext.prototype.readPixels = fh.rawObjects.readPixels2
        fh.rawObjects.readPixels2 = undefined
      }
      if (fh.rawObjects.getSupportedExtensions) {
        fh.win.WebGLRenderingContext.prototype.getSupportedExtensions = fh.rawObjects.getSupportedExtensions
        fh.rawObjects.getSupportedExtensions = undefined
      }
      if (fh.rawObjects.getSupportedExtensions2) {
        fh.win.WebGL2RenderingContext.prototype.getSupportedExtensions = fh.rawObjects.getSupportedExtensions2
        fh.rawObjects.getSupportedExtensions2 = undefined
      }
    }
  },

  'hook toDataURL': {
    condition: (fh) =>
      fh.conf?.fingerprint?.other?.canvas?.type !== HookType.default ||
      fh.conf?.fingerprint?.other?.webgl?.type !== HookType.default,
    onEnable: (fh) => {
      if (!fh.rawObjects.toDataURL) {
        fh.rawObjects.toDataURL = fh.win.HTMLCanvasElement.prototype.toDataURL
        fh.win.HTMLCanvasElement.prototype.toDataURL = new Proxy(fh.rawObjects.toDataURL, {
          apply: (target, thisArg: HTMLCanvasElement, args: Parameters<typeof HTMLCanvasElement.prototype.toDataURL>) => {
            /* 2d */
            if (fh.conf?.fingerprint?.other?.canvas?.type !== HookType.default) {
              const ctx = thisArg.getContext('2d');
              if (ctx) {
                const value: number[] = fh.getValue('other', 'canvas')
                value && drawNoise(
                  fh.rawObjects.getImageData!, value,
                  ctx, 0, 0, thisArg.width, thisArg.height)
                return target.apply(thisArg, args);
              }
            }
            /* webgl */
            if (fh.conf?.fingerprint?.other?.webgl?.type !== HookType.default) {
              const gl = thisArg.getContext('webgl') ?? thisArg.getContext('webgl2')
              if (gl) {
                const value: [number, number] = fh.getValue('other', 'webgl')
                value && drawNoiseToWebgl(gl as any, value)
                return target.apply(thisArg, args);
              }
            }
            return target.apply(thisArg, args);
          }
        })
      }
    },
    onDisable: (fh) => {
      if (fh.rawObjects.toDataURL) {
        fh.win.HTMLCanvasElement.prototype.toDataURL = fh.rawObjects.toDataURL
        fh.rawObjects.toDataURL = undefined
      }
    }
  },

  'hook audio': {
    condition: (fh) => fh.conf?.fingerprint?.other?.audio?.type !== HookType.default,
    onEnable: (fh) => {
      if (!fh.rawObjects.createDynamicsCompressor) {
        fh.rawObjects.createDynamicsCompressor = fh.win.OfflineAudioContext.prototype.createDynamicsCompressor
        fh.win.OfflineAudioContext.prototype.createDynamicsCompressor = new Proxy(fh.rawObjects.createDynamicsCompressor, {
          apply: (target, thisArg: OfflineAudioContext, args: Parameters<typeof OfflineAudioContext.prototype.createDynamicsCompressor>) => {
            const value: number | null = fh.getValue('other', 'audio')
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
    onDisable: (fh) => {
      if (fh.rawObjects.createDynamicsCompressor) {
        fh.win.OfflineAudioContext.prototype.createDynamicsCompressor = fh.rawObjects.createDynamicsCompressor
        fh.rawObjects.createDynamicsCompressor = undefined
      }
    }
  },

  'hook timezone': {
    condition: (fh) => fh.conf?.fingerprint?.other?.timezone?.type !== HookType.default,
    onEnable: (fh) => {
      if (!fh.rawObjects.DateTimeFormat) {
        fh.rawObjects.DateTimeFormat = fh.win.Intl.DateTimeFormat
        fh.win.Intl.DateTimeFormat = new Proxy(fh.rawObjects.DateTimeFormat, {
          construct: (target, args: Parameters<typeof Intl.DateTimeFormat>, newTarget) => {
            const currTimeZone = fh.getValue('other', 'timezone') as TimeZoneInfo
            args[0] = args[0] ?? currTimeZone.locale
            args[1] = Object.assign({ timeZone: currTimeZone.zone }, args[1]);
            return new target(...args)
          },
          apply: (target, thisArg: Intl.DateTimeFormat, args: Parameters<typeof Intl.DateTimeFormat>) => {
            const currTimeZone = fh.getValue('other', 'timezone') as TimeZoneInfo
            args[0] = args[0] ?? currTimeZone.locale
            args[1] = Object.assign({ timeZone: currTimeZone.zone }, args[1]);
            return target.apply(thisArg, args)
          },
        })
      }
      if (!fh.rawObjects.dateGetTimezoneOffset || !fh.rawObjects.dateToString || !fh.rawObjects.dateToDateString || !fh.rawObjects.dateToTimeString) {
        fh.rawObjects.dateGetTimezoneOffset = fh.win.Date.prototype.getTimezoneOffset
        fh.rawObjects.dateToString = fh.win.Date.prototype.toString
        fh.rawObjects.dateToDateString = fh.win.Date.prototype.toDateString
        fh.rawObjects.dateToTimeString = fh.win.Date.prototype.toTimeString

        const useHook = (handle: (thisArg: Date, tz: TimeZoneInfo) => any) => ({
          apply: (target: any, thisArg: Date, args: Parameters<typeof Date.prototype.toString>) => {
            const tz: TimeZoneInfo | null = fh.getValue('other', 'timezone')
            if (tz === null) return target.apply(thisArg, args);
            return handle(thisArg, tz)
          }
        })
        fh.win.Date.prototype.getTimezoneOffset = new Proxy(fh.rawObjects.dateGetTimezoneOffset, useHook((_, tz) => {
          return tz.offset * -60
        }))
        fh.win.Date.prototype.toString = new Proxy(fh.rawObjects.dateToString, useHook((thisArg, tz) => {
          const ps = getStandardDateTimeParts(thisArg, tz.zone)
          return `${ps.weekday} ${ps.month} ${ps.day} ${ps.year} ${ps.hour}:${ps.minute}:${ps.second} ${ps.timeZoneName?.replace(':', '')}`
        }))
        fh.win.Date.prototype.toDateString = new Proxy(fh.rawObjects.dateToDateString, useHook((thisArg, tz) => {
          const ps = getStandardDateTimeParts(thisArg, tz.zone)
          return `${ps.weekday} ${ps.month} ${ps.day} ${ps.year}`
        }))
        fh.win.Date.prototype.toTimeString = new Proxy(fh.rawObjects.dateToTimeString, useHook((thisArg, tz) => {
          const ps = getStandardDateTimeParts(thisArg, tz.zone)
          return `${ps.hour}:${ps.minute}:${ps.second} ${ps.timeZoneName?.replace(':', '')}`
        }))
      }
      if (!fh.rawObjects.dateToLocaleString || !fh.rawObjects.dateToLocaleDateString || !fh.rawObjects.dateToLocaleTimeString) {
        fh.rawObjects.dateToLocaleString = fh.win.Date.prototype.toLocaleString
        fh.rawObjects.dateToLocaleDateString = fh.win.Date.prototype.toLocaleDateString
        fh.rawObjects.dateToLocaleTimeString = fh.win.Date.prototype.toLocaleTimeString

        const hook = {
          apply: (target: any, thisArg: Date, args: Parameters<typeof Date.prototype.toLocaleString>) => {
            const tz: TimeZoneInfo | null = fh.getValue('other', 'timezone')
            if (tz) {
              args[0] = args[0] ?? tz.locale
              args[1] = Object.assign({ timeZone: tz.zone }, args[1]);
            }
            return target.apply(thisArg, args);
          }
        }
        fh.win.Date.prototype.toLocaleString = new Proxy(fh.rawObjects.dateToLocaleString, hook)
        fh.win.Date.prototype.toLocaleDateString = new Proxy(fh.rawObjects.dateToLocaleDateString, hook)
        fh.win.Date.prototype.toLocaleTimeString = new Proxy(fh.rawObjects.dateToLocaleTimeString, hook)
      }
      if (!fh.rawObjects.Date) {
        fh.rawObjects.Date = fh.win.Date
        fh.win.Date = new Proxy(fh.rawObjects.Date, {
          apply: (target, thisArg: Date, args: Parameters<typeof Date>) => {
            return new Date().toString()
          }
        })
      }
    },
    onDisable: (fh) => {
      if (fh.rawObjects.DateTimeFormat) {
        fh.win.Intl.DateTimeFormat = fh.rawObjects.DateTimeFormat
        fh.rawObjects.DateTimeFormat = undefined
      }
      if (fh.rawObjects.Date) {
        fh.win.Date = fh.rawObjects.Date
        fh.rawObjects.Date = undefined
      }
      if (fh.rawObjects.dateToString) {
        fh.win.Date.prototype.toString = fh.rawObjects.dateToString
        fh.rawObjects.dateToString = undefined
      }
      if (fh.rawObjects.dateToDateString) {
        fh.win.Date.prototype.toDateString = fh.rawObjects.dateToDateString
        fh.rawObjects.dateToDateString = undefined
      }
      if (fh.rawObjects.dateToTimeString) {
        fh.win.Date.prototype.toTimeString = fh.rawObjects.dateToTimeString
        fh.rawObjects.dateToTimeString = undefined
      }
      if (fh.rawObjects.dateToLocaleString) {
        fh.win.Date.prototype.toLocaleString = fh.rawObjects.dateToLocaleString
        fh.rawObjects.dateToLocaleString = undefined
      }
      if (fh.rawObjects.dateToLocaleDateString) {
        fh.win.Date.prototype.toLocaleDateString = fh.rawObjects.dateToLocaleDateString
        fh.rawObjects.dateToLocaleDateString = undefined
      }
      if (fh.rawObjects.dateToLocaleTimeString) {
        fh.win.Date.prototype.toLocaleTimeString = fh.rawObjects.dateToLocaleTimeString
        fh.rawObjects.dateToLocaleTimeString = undefined
      }
    }
  },

  'hook webrtc': {
    condition: (fh) => fh.conf?.fingerprint?.other?.webrtc?.type !== HookType.default,
  }

}

export const hookTasks = Object.entries(hookTaskMap).map(([name, task]): HookTask => ({ ...task, name }))
export default hookTasks