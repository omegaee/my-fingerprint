import { useTranslation } from "react-i18next"

const fKeys: HookFingerprintKey[] = ['appVersion', 'platform', 'userAgent', 'language', 'hardwareConcurrency', 'height', 'width', 'colorDepth', 'pixelDepth', 'canvas', 'audio', 'webgl', 'webrtc', 'timezone']

export type FHookRecordProps = {
  tab?: chrome.tabs.Tab
  config?: Partial<LocalStorageConfig>
  records?: ToolbarNoticeRecord['data']
}

export const FHookRecord = function ({config, records}: FHookRecordProps) {
  const [t] = useTranslation()

  return <section>
    {fKeys.map((key) =>
      <div key={key}
        className="p-1 rounded-sm flex justify-between items-center hover:bg-[#f4e6d38b]">
          <span>{key}</span>
          <span>× {records?.[key] ?? 0}</span>
      </div>)}
  </section>
}
export default FHookRecord