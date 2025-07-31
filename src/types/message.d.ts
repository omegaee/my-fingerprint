/**
 * send to background
 */
declare namespace BgMessage {
  /**
   * background事件
   */
  type Event = {
    type: 'config.set'
    config: DeepPartial<LocalStorageConfig>
    $result: boolean
  } | {
    type: 'config.subscribe'
    url?: string
    $result: LocalStorage
  } | {
    type: 'notice.get'
    tabId: number
    host: string
    $result: Record<string, number>
  } | {
    type: 'notice.push'
    data: Record<string, number>
    total: Record<string, number>
  } | {
    type: 'whitelist.update'
    data?: {
      add?: string[]
      del?: string[]
    }
    clean?: boolean
  } | {
    type: 'version.latest'
    $result: string
  } | {
    type: 'api.check'
    api: string
    $result: boolean | string
  }

  type ResultField = '$result'

  type Type = Event['type']

  type EventByType<T extends Type> = Extract<Event, { type: T }>

  type Param<T extends Type> = EventByType<T> extends { [ResultField]: any }
    ? Omit<EventByType<T>, ResultField>
    : EventByType<T>

  type Result<T extends Type> = ResultField extends keyof EventByType<T>
    ? EventByType<T>[ResultField]
    : void;
}