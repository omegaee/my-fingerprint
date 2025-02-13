import { FingerprintHandler } from "./core";
import { genRandomSeed, urlToHttpHost } from "@/utils/base";

// @ts-ignore
const storage: LocalStorage = _local;

// ------------
// script entry
// ------------
(() => {
  if (!window) return;

  let data: WindowStorage | undefined
  if (window.top === window) {
    const WIN_KEY = 'my_fingerprint_';
    data = {
      url: location.href,
      host: urlToHttpHost(location.href) ?? location.host,
      seed: genRandomSeed(),
      hooked: new Set(),
    }
    // @ts-ignore
    window[WIN_KEY] = data;
  } else {
    // @ts-ignore
    data = window[WIN_KEY]
  }

  if (!data || storage.whitelist.includes(data.host)) return;

  try {
    new FingerprintHandler(window, data, storage.config);
  } catch (_) { }
})()