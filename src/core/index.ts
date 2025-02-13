import { FingerprintHandler } from "./core";
import { urlToHttpHost } from "@/utils/base";

// @ts-ignore
const storage: LocalStorage = _local;

// ------------
// script entry
// ------------
(() => {
  if (!window) return;

  const host = urlToHttpHost(location.href)
  if (!host || storage.whitelist.includes(host)) return;

  try {
    new FingerprintHandler(window, { host }, storage.config);
  } catch (_) { }
})()