import { GithubApi, type GithubContentItem } from "@/api/github"
import { sharedAsync } from "@/utils/timer"
import { App, Button, Divider, Popconfirm, Spin, Tag } from "antd"
import { useEffect, useMemo, useState } from "react"
import { LoadingOutlined } from '@ant-design/icons'
import { trimSuffix } from "@/utils/base"
import { useShallow } from "zustand/shallow"
import { useStorageStore } from "../stores/storage"
import { useI18n } from "@/utils/hooks"

type LocalPresetItem = {
  file: string
  name: I18nString
  description: I18nString
}

type OnlinePresetContent = DeepPartial<LocalStorage> & {
  name?: I18nString
  description?: I18nString
}

const getLocalPresets = sharedAsync(async () => {
  const url = chrome.runtime.getURL('presets/index.json')
  return await fetch(url).then(res => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json()
  })
})

const getOnlinePresets = sharedAsync(async () => {
  return GithubApi.getContentList('/example/presets')
})

/**
 * 预设内容面板
 */
const PresetPanel = ({ }: {
}) => {
  const { t, asLang } = useI18n()
  const { message } = App.useApp()

  const [localPresets, setLocalPresets] = useState<LocalPresetItem[]>()
  const [onlinePresets, setOnlinePresets] = useState<GithubContentItem[]>()
  const [selectedKey, setSelectedKey] = useState<string>()

  const { importStorage } = useStorageStore(useShallow((state) => ({
    importStorage: state.importStorage
  })))

  useEffect(() => {
    getLocalPresets()
      .then((v) => setLocalPresets(Array.isArray(v.presets) ? v.presets : []))
      .catch(() => setLocalPresets([]))

    getOnlinePresets()
      .then((v) => setOnlinePresets(Array.isArray(v) ? v : []))
      .catch(() => setOnlinePresets([]))
  }, [])

  const onApply = (preset?: DeepPartial<LocalStorage>) => {
    if (!preset) return;
    importStorage(preset)
      .then(() => message.success(t('tip.ok.config-import')))
      .catch((err) => message.error(`${t('tip.err.config-import')}: ${err}`))
  }

  /**
   * 选择预设项
   */
  const PresetView = ({ id }: {
    id: string
  }) => {
    const a = localPresets?.find(v => v.file === id)
    if (a) return <LocalPresetView item={a} onApply={onApply} />;
    const b = onlinePresets?.find(v => v.sha === id)
    if (b) return <OnlinePresetView item={b} onApply={onApply} />;
    return <div className="h-full flex-center">{t('tip.label.unsupport-content')}</div>
  }

  return localPresets == null && onlinePresets == null ?
    <div className="w-full h-48 flex-center bg-[--ant-color-bg-container] rounded">
      <Spin indicator={<LoadingOutlined spin />} />
    </div> :
    <div className="w-full h-48 flex-center bg-[--ant-color-bg-container] rounded">
      <div className="w-full h-full p-2 flex animate-fadeIn">
        <div className="w-24 shrink-0 flex flex-col overflow-auto no-scrollbar">
          {localPresets && localPresets.length !== 0 && <div className="mb-1 last:mb-0">
            <div className="mb-1 font-bold">{t('g.local')}</div>
            {localPresets?.map(v => <PresetItem
              key={v.file}
              title={asLang(v.name) ?? 'null'}
              className={v.file === selectedKey ? 'bg-[--ant-color-primary-bg]' : undefined}
              onSelect={() => setSelectedKey(v.file)}
            />)}
          </div>}
          {onlinePresets && onlinePresets.length !== 0 && <div className="mb-1 last:mb-0">
            <div className="mb-1 font-bold">{t('g.online')}</div>
            {onlinePresets
              ?.filter(v => v.type === 'file')
              .map(v => <PresetItem
                key={v.sha}
                title={trimSuffix(v.name)}
                className={v.sha === selectedKey ? 'bg-[--ant-color-primary-bg]' : undefined}
                onSelect={() => setSelectedKey(v.sha)}
              />)}
          </div>}
        </div>
        <Divider className="h-full mx-2" type='vertical' />
        <div className="grow rounded">
          {selectedKey == null ?
            <div className="h-full flex-center">{t('tip.label.select-content')}</div> :
            <PresetView id={selectedKey} />}
        </div>
      </div>
    </div>
}

