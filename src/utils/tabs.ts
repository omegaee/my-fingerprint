import { urlToHttpHost } from "./base"

/**
 * 选择出所有域名匹配的标签
 */
export const selectTabByHost = async (host: string | string[]) => {
  const tabs = await chrome.tabs.query({})
  if (Array.isArray(host)) {
    const hostSet = new Set(host)
    return tabs.filter((tab) => {
      if (tab.url) {
        const tHost = urlToHttpHost(tab.url)
        return tHost && hostSet.has(tHost)
      }
    })
  } else {
    return tabs.filter((tab) => tab.url && host === urlToHttpHost(tab.url))
  }
}

/**
 * 给所有标签发送消息
 */
export const sendMessageToAllTags = async <M = MsgRequest, C = RespFunc>(msg: M, callback?: C) => {
  const tabs = await chrome.tabs.query({})
  for (const tab of tabs) {
    try {
      // @ts-ignore
      tab.id && chrome.tabs.sendMessage(tab.id, msg, callback)
    } catch (_) { }
  }
}