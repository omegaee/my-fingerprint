export const enum MTabType {
}

///
/// Request Type
///
export type MTabRequest = {
}

///
/// Response Type
///
export type MTabResponse = {
} & {
  [key in MTabType]: void
}

export type MRuntimeResponseCall<T extends keyof MTabResponse = any> = (data: MTabResponse[T]) => void

///
/// API
///

/**
 * 给所有标签发送消息
 */
// const sendMessageToAllTags = async <T extends MTabType>(msg: MTabRequest[T], callback?: MRuntimeResponseCall<T>) => {
//   const tabs = await chrome.tabs.query({})
//   for (const tab of tabs) {
//     try {
//       // @ts-ignore
//       tab.id && chrome.tabs.sendMessage(tab.id, msg, callback)
//     } catch (_) { }
//   }
// }
