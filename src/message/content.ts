export const enum MContentType {
  SetHookRecords = 'set-hook-records',
  GetHookInfo = 'get-hook-info',
  StartHook = 'start-hook',
}

///
/// TYPE
///
export type MContentRequest = {
  [MContentType.SetHookRecords]: {
    type: MContentType.SetHookRecords,
    data: Record<string, number>,
    total: Record<string, number>,
  }
  [MContentType.GetHookInfo]: {
    type: MContentType.GetHookInfo,
  }
  [MContentType.StartHook]: {
    type: MContentType.StartHook,
    data: WindowStorage,
  }
}

///
/// API
///
const IDENTIFY = 'my_fingerprint'

/**
 * 解包Content消息
 */
export const unwrapContentMessage = (ev: MessageEvent<any>): MContentRequest[MContentType] | undefined => {
  return ev.data?.[IDENTIFY]
}

/**
 * 发送Content消息
 */
export const sendContentMessage = <T extends MContentType>(win: Window, msg: MContentRequest[T], origin?: string) => {
  win.postMessage({ [IDENTIFY]: msg }, origin ?? location.origin)
}