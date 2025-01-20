const fKeys: string[] = ['appVersion', 'platform', 'userAgent', 'language', 'hardwareConcurrency', 'height', 'width', 'colorDepth', 'pixelDepth', 'canvas', 'audio', 'webgl', 'timezone']

export type FHookRecordProps = {
  tab?: chrome.tabs.Tab
  config?: Partial<LocalStorageConfig>
  records?: ToolbarNoticeRecord['data']
}

export const FHookRecord = function ({records}: FHookRecordProps) {
  return <section className="overflow-y-auto no-scrollbar h-full">
    {fKeys.map((key) =>
      <div key={key}
        className="p-1 rounded-sm flex justify-between items-center hover:bg-[--ant-color-bg-spotlight]">
          <span>{key}</span>
          <span className="font-bold">× {records?.[key] ?? 0}</span>
      </div>)}
  </section>
}
export default FHookRecord