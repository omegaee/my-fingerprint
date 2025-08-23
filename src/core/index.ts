import { FingerprintContext, WIN_KEY } from "./core";
import { genRandomSeed, existParentDomain } from "@/utils/base";
import { getBrowser } from "@/utils/equipment";
import { sendToWindow } from "@/utils/message";

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
      new FingerprintContext(win, {
        info: data,
        conf: storage.config,
      });
    } catch (_) { }
  }

  if (window.top === window) {
    const data: WindowStorage = {
      url: location.href,
      host: location.hostname,
      seed: genRandomSeed(),
      hooked: false,
      browser: getBrowser(navigator.userAgent),
    }
    // @ts-ignore
    window[WIN_KEY] = data;
    window.addEventListener('message', ((ev) => {
      const msg = ev?.data?.__myfp__;
      if (!msg || !ev.source) return;
      if (msg.type === 'core.get-info') {
        sendToWindow(ev.source, {
          type: 'core.run',
          data,
        }, ev.origin)
      }
    }) as WindowMessage.Listener)
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
    window.addEventListener('message', ((ev) => {
      const msg = ev?.data?.__myfp__;
      if (msg?.type === 'core.run') {
        hook(window, msg.data)
      }
    }) as WindowMessage.Listener)
    sendToWindow(window.top ?? window, { type: 'core.get-info' }, '*')
  }

})()