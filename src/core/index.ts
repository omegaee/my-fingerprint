import { type MContentRequest, MContentType } from "@/message/content";
import { FingerprintHandler } from "./core";
import { genRandomSeed, urlToHttpHost } from "@/utils/base";

// @ts-ignore
const storage: LocalStorage = _local;

// ------------
// script entry
// ------------
(() => {
  if (!window) return;

  const hook = (win: Window & typeof globalThis, data: WindowStorage | undefined) => {
    if (!data || storage.whitelist.includes(data.host)) return;
    try {
      new FingerprintHandler(win, data, storage.config);
    } catch (_) { }
  }

  const WIN_KEY = 'my_fingerprint_';

  if (window.top === window) {
    const data: WindowStorage = {
      url: location.href,
      host: urlToHttpHost(location.href) ?? location.host,
      seed: genRandomSeed(),
      hooked: [],
    }
    const data_s = JSON.stringify(data)
    // @ts-ignore
    window[WIN_KEY] = data;
    window.addEventListener('message', (ev) => {
      const msg: MContentRequest[MContentType] | undefined = ev.data[WIN_KEY]
      if (!msg || !ev.source) return;
      if (msg.type === MContentType.GetHookInfo) {
        // @ts-ignore
        ev.source.postMessage({ [WIN_KEY]: { type: MContentType.StartHook, data: data_s } }, ev.origin);
      }
    })
    hook(window, data)
    return;
  }

  try {
    /* 同源 */
    const top: any = window.top ?? window
    const data = top[WIN_KEY]
    hook(window, data)
  } catch (_) {
    /* 跨源 */
    window.addEventListener('message', (ev) => {
      const msg: MContentRequest[MContentType] | undefined = ev.data[WIN_KEY]
      if (msg?.type === MContentType.StartHook) {
        const _data = JSON.parse(msg.data)
        hook(window, _data)
      }
    })
    const top = window.top ?? window;
    top.postMessage({
      [WIN_KEY]: {
        type: MContentType.GetHookInfo
      }
    }, '*')
  }

})()