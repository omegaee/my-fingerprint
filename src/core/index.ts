import { FingerprintContext, WIN_KEY } from "./core";
import { genRandomSeed, existParentDomain } from "@/utils/base";
import { getBrowser } from "@/utils/equipment";
import { sendToWindow } from "@/utils/message";
import { logManager } from '@/utils/log';

const logger = logManager.createLogger(__LOG_PREFIX_FILE_PATH__);

// @ts-ignore
const args = _args;

// ------------
// script entry
// ------------
(() => {
  const logLevel = args?.storage?.config?.prefs?.logLevel as LogLevelString | undefined;

  if (logLevel) {
    if (logLevel !== "INFO") {
      logger.info("set logLevel", logLevel);
      logManager.setLevel(logLevel);
    }
  } else {
    logger.warn("get logLevel from storage failed");
  }

  logger.debug("coreInject args", args);

  if (typeof window !== "undefined") {
    // @ts-ignore
    if (!args.fun && typeof coreInject === 'function') args.fun = coreInject;

    const storage: LocalStorage = args.storage;
    if (!window || !storage) return;

    const hook = (win: Window & typeof globalThis, data: WindowStorage | undefined) => {
      if (!data) return;

      const ps = storage.policies;
      if (ps.isBlacklistMode) {
        if (!existParentDomain(ps.blacklist, data.host)) return;
        if (win.location.hostname !== data.host && !existParentDomain(ps.blacklist, win.location.hostname)) return;
      } else {
        if (existParentDomain(ps.whitelist, data.host)) return;
        if (win.location.hostname !== data.host && existParentDomain(ps.whitelist, win.location.hostname)) return;
      }

      try {
        FingerprintContext.hookWindow(win, {
          info: data,
          conf: storage.config,
          args,
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
      sendToWindow(window.top ?? window, { type: 'core.get-info' })
    }
  }
  else if (typeof self !== "undefined") {
    const options = args.options;
    if (options) {
      FingerprintContext.hookWorker(self, options)
    }
  }
})()