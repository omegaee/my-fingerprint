import { urlToHttpHost } from "@/utils/base"
import { FingerprintHandler } from "@/utils/core"

let fh: FingerprintHandler | undefined

const init = () => {
  const script: HTMLScriptElement | null = document.querySelector(`script[src="${import.meta.url}"]`)
  const sData = script?.dataset.data
  const data: Partial<Omit<LocalStorage, 'version'>> = sData ? JSON.parse(sData) : {}
  script?.remove()

  fh = new FingerprintHandler(data.config)
  const host = urlToHttpHost(location.href)
  if(host){
    const whitelist = data.whitelist ?? []
    whitelist.includes(host) && fh.disable()
  }
}
init()

