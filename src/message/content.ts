///
/// TYPE
///

export const enum ContentMessageType {
  SetHookRecords = 'set-hook-records',
  SetBadge = 'set-badge',
}

type SetHookRecordsMsg = {
  type: ContentMessageType.SetHookRecords,
  data: Partial<Record<string, number>>,
}

type SetBadgeMsg = {
  type: ContentMessageType.SetBadge,
  data: 'whitelist',
}

export type ContentMessage = SetHookRecordsMsg | SetBadgeMsg

///
/// API
///

const IDENTIFY = 'my_fingerprint'

/**
 * 解包postMessage请求体
 */
export const unwrapMessage = (msg: any): any => {
  return msg[IDENTIFY]
}

/**
 * 包装Message
 */
export const wrapMessage = <T = any>(msg: T) => {
  return { [IDENTIFY]: msg }
}

/**
 * 设置hook记录
 */
export const sendContentSetHookRecords = (hookRecords: Partial<Record<HookFingerprintKey, number>>) => {
  postMessage(wrapMessage<SetHookRecordsMsg>({
    type: ContentMessageType.SetHookRecords,
    data: hookRecords,
  }), location.origin)
}

/**
 * 设置Badge
 */
export const sendContentSetBadge = (data: SetBadgeMsg['data']) => {
  postMessage(wrapMessage<SetBadgeMsg>({
    type: ContentMessageType.SetBadge,
    data,
  }), location.origin)
}