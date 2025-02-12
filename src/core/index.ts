import { FingerprintHandler } from "./core";
import { urlToHttpHost } from "@/utils/base";

// @ts-ignore
const localStorage: LocalStorage = _local;

// ------------
// script entry
// ------------
(() => {
  const host = urlToHttpHost(location.href)
  if (!host || localStorage.whitelist.includes(host)) { return }
  new FingerprintHandler(window, {
    host,
  }, localStorage.config)
})()