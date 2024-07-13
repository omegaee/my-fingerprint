import { genRandomSeed, urlToHttpHost } from "@/utils/base"
import { FingerprintHandler } from "./core"

let fh: FingerprintHandler | undefined

const init = () => {
  const script: HTMLScriptElement | null = document.querySelector(`script[src="${import.meta.url}"]`)
  const sData = script?.dataset.data
  const data: Partial<Omit<LocalStorage, 'version'>> = sData ? JSON.parse(sData) : {}
  script?.remove()

  const host = urlToHttpHost(location.href)
  if(!host)return

  fh = new FingerprintHandler(window, genRandomSeed(), host)
  fh.setConfig(data.config)
  
  const whitelist = data.whitelist ?? []
  whitelist.includes(host) && fh.disable()
}
init()

