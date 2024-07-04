import { FingerprintHandler } from "@/utils/core"

let fh: FingerprintHandler | undefined

const init = () => {
  const script: HTMLScriptElement | null = document.querySelector(`script[src="${import.meta.url}"]`)
  const sData = script?.dataset.data
  const data: Partial<LocalStorageConfig> = sData ? JSON.parse(sData) : {}
  script?.remove()

  fh = new FingerprintHandler(data)
}
init()

