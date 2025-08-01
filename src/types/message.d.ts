/**
 * background消息事件
 */
declare namespace BackgroundMessage {
  /**
   * 事件
   */
  type Event = {
    type: 'config.set'
    config: DeepPartial<LocalStorageConfig>
    result?: boolean
    $: LocalStorageConfig
  } | {
    type: 'config.subscribe'
    url?: string
    $?: LocalStorage
  } | {
    type: 'notice.get'
    tabId: number
    host: string
    $: Record<string, number>
  } | {
    type: 'notice.push.fp'
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
    $?: string
  } | {
    type: 'api.check'
    api: string
    $: boolean | string
  }

  type ResultField = '$'

  type Type = Event['type']

  type EventByType<T extends Type> = Extract<Event, { type: T }>

  type ParamByType<T extends Type> = EventByType<T> extends any
    ? Omit<EventByType<T>, ResultField>
    : EventByType<T>

  type ResultByType<T extends Type> = ResultField extends keyof EventByType<T>
    ? EventByType<T>[ResultField]
    : void;

  type Param<T extends Event> = T extends any ? Omit<T, ResultField> : never

  type Sender = <T extends BackgroundMessage.Type>(message: BackgroundMessage.ParamByType<T>)
    => Promise<BackgroundMessage.ResultByType<T>>

  type Listener = (
    msg: Param<Event>,
    sender: chrome.runtime.MessageSender,
    sendResponse: <T extends Type>(response: ResultByType<T>) => void,
  ) => boolean | void
}

/**
 * window消息事件
 */
declare namespace WindowMessage {
  /**
   * 事件
   */
  type Event = {
    type: 'notice.push.fp'
    data: Record<string, number>
    total: Record<string, number>
  } | {
    type: 'notice.push.iframe'
    data: Record<string, number>
  } | {
    type: 'core.get-info'
  } | {
    type: 'core.run'
    data: WindowStorage
  }

  type Type = Event['type']

  type Identify = '__myfp__'

  type UseIdentify<T> = { [key in Identify]: T }

  type Sender = (win: MessageEventSource, message: Event, targetOrigin?: string) => void

  type Listener = (event: MessageEvent<UseIdentify<Event>>) => void
}