import { getBrowserInfo } from "@/utils/browser";
import { logManager } from "@/utils/log"

const logger = logManager.createLogger(__LOG_PREFIX_FILE_PATH__);

export const setWebRTCPolicy = async (details?: {}): Promise<void> => {
  const policy = chrome.privacy?.network?.webRTCIPHandlingPolicy;
  if (!policy) {
    const message = "webRTCIPHandlingPolicy not found"
    logger.warn(message)
    throw new Error(message)
  }

  return new Promise((resolve, reject) => {
    const callback = () => {
      if (chrome.runtime.lastError) {
        const message = chrome.runtime.lastError.message
        logger.warn(message)
        reject(new Error(message))
      } else {
        resolve();
      }
    }
    if (details) {
      const { name } = getBrowserInfo()
      if (name === 'firefox') {
        policy.set({ value: "proxy_only" }, callback)
      } else {
        policy.set({ value: "disable_non_proxied_udp" }, callback)
      }
    } else {
      policy.clear({}, callback)
    }
  })
}