import { HookType } from '@/types/enum'
import { type HookTask } from "./core";
import { genRandomVersionUserAgent } from "@/utils/equipment";
import { pick, seededRandom } from '@/utils/base';
import {
  notify,
  drawNoise,
  drawNoiseToWebgl,
  getOwnProperties,
  proxyUserAgentData,
  randomCanvasNoise,
  randomFontNoise,
  randomWebglNoise,
} from './utils';

export const hookTasks: HookTask[] = [
  /**
   * iframe html hook
   * 静态iframe注入
   */
  {
    onEnable: ({ win, hookIframe }) => {
      // 监听DOM初始化
      const observer = new MutationObserver((mutations) => {
        // if (mutations.length == 1) return;
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeName === 'IFRAME') {
              notify('other.iframe')
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

  /**
   * iframe script hook
   * 动态iframe注入
   */
  {
    onEnable: ({ win, hookIframe, useProxy }) => {

      useProxy(win.Node.prototype, [
        'appendChild', 'insertBefore', 'replaceChild'
      ], {
        apply(target: any, thisArg: Object, args: any) {
          const res = Reflect.apply(target, thisArg, args)
          const node = args[0]
          if (node?.tagName === 'IFRAME') {
            notify('other.iframe')
            hookIframe(node as HTMLIFrameElement)
          }
          return res
        }
      });

    },
  },

  /**
   * Navigator
   */
  {
    condition: ({ conf, isDefault }) => !isDefault(Object.values(conf.fp.navigator)),
    onEnable: ({ win, conf, info, symbol, useSeed, useHookMode, useGetterProxy }) => {
      const fps = conf.fp.navigator;

      (win.navigator as any)[symbol.own] = getOwnProperties(win.navigator);

      const _userAgent = Object.getOwnPropertyDescriptor(win.Navigator.prototype, 'userAgent')?.get
      const _appVersion = Object.getOwnPropertyDescriptor(win.Navigator.prototype, 'appVersion')?.get
      /* ua & appVersion */
      {
        const seed = useSeed(fps.uaVersion)
        if (seed != null && info.browser !== 'firefox' && _userAgent && _appVersion) {
          useGetterProxy([win.Navigator.prototype, win.navigator], [
            'userAgent', 'appVersion'
          ], (key, getter) => ({
            apply(target, thisArg: Screen, args: any) {
              notify('weak.' + key)
              return genRandomVersionUserAgent(seed, {
                userAgent: _userAgent.call(thisArg),
                appVersion: _appVersion.call(thisArg)
              }, key === 'appVersion');
            }
          }))
        }
      }

      /* userAgentData */
      {
        const seed = useSeed(fps.uaVersion)
        if (seed != null && info.browser !== 'firefox') {
          // @ts-ignore
          useGetterProxy([win.Navigator.prototype, win.navigator], 'userAgentData', (_, getter) => ({
            apply(target, thisArg: Screen, args: any) {
              notify('weak.userAgentData')
              const result = getter.call(thisArg)
              return proxyUserAgentData(seed, result);
            }
          }))
        }
      }

      /* other */
      useGetterProxy([win.Navigator.prototype, win.navigator], [
        'languages', 'hardwareConcurrency',
      ], (key, getter) => {
        const value: any = useHookMode(fps[key] as any).value
        if (value == null) return;
        return {
          apply(target, thisArg: Screen, args: any) {
            notify('weak.' + key)
            return value;
          }
        }
      })

      {
        const value = useHookMode(fps.languages).value?.[0]
        value != null && useGetterProxy([win.Navigator.prototype, win.navigator], 'language', {
          apply(target, thisArg: Screen, args: any) {
            notify('weak.languages')
            return value;
          }
        })
      }
    },
  },

  /**
   * Screen
   */
  {
    condition: ({ conf, isDefault }) => !isDefault(Object.values(conf.fp.screen)),
    onEnable: ({ win, conf, symbol, useHookMode, useGetterProxy }) => {
      const fps = conf.fp.screen;

      (win.screen as any)[symbol.own] = getOwnProperties(win.screen);

      const size = useHookMode(fps.size).value
      const depth = useHookMode(fps.depth).value
      const tasks: { [key in keyof Screen]?: number } = {
        'width': size?.width,
        'height': size?.height,
        'colorDepth': depth?.color,
        'pixelDepth': depth?.pixel,
      }
      useGetterProxy([win.Screen.prototype, win.screen],
        Object.keys(tasks) as (keyof Screen)[],
        (key, getter) => {
          const value = tasks[key]
          if (value == null) return;
          return {
            apply(target, thisArg: Screen, args: any) {
              notify('weak.' + key)
              return value;
            }
          }
        });

    },
  },

  /**
   * Canvas
   */
  {
    condition: ({ conf }) => conf.fp.other.canvas.type !== HookType.default,
    onEnable: ({ win, conf, useSeed, useProxy }) => {
      /* getContext */
      useProxy(win.HTMLCanvasElement.prototype, 'getContext', {
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
      {
        const seed = useSeed(conf.fp.other.canvas)
        if (seed != null) {
          const noise = randomCanvasNoise(seed)
          useProxy(win.CanvasRenderingContext2D.prototype, 'getImageData', {
            apply: (target, thisArg: CanvasRenderingContext2D, args: Parameters<typeof CanvasRenderingContext2D.prototype.getImageData>) => {
              notify('strong.canvas')
              return drawNoise(target, noise, thisArg, ...args);
            }
          })
        }
      }
    },
  },

  /**
   * Webgl
   */
  {
    condition: ({ conf }) => conf.fp.other.webgl.type !== HookType.default,
    onEnable: ({ win, conf, useSeed, useProxy }) => {
      /* Image */
      {
        const seed = useSeed(conf.fp.other.webgl)
        if (seed != null) {
          const noise = randomWebglNoise(seed)
          const handler = {
            apply: (target: any, thisArg: WebGLRenderingContext | WebGL2RenderingContext, args: any) => {
              notify('strong.webgl')
              drawNoiseToWebgl(thisArg, noise)
              return target.apply(thisArg, args as any);
            }
          }
          useProxy(win.WebGLRenderingContext.prototype, 'readPixels', handler)
          useProxy(win.WebGL2RenderingContext.prototype, 'readPixels', handler)
        }
      }
      /* Report: Supported Extensions */
      {
        const seed = useSeed(conf.fp.other.webgl)
        if (seed != null) {
          const noise = seededRandom(seed, 1, 0)
          const handler = {
            apply: (target: any, thisArg: WebGLRenderingContext, args: any) => {
              notify('strong.webgl')
              const res = target.apply(thisArg, args);
              res?.push?.('EXT_' + noise);
              return res;
            }
          }
          useProxy(win.WebGLRenderingContext.prototype, 'getSupportedExtensions', handler)
          useProxy(win.WebGL2RenderingContext.prototype, 'getSupportedExtensions', handler)
        }
      }
    },
  },

  /**
   * Webgl参数信息
   */
  {
    condition: ({ conf, isDefault }) => !isDefault(conf.fp.normal.gpuInfo),
    onEnable: ({ win, conf, useHookMode, useProxy }) => {
      const fps = conf.fp.normal

      /* Report: Parameter */
      const info = useHookMode(fps.gpuInfo).value
      if (info) {
        const handler = {
          apply: (target: any, thisArg: WebGLRenderingContext, args: any) => {
            const ex = thisArg.getExtension('WEBGL_debug_renderer_info')
            if (ex) {
              if (args[0] === ex.UNMASKED_VENDOR_WEBGL) {
                notify('weak.gpuInfo')
                if (info.vendor) return info.vendor;
              } else if (args[0] === ex.UNMASKED_RENDERER_WEBGL) {
                notify('weak.gpuInfo')
                if (info.renderer) return info.renderer;
              }
            }
            return target.apply(thisArg, args);
          }
        }
        useProxy(win.WebGLRenderingContext.prototype, 'getParameter', handler)
        useProxy(win.WebGL2RenderingContext.prototype, 'getParameter', handler)
      }
    }
  },

  /**
   * toDataURL
   */
  {
    condition: ({ conf, isDefault }) => !isDefault([conf.fp.other.canvas, conf.fp.other.webgl]),
    onEnable: ({ win, conf, useSeed, useProxy, useRaw }) => {

      const seedCanvas = useSeed(conf.fp.other.canvas)
      const seedWebgl = useSeed(conf.fp.other.webgl)
      const noiseCanvas = seedCanvas == null ? null : randomCanvasNoise(seedCanvas)
      const noiseWebgl = seedWebgl == null ? null : randomWebglNoise(seedWebgl)

      useProxy(win.HTMLCanvasElement.prototype, 'toDataURL', {
        apply: (target, thisArg: HTMLCanvasElement, args: Parameters<typeof HTMLCanvasElement.prototype.toDataURL>) => {
          /* 2d */
          if (noiseCanvas) {
            const ctx = thisArg.getContext('2d');
            if (ctx) {
              notify('strong.canvas')
              drawNoise(
                useRaw(win.CanvasRenderingContext2D.prototype.getImageData),
                noiseCanvas, ctx,
                0, 0, thisArg.width, thisArg.height
              )
              return target.apply(thisArg, args);
            }
          }
          /* webgl */
          if (noiseWebgl) {
            const gl = thisArg.getContext('webgl') ?? thisArg.getContext('webgl2')
            if (gl) {
              notify('strong.webgl')
              noiseWebgl && drawNoiseToWebgl(gl as any, noiseWebgl)
              return target.apply(thisArg, args);
            }
          }
          return target.apply(thisArg, args);
        }
      })

    },
  },

  /**
   * Audio
   * 音频指纹
   */
  {
    condition: ({ conf }) => conf.fp.other.audio.type !== HookType.default,
    onEnable: ({ win, conf, useSeed, useProxy }) => {
      const seed = useSeed(conf.fp.other.audio)
      if (seed == null) return;

      const noise = seededRandom(seed, 1, 0)
      useProxy(win.OfflineAudioContext.prototype, 'createDynamicsCompressor', {
        apply: (target, thisArg: OfflineAudioContext, args: Parameters<typeof OfflineAudioContext.prototype.createDynamicsCompressor>) => {
          notify('strong.audio')
          const compressor = target.apply(thisArg, args)
          const gain = thisArg.createGain()
          gain.gain.value = noise * 0.001
          compressor.connect(gain)
          gain.connect(thisArg.destination)
          return compressor
        }
      });

    },
  },

  /**
   * Timezone
   * 时区
   */
  {
    condition: ({ conf }) => conf.fp.other.timezone.type !== HookType.default,
    onEnable: ({ win, conf, useHookMode, useProxy }) => {
      const tzValue = useHookMode(conf.fp.other.timezone).value
      if (!tzValue) return;

      const _DateTimeFormat = win.Intl.DateTimeFormat;

      type TimeParts = Partial<Record<keyof Intl.DateTimeFormatPartTypesRegistry, string>>
      const getStandardDateTimeParts = (date: Date): TimeParts | null => {
        const formatter = new _DateTimeFormat('en-US', {
          timeZone: tzValue.zone ?? 'Asia/Shanghai',
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
          notify('weak.timezone')
          args[0] = args[0] ?? tzValue.locale
          args[1] = Object.assign({ timeZone: tzValue.zone }, args[1]);
          return new target(...args)
        },
        apply: (target, thisArg: Intl.DateTimeFormat, args: Parameters<typeof Intl.DateTimeFormat>) => {
          notify('weak.timezone')
          args[0] = args[0] ?? tzValue.locale
          args[1] = Object.assign({ timeZone: tzValue.zone }, args[1]);
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
        const tasks: { [key in keyof Date]?: (thisArg: Date) => any } = {
          'getTimezoneOffset': (_) => tzValue.offset * -60,
          'toString': (thisArg) => {
            const ps = getStandardDateTimeParts(thisArg)
            return ps && `${ps.weekday} ${ps.month} ${ps.day} ${ps.year} ${ps.hour}:${ps.minute}:${ps.second} ${ps.timeZoneName?.replace(':', '')}`
          },
          'toDateString': (thisArg) => {
            const ps = getStandardDateTimeParts(thisArg)
            return ps && `${ps.weekday} ${ps.month} ${ps.day} ${ps.year}`
          },
          'toTimeString': (thisArg) => {
            const ps = getStandardDateTimeParts(thisArg)
            return ps && `${ps.hour}:${ps.minute}:${ps.second} ${ps.timeZoneName?.replace(':', '')}`
          },
        }
        useProxy(win.Date.prototype,
          Object.keys(tasks) as (keyof Date)[],
          (key) => {
            const task = tasks[key]
            return task && {
              apply: (target: any, thisArg: Date, args: Parameters<typeof Date.prototype.toString>) => {
                notify('weak.timezone')
                const result = task(thisArg)
                return result == null ? target.apply(thisArg, args) : result
              }
            }
          })
      }

      /* toLocaleString */
      useProxy(win.Date.prototype, [
        'toLocaleString', 'toLocaleDateString', 'toLocaleTimeString'
      ], {
        apply: (target: any, thisArg: Date, args: Parameters<typeof Date.prototype.toLocaleString>) => {
          notify('weak.timezone')
          args[0] = args[0] ?? tzValue.locale
          args[1] = Object.assign({ timeZone: tzValue.zone }, args[1]);
          return target.apply(thisArg, args);
        }
      })

    },
  },

  /**
   * Webrtc
   */
  {
    condition: ({ conf }) => conf.fp.other.webrtc.type !== HookType.default,
    onEnable: ({ win, useDefine }) => {

      useDefine([win.Navigator.prototype, win.navigator], 'mediaDevices', {
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

  /**
   * Font
   * 字体指纹
   */
  {
    condition: ({ conf }) => conf.fp.other.font.type !== HookType.default,
    onEnable: ({ win, conf, useSeed, useProxy, useGetterProxy }) => {
      const seed = useSeed(conf.fp.other.font)
      if (seed == null) return;

      useGetterProxy(win.HTMLElement.prototype, [
        'offsetHeight', 'offsetWidth'
      ], (key, getter) => ({
        apply(target: () => any, thisArg: HTMLElement, args: any) {
          notify('strong.fonts')
          const result = getter.call(thisArg);
          const mark = (thisArg.style?.fontFamily ?? key) + result;
          return result + randomFontNoise(seed, mark);
        }
      }))

      useProxy(win, 'FontFace', {
        construct: (target, args: ConstructorParameters<typeof FontFace>, newTarget) => {
          const source = args[1]
          if (typeof source === 'string' && source.startsWith('local(')) {
            notify('strong.fonts')
            const name = source.substring(source.indexOf('(') + 1, source.indexOf(')'));
            const rand = seededRandom(name + seed, 1, 0);
            if (rand < 0.02) {
              args[1] = `local("${rand}")`
            } else if (rand < 0.04) {
              args[1] = 'local("Arial")'
            }
          }
          return new target(...args)
        },
      })

    },
  },

  /**
   * Webgpu
   */
  {
    condition: ({ conf }) => conf.fp.other.webgpu.type !== HookType.default,
    onEnable: ({ win, conf, useSeed, useDefine, useProxy, newProxy }) => {
      const seed = useSeed(conf.fp.other.webgpu)
      if (seed == null) return;

      /* GPUAdapter & GPUDevice */
      {
        const makeNoise = (raw: any, offset: number) => {
          notify('strong.webgpu')
          const rn = seededRandom(seed + (offset * 7), 64, 1)
          return raw ? raw - Math.floor(rn) : raw;
        }

        const handler = (_: any, desc: PropertyDescriptor) => {
          const getter = desc.get
          return getter && {
            get() {
              const limits = getter.call(this);
              return newProxy(limits, {
                get(target, prop) {
                  const value = target[prop];
                  switch (prop) {
                    case "maxBufferSize": return makeNoise(value, 0);
                    case "maxStorageBufferBindingSize": return makeNoise(value, 1);
                  }
                  return typeof value === "function" ? value.bind(target) : value;
                }
              })
            }
          }
        }

        // @ts-ignore
        win.GPUAdapter && useDefine(win.GPUAdapter.prototype, 'limits', handler)
        // @ts-ignore
        win.GPUDevice && useDefine(win.GPUDevice.prototype, 'limits', handler)
      }

      /*** GPUCommandEncoder ***/
      // @ts-ignore
      if (win.GPUCommandEncoder?.prototype?.beginRenderPass) {
        // @ts-ignore
        useProxy(win.GPUCommandEncoder.prototype, 'beginRenderPass', {
          apply(target, self, args) {
            notify('strong.webgpu')
            if (args?.[0]?.colorAttachments?.[0]?.clearValue) {
              try {
                const _clearValue = args[0].colorAttachments[0].clearValue
                let offset = 0
                for (let key in _clearValue) {
                  let value = _clearValue[key]
                  const noise = seededRandom(seed + (offset++ * 7), 0.01, 0.001)
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
            notify('strong.webgpu')
            const _data = args?.[2]
            if (_data && _data instanceof Float32Array) {
              try {
                const count = Math.ceil(_data.length * 0.05)
                let offset = 0
                const selected = Array(_data.length)
                  .map((_, i) => i)
                  .sort(() => seededRandom(seed + (offset++ * 7), 1, -1))
                  .slice(0, count);

                offset = 0
                for (let i = 0; i < selected.length; i++) {
                  const index = selected[i];
                  let value = _data[index];
                  const noise = seededRandom(seed + (offset++ * 7), +0.0001, -0.0001)
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

  /**
   * DomRect
   */
  {
    condition: ({ conf }) => conf.fp.other.domRect.type !== HookType.default,
    onEnable: ({ win, conf, useSeed, useProxy, useGetterProxy }) => {
      const seed = useSeed(conf.fp.other.domRect)
      if (seed == null) return;

      const mine = new WeakSet<DOMRect>()

      useProxy(win, [
        'DOMRect', 'DOMRectReadOnly'
      ], {
        construct(target, args, newTarget) {
          const res = Reflect.construct(target, args, newTarget)
          mine.add(res)
          return res;
        }
      })

      {
        const noise = seededRandom(seed, 1e-6, -1e-6);
        useGetterProxy(win.DOMRect.prototype, [
          'x', 'y', 'width', 'height'
        ], (_, getter) => ({
          apply(target, thisArg: DOMRect, args: any) {
            notify('strong.domRect')
            const res = getter.call(thisArg);
            if (mine.has(thisArg)) return res;
            return res + noise;
          }
        }))
      }

      {
        const hook = (key: keyof DOMRectReadOnly, toResult: (rect: DOMRectReadOnly) => number) => {
          useGetterProxy(win.DOMRectReadOnly.prototype, key, () => ({
            apply(target, thisArg: DOMRectReadOnly, args: any) {
              return toResult(thisArg)
            }
          }))
        }
        hook('top', rect => rect.y)
        hook('left', rect => rect.x)
        hook('bottom', rect => rect.y + rect.height)
        hook('right', rect => rect.x + rect.width)
      }

      useProxy(win.DOMRectReadOnly.prototype, 'toJSON', {
        apply(target, thisArg: DOMRectReadOnly, args: any) {
          notify('strong.domRect')
          return pick(thisArg, ['x', 'y', 'width', 'height', 'bottom', 'left', 'right', 'top']);
        }
      })
    }
  },

  /**
   * .ownProperties
   */
  {
    onEnable: ({ win, symbol, useProxy }) => {
      {
        /* multi */
        const makeHandler = (type: keyof HookOwnProperties) => ({
          apply(target: any, self: any, args: any[]) {
            const src = args[0]
            if (src != null && typeof src === 'object') {
              const own: HookOwnProperties | undefined = src[symbol.own]
              if (own) return own[type];
            }
            return target.apply(self, args as any)
          }
        })
        useProxy(win.Object, 'getOwnPropertyNames', makeHandler('names'))
        useProxy(win.Object, 'getOwnPropertySymbols', makeHandler('symbols'))
        useProxy(win.Object, 'getOwnPropertyDescriptors', makeHandler('descriptors'))
        useProxy(win.Reflect, 'ownKeys', makeHandler('keys'))
      }
      {
        /* one */
        const handler = {
          apply(target: any, self: any, args: any[]) {
            const src = args[0]
            if (src != null && typeof src === 'object') {
              const own: HookOwnProperties | undefined = src[symbol.own]
              if (own) return own.descriptors?.[args[1]];
            }
            return target.apply(self, args as any)
          }
        }
        useProxy(win.Object, 'getOwnPropertyDescriptor', handler)
        useProxy(win.Reflect, 'getOwnPropertyDescriptor', handler)
      }
    }
  },

  /**
   * .setPrototypeOf
   */
  {
    onEnable: ({ win, symbol, isHasRaw, useProxy }) => {
      useProxy(win.Reflect, 'setPrototypeOf', {
        apply(target: any, self: any, args: any[]) {
          const src = args[0]
          const dst = args[1]
          if (isHasRaw(src) && dst != null) {
            dst[symbol.reflect] = true
            const res = Reflect.apply(target, self, args);
            delete dst[symbol.reflect]
            return res;
          }
          return Reflect.apply(target, self, args);
        }
      })
    }
  },

  /**
   * .toString
   */
  {
    onEnable: ({ win, info, symbol, isReg, newProxy, useProxy }) => {
      useProxy(win.Function.prototype, 'toString', {
        apply(target: any, self: any, args: any[]) {
          try {
            if (self != null && isReg(self)) {
              const raw = self[symbol.raw]
              if (raw) return Reflect.apply(target, raw, args);
            }
            return Reflect.apply(target, self, args);
          } catch (e: any) {
            throw info.browser === 'firefox' ? e : newProxy(e, {
              get(target, key, receiver) {
                if (key === 'stack') {
                  const es = e.stack.split('\n')
                  es[1] = es[1].replace('Object', 'Function')
                  es.splice(2, 1);
                  return es.join('\n');
                }
                const res = target[key]
                return typeof res === 'function' ? res.bind(target) : res;
              }
            });
          }
        }
      })
    }
  },

];
