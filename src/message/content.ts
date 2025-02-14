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
    data: Partial<Record<string, number>>,
  }
  [MContentType.GetHookInfo]: {
    type: MContentType.GetHookInfo,
  }
  [MContentType.StartHook]: {
    type: MContentType.StartHook,
    data: string,
  }
}

///
/// API
///
const IDENTIFY = 'my_fingerprint'

const sendMessage = <T extends MContentType>(msg: MContentRequest[T]) => {
  postMessage({ [IDENTIFY]: msg }, location.origin)
}

/**
 * 解包postMessage请求体
 */
export const unwrapMessage = (msg: any): any => {
  return msg[IDENTIFY]
}

/**
 * 设置hook记录
 */
export const sendContentSetHookRecords = (hookRecords: Partial<Record<HookFingerprintKey, number>>) => {
  sendMessage({
    type: MContentType.SetHookRecords,
    data: hookRecords,
  })
}