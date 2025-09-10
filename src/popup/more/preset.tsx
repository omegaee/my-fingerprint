import { GithubApi, type GithubContentItem } from "@/api/github"
import { sharedAsync } from "@/utils/timer"
import { App, Button, Divider, Popconfirm, Spin, Tag } from "antd"
import { useEffect, useMemo, useState } from "react"
import { LoadingOutlined } from '@ant-design/icons'
import { trimSuffix } from "@/utils/base"
import { useTranslation } from "react-i18next"
import { useShallow } from "zustand/shallow"
import { useStorageStore } from "../stores/storage"

const getPresets = sharedAsync(async () => {
  return GithubApi.getContentList('/example/presets?ref=feat/config-preset')
})

const PresetContent = ({ }: {
}) => {
  const [t] = useTranslation()

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
      <div className="w-full h-full p-2 flex animate-fadeIn">
        <div className="w-24 shrink-0 flex flex-col overflow-auto no-scrollbar">
          {presets.length === 0 && <div className="h-full flex justify-center items-center">{t('tip.label.no-fp-notice')}</div>}
          {presets
            .filter(v => v.type === 'file')
            .map(v => <PresetItem
              key={v.sha}
              item={v}
              className={v.sha === selected?.sha ? 'bg-[--ant-color-primary-bg]' : undefined}
              onSelect={setSelected}
            />)}
        </div>
        <Divider className="h-full mx-2" type='vertical' />
        <div className="grow rounded">
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
    className={"p-1 truncate rounded hover:bg-[--ant-color-primary-bg-hover] cursor-pointer duration-300 " + (className ?? '')}
    onClick={() => onSelect?.(item)}
  >
    <span>{trimSuffix(item.name)}</span>
  </div>
}

type PresetString = string | Record<string, string>

type PresetContent = DeepPartial<LocalStorage> & {
  title?: PresetString
  description?: PresetString
}

const PresetPanel = ({ item }: {
  item?: GithubContentItem
}) => {
  const [t, i18n] = useTranslation()
  const { message } = App.useApp()

  const [raw, setRaw] = useState<string>()
  const [preset, setPreset] = useState<PresetContent>()

  const { importStorage } = useStorageStore(useShallow((state) => ({
    importStorage: state.importStorage
  })))

  useEffect(() => {
    if (!item?.download_url) return;
    setRaw(undefined)
    setPreset(undefined)
    fetch(item.download_url)
      .then(res => res.text())
      .then((data) => {
        setRaw(data)
        try {
          setPreset(JSON.parse(data))
        } catch (e) { }
      })
  }, [item])

  const manifest = useMemo(() => chrome.runtime.getManifest(), [])

  const onApply = () => {
    if (!preset) return;
    importStorage(preset)
      .then(() => message.success(t('tip.ok.config-import')))
      .catch((err) => message.error(`${t('tip.err.config-import')}: ${err}`))
  }

  const asLang = (ps?: PresetString) => {
    if (!ps) return null;
    if (typeof ps === 'string') return ps;
    let res = ps[i18n.language]
    if (res) return res;
    const lang = i18n.language.split('-')[0] ?? manifest.default_locale ?? 'en'
    return ps[lang] ?? Object.values(ps)[0] ?? null;
  }

  return item == null ?
    <div className="h-full flex justify-center items-center">{t('tip.label.select-content')}</div> :
    raw == null ?
      <div className="h-full flex justify-center items-center"><Spin indicator={<LoadingOutlined spin />} /></div> :
      preset == null ?
        <div className="h-full flex justify-center items-center">{'tip.label.unsupport-content'}</div> :
        <div className="h-full flex flex-col justify-between overflow-y-auto">
          <div className="flex flex-col gap-2">
            <div>
              <Tag>{preset.version == null ? t('tag.general') : `v${preset.version}`}</Tag>
              {preset.version != null && manifest.version !== preset.version && <Tag color='error'>{t('tip.label.version-mismatch')}</Tag>}
            </div>
            <p className="font-bold">{asLang(preset.title) ?? 'null'}</p>
            <p>{asLang(preset.description) ?? 'null'}</p>
          </div>
          <div className="self-end">
            <Popconfirm
              title={t('g.apply')}
              description={t('tip.if.config-import')}
              onConfirm={onApply}
              okText={t('g.confirm')}
              showCancel={false}
            >
              <Button>{t('g.apply')}</Button>
            </Popconfirm>
          </div>
        </div>
}

export default PresetContent