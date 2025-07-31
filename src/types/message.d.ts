/**
 * send to background
 */
declare namespace BgMessage {
  /**
   * background事件
   */
  type Event = {
    type: 'SetConfig'
    config: DeepPartial<LocalStorageConfig>
    $return: boolean
  } | {
    type: 'GetNotice'
    tabId: number
    host: string
  } | {
    type: 'SetHookRecords'
    data: Record<string, number>
    total: Record<string, number>
  }

  type ResultField = '$return'

  type Type = Event['type']

  type EventByType<T extends Type> = Extract<Event, { type: T }>

  type Param<T extends Type> = EventByType<T> extends { [ResultField]: any }
    ? Omit<EventByType<T>, ResultField>
    : EventByType<T>

  type Result<T extends Type> = ResultField extends keyof EventByType<T>
    ? EventByType<T>[ResultField]
    : void;
}