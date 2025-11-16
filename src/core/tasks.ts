import { HookType } from '@/types/enum'
import { type HookTask } from "./core";
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
  randomScreenSize,
} from './utils';

export const hookTasks: HookTask[] = [
  /**
   * iframe html hook
   * 静态iframe注入
   */
  {
    onEnable: ({ win, hookWindow }) => {
      if (!win) return;

      // 监听DOM初始化
      const observer = new MutationObserver((mutations) => {
        // if (mutations.length == 1) return;
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeName === 'IFRAME') {
              notify('other.iframe')
              hookWindow((node as HTMLIFrameElement)?.contentWindow)
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
    onEnable: ({ win, hookWindow, useProxy, useGetterProxy }) => {
      if (!win) return;

      useGetterProxy(win.HTMLIFrameElement.prototype, 'contentWindow', {
        apply(target, thisArg: HTMLIFrameElement, args: any) {
          const w = Reflect.apply(target, thisArg, args);
          if (w) {
            notify('other.iframe')
            hookWindow(w)
          }
          return w;
        }
      });

      useGetterProxy(win.Document.prototype, 'defaultView', {
        apply(target, thisArg: Document, args: any) {
          const w = Reflect.apply(target, thisArg, args);
          if (w) {
            notify('other.iframe')
            hookWindow(w)
          }
          return w;
        }
      });

      useProxy(win.Node.prototype, [
        'appendChild', 'insertBefore', 'replaceChild'
      ], {
        apply(target: any, thisArg: Object, args: any) {
          const node = args[0]

          let iframes: HTMLCollection | undefined;
          if (node) {
            if (node.getElementsByTagName) {
              iframes = node.getElementsByTagName('iframe')
            } else if (node.querySelectorAll) {
              iframes = node.querySelectorAll('iframe')
            }
          }

          const res = Reflect.apply(target, thisArg, args)

          if (node?.tagName === 'IFRAME') {
            notify('other.iframe')
            hookWindow((node as HTMLIFrameElement)?.contentWindow)
          }
          if (iframes) {
            for (const iframe of iframes) {
              notify('other.iframe')
              hookWindow((iframe as HTMLIFrameElement)?.contentWindow)
            }
          }
          return res
        }
      });

    },
  },

  /**
   * Worker
   */
  {
    onEnable: ({ win, useProxy, makeScript }) => {
      if (!win) return;

      function createScriptUrl(url: string | URL) {
        const script = makeScript()
        if (script) {
          const code = `(async function() {
  const _code = await fetch('${url}').then(v=>v.text()).catch((e)=>console.warn(e.message));
  if (_code) {(()=>{${script}})();new Function(_code)();new Function('console.log(this)')();}
})()
`
          const blob = new Blob([code], { type: 'application/javascript' });
          return URL.createObjectURL(blob);
        }
        return url;
      }

      {
        const handler = {
          construct(target: any, args: any, newTarget: any) {
            notify('other.worker')
            const url = args[0];
            if (url) {
              args[0] = createScriptUrl(url);
            }
            return Reflect.construct(target, args, newTarget) as Worker;
          }
        }

        useProxy(win, 'Worker', handler);

        // TODO: SharedWorker似乎会丢失消息？
        // useProxy(win, 'SharedWorker', handler);
      }

      // TODO: ServiceWorker不支持blobUrl
      // {
      //   useProxy(win.ServiceWorkerContainer.prototype, 'register', {
      //     apply(target, thisArg: ServiceWorkerContainer, args) {
      //       const url = args[0];
      //       if (url) {
      //         args[0] = createScriptUrl(url);
      //       }
      //       return Reflect.apply(target, thisArg, args);
      //     }
      //   })
      // }
    }
  },

  /**
   * Navigator
   */
  {
    condition: ({ conf, isDefault }) => !isDefault(Object.values(conf.fp.navigator)),
    onEnable: (ctx) => {
      const { gthis, conf, symbol, useHookMode, useGetterProxy } = ctx;
      const fps = conf.fp.navigator;

      (gthis.navigator as any)[symbol.own] = getOwnProperties(gthis.navigator);
      const prototype = (gthis.Navigator ?? gthis.WorkerNavigator).prototype;

      /* userAgent & userAgentData */
      const uaInfo = useHookMode(fps.clientHints).value;
      if (uaInfo != null) {
        if (uaInfo.ua != null) {
          useGetterProxy([prototype, gthis.navigator], [
            'userAgent', 'appVersion', 'platform',
          ], (key, getter) => {
            const value = uaInfo.ua[key]
            if (value == null) return;
            return {
              apply(target, thisArg: Navigator, args: any) {
                notify('weak.' + key)
                return value;
              }
            }
          })
        }
        if (uaInfo.uaData != null) {
          useGetterProxy([prototype, gthis.navigator], ('userAgentData' as any), (_, getter) => ({
            apply(target, thisArg: Navigator, args: any) {
              notify('weak.userAgentData')
              const result = getter.call(thisArg)
              return proxyUserAgentData(ctx, result, uaInfo);
            }
          }))
        }
      }

      /* other */
      useGetterProxy([prototype, gthis.navigator], [
        'languages', 'hardwareConcurrency',
      ], (key, getter) => {
        const value: any = useHookMode(fps[key] as any).value
        if (value == null) return;
        return {
          apply(target, thisArg: Navigator, args: any) {
            notify('weak.' + key)
            return value;
          }
        }
      })

      {
        const value = useHookMode(fps.languages).value?.[0]
        value != null && useGetterProxy([prototype, gthis.navigator], 'language', {
          apply(target, thisArg: Navigator, args: any) {
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
      if (!win) return;

      const fps = conf.fp.screen;
      const ws = win.screen;

      (win.screen as any)[symbol.own] = getOwnProperties(win.screen);

      /* Screen Depth */
      const depth = useHookMode(fps.depth).value
      if (depth) {
        const tasks: { [key in keyof Screen]?: number } = {
          'colorDepth': depth?.color,
          'pixelDepth': depth?.pixel,
        }
        useGetterProxy([win.Screen.prototype, win.screen],
          Object.keys(tasks) as (keyof Screen)[],
          (key, getter) => {
            const num = tasks[key]
            if (num == null) return;
            return {
              apply(target, thisArg: Screen, args: any) {
                notify('weak.' + key)
                return num;
              }
            }
          });
      }

      /* Screen Size */
      {
        const { value, seed } = useHookMode(fps.size)
        const size: any =
          seed != null ? randomScreenSize(ws, seed) :
            value != null ? value :
              null;

        if (size) {
          if (size.width != null) size.availWidth = size.width - (ws.width - ws.availWidth);
          if (size.height != null) size.availHeight = size.height - (ws.height - ws.availHeight);

          useGetterProxy([win.Screen.prototype, ws], [
            'width', 'height', 'availWidth', 'availHeight'
          ], (key, getter) => {
            const num = size[key]
            if (num == null) return;
            return {
              apply(target, thisArg: Screen, args: any) {
                notify('weak.' + key)
                return num;
              }
            }
          })
        }
      }

    },
  },

  /**
   * Canvas
   */
  {
    condition: ({ conf }) => conf.fp.other.canvas.type !== HookType.default,
    onEnable: ({ win, conf, useSeed, useProxy }) => {
      if (!win) return;

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
      if (!win) return;

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
      if (!win) return;

      const fps = conf.fp.normal

      let ex: WEBGL_debug_renderer_info | null

      /* Report: Parameter */
      const info = useHookMode(fps.gpuInfo).value
      if (info) {
        const handler = {
          apply: (target: any, thisArg: WebGLRenderingContext, args: any) => {
            if (!ex) ex = thisArg.getExtension('WEBGL_debug_renderer_info');
            if (ex) {
              if (args[0] === ex.UNMASKED_VENDOR_WEBGL) {
                notify('weak.gpuInfo')
                // 模拟调用
                if (info.vendor && target.apply(thisArg, args)) {
                  return info.vendor;
                }
              } else if (args[0] === ex.UNMASKED_RENDERER_WEBGL) {
                notify('weak.gpuInfo')
                if (info.renderer && target.apply(thisArg, args)) {
                  return info.renderer;
                }
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
      if (!win) return;

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
    onEnable: ({ win, conf, useSeed, useProxy, useGetterProxy }) => {
      if (!win) return;

      const seed = useSeed(conf.fp.other.audio)
      if (seed == null) return;

      const mem = new WeakSet()

      useProxy(win.AudioBuffer.prototype, 'getChannelData', {
        apply: (target, thisArg: AudioBuffer, args: Parameters<typeof AudioBuffer.prototype.getChannelData>) => {
          notify('strong.audio')
          const data = target.apply(thisArg, args)
          if (mem.has(data)) return data;

          const step = data.length > 2000 ? 100 : 20;
          for (let i = 0; i < data.length; i += step) {
            const v = data[i]
            if (v !== 0 && Math.abs(v) > 1e-7) {
              data[i] += seededRandom(seed + i) * 1e-7;
            }
          }

          mem.add(data)
          return data;
        }
      })

      useProxy(win.AudioBuffer.prototype, [
        'copyFromChannel', 'copyToChannel',
      ], {
        apply: (target, thisArg: AudioBuffer, args: any) => {
          const channel = args[1]
          if (channel != null) {
            thisArg.getChannelData(channel)
          }
          return target.apply(thisArg, args)
        }
      })

      const dcNoise = seededRandom(seed) * 1e-7;
      useGetterProxy(win.DynamicsCompressorNode.prototype, 'reduction', (_, getter) => ({
        apply(target, thisArg, args: any) {
          notify('strong.audio')
          const res = getter.call(thisArg);
          return typeof res === 'number' ? res + dcNoise : res;
        }
      }))

    },
  },

  /**
   * Timezone
   * 时区
   */
  {
    condition: ({ conf }) => conf.fp.other.timezone.type !== HookType.default,
    onEnable: ({ win, conf, useHookMode, useProxy }) => {
      if (!win) return;

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
      if (!win) return;

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
      if (!win) return;

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
      if (!win) return;

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
      if (!win) return;

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
    onEnable: ({ gthis, symbol, useProxy }) => {
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
        useProxy(gthis.Object, 'getOwnPropertyNames', makeHandler('names'))
        useProxy(gthis.Object, 'getOwnPropertySymbols', makeHandler('symbols'))
        useProxy(gthis.Object, 'getOwnPropertyDescriptors', makeHandler('descriptors'))
        useProxy(gthis.Reflect, 'ownKeys', makeHandler('keys'))
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
        useProxy(gthis.Object, 'getOwnPropertyDescriptor', handler)
        useProxy(gthis.Reflect, 'getOwnPropertyDescriptor', handler)
      }
    }
  },

  /**
   * .setPrototypeOf
   */
  {
    onEnable: ({ gthis, symbol, hasRaw, useProxy }) => {
      useProxy(gthis.Reflect, 'setPrototypeOf', {
        apply(target: any, self: any, args: any[]) {
          const src = args[0]
          const dst = args[1]
          if (hasRaw(src) && dst != null) {
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
    onEnable: ({ gthis, info, symbol, myProxy, otherProxy, useProxy }) => {
      function isRealFunction(obj: any) {
        const target = Function.prototype.toString
        let proto = obj;
        while (proto = Object.getPrototypeOf(proto)) {
          if (proto.toString === target) {
            return !otherProxy.has(proto)
          }
        }
        return false;
      }

      useProxy(gthis.Function.prototype, 'toString', {
        apply(target: any, self: any, args: any[]) {
          try {
            if (self != null && myProxy.has(self)) {
              const raw = self[symbol.raw]
              if (raw) return Reflect.apply(target, raw, args);
            }
            return Reflect.apply(target, self, args);
          } catch (e: any) {
            // 堆栈伪造
            if (info.browser !== 'firefox') {
              const es = e.stack.split('\n')
              if (isRealFunction(self)) {
                es[1] = es[1].replace('Object', 'Function')
              }
              es.splice(2, 1);
              e.stack = es.join('\n');
            }
            throw e;
          }
        }
      })

    }
  },

  /**
   * Proxy
   */
  {
    onEnable: ({ gthis, otherProxy, useProxy }) => {
      useProxy(gthis, 'Proxy', {
        construct(target, args, newTarget) {
          const v = Reflect.construct(target, args, newTarget)
          otherProxy.add(v)
          return v;
        }
      })
    }
  },

];