/**
 * 预设内容项
 */
const PresetItem = ({ title, onSelect, className }: {
  title?: string
  onSelect?: () => void
  className?: string
}) => {
  return <div
    className={"p-1 truncate rounded hover:bg-[--ant-color-primary-bg-hover] cursor-pointer duration-300 " + (className ?? '')}
    onClick={() => onSelect?.()}
  >
    <span>{title}</span>
  </div>
}

/**
 * 本地预设内容
 */
const LocalPresetView = ({ item, onApply }: {
  item: LocalPresetItem
  onApply?: (preset: DeepPartial<LocalStorage>) => void
}) => {
  const { t, asLang } = useI18n()

  const [isLoading, setIsLoading] = useState(false)
  const [preset, setPreset] = useState<DeepPartial<LocalStorage>>()

  const manifest = useMemo(() => chrome.runtime.getManifest(), [])

  useEffect(() => {
    if (!item?.file) return;
    setIsLoading(true)
    setPreset(undefined)
    fetch(chrome.runtime.getURL(`presets/${item.file}`))
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json()
      })
      .then(setPreset)
      .catch(() => setPreset(undefined))
      .finally(() => setIsLoading(false))
  }, [item])

  return isLoading ?
    <div className="h-full flex-center"><Spin indicator={<LoadingOutlined spin />} /></div> :
    preset == null ?
      <div className="h-full flex-center">{'tip.label.unsupport-content'}</div> :
      <div className="h-full flex flex-col gap-2 overflow-y-auto">
        <div>
          <Tag color='green'>{t('g.local')}</Tag>
          {preset.version != null && manifest.version !== preset.version && <Tag color='error'>{t('tip.label.version-mismatch')}</Tag>}
          {!preset.config && preset.whitelist?.length && <Tag color='cyan'>{t('tag.only-whitelist')}</Tag>}
        </div>
        <p className="font-bold">{asLang(item.name) ?? 'null'}</p>
        <p>{asLang(item.description) ?? 'null'}</p>
        <Popconfirm
          title={t('g.apply')}
          description={t('tip.if.config-import')}
          onConfirm={() => onApply?.(preset)}
          okText={t('g.confirm')}
          showCancel={false}
        >
          <Button>{t('g.apply')}</Button>
        </Popconfirm>
      </div>
}

/**
 * 在线预设内容
 */
const OnlinePresetView = ({ item, onApply }: {
  item: GithubContentItem
  onApply?: (preset: DeepPartial<LocalStorage>) => void
}) => {
  const { t, asLang } = useI18n()

  const [raw, setRaw] = useState<string>()
  const [preset, setPreset] = useState<OnlinePresetContent>()

  const manifest = useMemo(() => chrome.runtime.getManifest(), [])

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

  return raw == null ?
    <div className="h-full flex-center"><Spin indicator={<LoadingOutlined spin />} /></div> :
    preset == null ?
      <div className="h-full flex-center">{'tip.label.unsupport-content'}</div> :
      <div className="h-full flex flex-col gap-2 overflow-y-auto">
        <div>
          <Tag color='blue'>{t('g.online')}</Tag>
          {preset.version && <Tag>v{preset.version}</Tag>}
          {preset.version && manifest.version !== preset.version && <Tag color='error'>{t('tip.label.version-mismatch')}</Tag>}
          {!preset.config && preset.whitelist?.length && <Tag color='cyan'>{t('tag.only-whitelist')}</Tag>}
        </div>
        <p className="font-bold">{asLang(preset.name) ?? 'null'}</p>
        <p>{asLang(preset.description) ?? 'null'}</p>
        <Popconfirm
          title={t('g.apply')}
          description={t('tip.if.config-import')}
          onConfirm={() => onApply?.(preset)}
          okText={t('g.confirm')}
          showCancel={false}
        >
          <Button>{t('g.apply')}</Button>
        </Popconfirm>
      </div>
}

export default PresetPanel