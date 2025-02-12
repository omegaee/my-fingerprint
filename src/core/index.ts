import { sendContentSetBadge } from "@/message/content";
import { FingerprintHandler } from "./core";
import { urlToHttpHost } from "@/utils/base";

// @ts-ignore
const storage: LocalStorage = _local;

// ------------
// script entry
// ------------
(() => {
  if (!window) return;

  const top = window.top ?? window;

  const host = urlToHttpHost(top.location.href)
  if (!host) return;

  if (storage.whitelist.includes(host)) {
    sendContentSetBadge('whitelist')
  }

  try {
    new FingerprintHandler(window, { host }, storage.config);
  } catch (_) { }
})()