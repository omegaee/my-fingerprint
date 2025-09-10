import { GithubApi, type GithubContentItem } from "@/api/github"
import { sharedAsync } from "@/utils/timer"
import { Button, Spin } from "antd"
import { useEffect, useMemo, useState } from "react"
import { LoadingOutlined } from '@ant-design/icons'
import { trimSuffix } from "@/utils/base"

const getPresets = sharedAsync(async () => {
  return GithubApi.getContentList('/example/presets')
})

const PresetContent = ({ }: {
}) => {
  const [presets, setPresets] = useState<GithubContentItem[]>()
  const [selected, setSelected] = useState<GithubContentItem>()

  useEffect(() => {
    getPresets()
      .then(setPresets)
      .catch(() => setPresets([]))
  }, [])

  return <div className="w-full h-48 flex justify-center items-center bg-[--ant-color-bg-container] rounded">
    {presets == null ?
      <Spin indicator={<LoadingOutlined spin />} /> :
      <div className="w-full h-full p-2 flex gap-2 animate-fadeIn">
        <div className="w-24 flex flex-col overflow-auto no-scrollbar">
          {presets
            .filter(v => v.type === 'file')
            .map(v => <PresetItem
              key={v.sha}
              item={v}
              className={v.sha === selected?.sha ? 'bg-[--ant-color-primary-bg]' : undefined}
              onSelect={setSelected}
            />)}
        </div>
        <div className="grow bg-[--ant-color-bg-layout] rounded">
          <PresetPanel item={selected} />
        </div>
      </div>}
  </div>
}

const PresetItem = ({ item, onSelect, className }: {
  item: GithubContentItem
  onSelect?: (item: GithubContentItem) => void
  className?: string
}) => {
  return <div
    className={"p-1 rounded hover:bg-[--ant-color-primary-bg-hover] cursor-pointer duration-300 " + (className ?? '')}
    onClick={() => onSelect?.(item)}
  >
    <span>{trimSuffix(item.name)}</span>
  </div>
}

type PresetContent = DeepPartial<LocalStorage> & {
  title?: string
  description?: string
}

const PresetPanel = ({ item }: {
  item?: GithubContentItem
}) => {
  const [raw, setRaw] = useState<string>()
  const [preset, setPreset] = useState<PresetContent>()

  useEffect(() => {
    if (!item?.download_url) return;
    fetch(item.download_url)
      .then(res => res.text())
      .then((data) => {
        setRaw(data)
        try {
          setPreset(JSON.parse(data))
        } catch (e) { }
      })
  }, [item])

  return item == null ?
    <div className="h-full flex justify-center items-center">请选择内容</div> :
    raw == null ?
      <div className="h-full flex justify-center items-center"><Spin indicator={<LoadingOutlined spin />} /></div> :
      preset == null ?
        <div className="h-full flex justify-center items-center">不支持的内容</div> :
        <div className="h-full p-2 flex flex-col justify-between">
          <div>
            <div>{preset?.title ?? '未命名'}</div>
            <div>{preset?.description ?? '暂无描述'}</div>
          </div>
          <div className="self-end">
            <Button>应用</Button>
          </div>
        </div>
}

export default PresetContent