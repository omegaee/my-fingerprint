import { FingerprintHandler } from "./core";
import { urlToHttpHost } from "@/utils/base";

// @ts-ignore
const tabId: number = _tid;
// @ts-ignore
const localStorage: LocalStorage = _local;

// ------------
// script entry
// ------------
(() => {
  const host = urlToHttpHost(location.href)
  if(!host){return}
  new FingerprintHandler(window, {
    tabId,
    host,
    inWhitelist: localStorage.whitelist.includes(host)
  }, localStorage.config)
})()