const IDENTIFY = '__MyFingerprint__'
import { ContentMsg } from '@/types/enum'

/**
 * 解包postMessage请求体
 */
export const unwrapMessage = (msg: any): any => {
  return msg[IDENTIFY]
}

/**
 * 包装Message
 */
const wrapMessage = (msg: any) => {
  return {[IDENTIFY]: msg}
}

/**
 * 设置hook记录
 */
export const postSetHookRecords = (hookRecords: Partial<Record<HookFingerprintKey, number>>) => {
  postMessage(wrapMessage({
    type: ContentMsg.SetHookRecords,
    data: hookRecords,
  } as PostSetHookRecords), location.origin)
}