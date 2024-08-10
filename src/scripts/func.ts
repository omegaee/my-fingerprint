export const isolatedScript = (injectSrc: string, storage: LocalStorage, data: {
  ContentMsg: typeof ContentMsg,
  RuntimeMsg: typeof RuntimeMsg,
}) => {
  const {
    ContentMsg,
    RuntimeMsg,
  } = data

  const runtime = {
    msgSetHookRecords(hookRecords: Partial<Record<HookFingerprintKey, number>>) {
      return chrome.runtime.sendMessage<SetHookRecordsRequest, void>({
        type: RuntimeMsg.SetHookRecords,
        data: hookRecords,
      })
    }
  }

  const content = {
    IDENTIFY: '__MyFingerprint__',
    unwrapMessage(msg: any): any {
      return msg[this.IDENTIFY]
    },
    wrapMessage<T = any>(msg: T) {
      return { [this.IDENTIFY]: msg }
    },
    postSetHookRecords(hookRecords: Partial<Record<HookFingerprintKey, number>>) {
      postMessage(this.wrapMessage<PostSetHookRecords>({
        type: ContentMsg.SetHookRecords,
        data: hookRecords,
      }), location.origin)
    },
    postSetConfig(config: DeepPartial<LocalStorageConfig>) {
      postMessage(this.wrapMessage<PostSetConfig>({
        type: ContentMsg.SetConfig,
        config,
      }), location.origin)
    },
    postUpdateState(mode: PostUpdateState['mode']) {
      postMessage(this.wrapMessage<PostUpdateState>({
        type: ContentMsg.UpdateState,
        mode,
      }), location.origin)
    }
  }

  // TODO: listener script message
  window.addEventListener('message', (ev) => {
    if (ev.origin != location.origin) return
    const msg = content.unwrapMessage(ev.data) as ContentRequest | undefined
    switch (msg?.type) {
      case ContentMsg.SetHookRecords: {
        runtime.msgSetHookRecords(msg.data)
        break
      }
    }
  })

  // TODO: listener runtime message
  chrome.runtime.onMessage.addListener((msg: MsgRequest, sender, sendResponse) => {
    switch (msg.type) {
      case RuntimeMsg.SetConfig: {
        // @ts-ignore
        content.postSetConfig(msg.config)
        break
      }
      case RuntimeMsg.UpdateScriptState: {
        // @ts-ignore
        content.postUpdateState(msg.mode)
      }
    }
  })

  // TODO: inject script
  let script = document.createElement('script')
  script.type = 'text/javascript';
  // script.src = chrome.runtime.getURL(injectSrc)
  script.src = injectSrc
  script.async = false
  script.defer = false
  script.dataset.data = JSON.stringify(storage)
  script.type = 'module'

  // document.documentElement.appendChild(script)
  const node = document.documentElement ?? document.head ?? document.body
  node.insertBefore(script, node.firstChild)
}

