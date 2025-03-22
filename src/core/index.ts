import { MContentType, sendContentMessage, unwrapContentMessage } from "@/message/content";
import { FingerprintHandler } from "./core";
import { genRandomSeed, existParentDomain } from "@/utils/base";

// @ts-ignore
const storage: LocalStorage = _local;

// ------------
// script entry
// ------------
(() => {
  if (!window) return;

  const hook = (win: Window & typeof globalThis, data: WindowStorage | undefined) => {
    if (!data) return;
    if (existParentDomain(storage.whitelist, data.host)) return;
    try {
      new FingerprintHandler(win, data, storage.config);
    } catch (_) { }
  }

  const WIN_KEY = 'my_fingerprint_';

  if (window.top === window) {
    const data: WindowStorage = {
      url: location.href,
      host: location.hostname,
      seed: genRandomSeed(),
      hooked: false,
    }
    // @ts-ignore
    window[WIN_KEY] = data;
    window.addEventListener('message', (ev) => {
      const msg = unwrapContentMessage(ev)
      if (!msg || !ev.source) return;
      if (msg.type === MContentType.GetHookInfo) {
        sendContentMessage(ev.source as any, { type: MContentType.StartHook, data }, ev.origin)
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
      const msg = unwrapContentMessage(ev)
      if (msg?.type === MContentType.StartHook) {
        hook(window, msg.data)
      }
    })
    sendContentMessage(window.top ?? window, { type: MContentType.GetHookInfo }, '*')
  }

})()