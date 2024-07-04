import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { msgGetNotice } from "@/message/runtime"

const fKeys: HookFingerprintKey[] = ['appVersion', 'platform', 'userAgent', 'language', 'hardwareConcurrency', 'height', 'width', 'colorDepth', 'pixelDepth', 'canvas', 'audio', 'webgl', 'webrtc', 'timezone']

export type FHookRecordProps = {
  config?: Partial<LocalStorageConfig>
}

export const FHookRecord = function ({config}: FHookRecordProps) {
  const [t] = useTranslation()
  const [record, setRecord] = useState<ToolbarNoticeRecord['data']>({})

  useEffect(() => {
    msgGetNotice().then((data) => {
      if(data.type === 'record'){
        setRecord(data.data)
      }
    })
  }, [])

  return <section>
    {fKeys.map((key) =>
      <div key={key}
        className="p-1 rounded-sm flex justify-between items-center hover:bg-[#f4e6d38b]">
          <span>{key}</span>
          <span>× {record[key] ?? 0}</span>
      </div>)}
  </section>
}
export default FHookRecord