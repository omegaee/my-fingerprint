import { GithubApi } from "@/api/github"
import { sharedAsync } from "@/utils/timer"
import { App, Button, Divider, Popconfirm, Spin, Tag } from "antd"
import { useEffect, useMemo, useState } from "react"
import { LoadingOutlined } from '@ant-design/icons'
import { useShallow } from "zustand/shallow"
import { useStorageStore } from "../stores/storage"
import { useI18n } from "@/utils/hooks"

type PresetItem = {
  file: string
  name: I18nString
  description: I18nString
}

const getLocalPresets = sharedAsync(async () => {
  const url = chrome.runtime.getURL('presets/index.json')
  return await fetch(url).then(res => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json()
  })
})

const getOnlinePresets = sharedAsync(async () => {
  return GithubApi.getJson('/example/presets/index.json')
})

/**
 * 预设内容面板
 */
const PresetPanel = ({ }: {
}) => {
  const { t, asLang } = useI18n()
  const { message } = App.useApp()

  const [localPresets, setLocalPresets] = useState<PresetItem[]>()
  const [onlinePresets, setOnlinePresets] = useState<PresetItem[]>()
  const [selectedKey, setSelectedKey] = useState<string>()

  const { importStorage } = useStorageStore(useShallow((state) => ({
    importStorage: state.importStorage
  })))

  useEffect(() => {
    getLocalPresets()
      .then(v => setLocalPresets(Array.isArray(v.presets) ? v.presets : []))
      .catch(() => setLocalPresets([]));
    getOnlinePresets()
      .then(v => setOnlinePresets(Array.isArray(v.presets) ? v.presets : []))
      .catch(() => setOnlinePresets([]));
  }, [])

  const onApply = (preset?: DeepPartial<LocalStorage>) => {
    if (!preset) return;
    importStorage(preset)
      .then(() => message.success(t('tip.ok.config-import')))
      .catch((err) => message.error(`${t('tip.err.config-import')}: ${err}`))
  }

  const infoProps = useMemo(() => {
    if (!selectedKey) return;
    if (selectedKey.startsWith('local:')) {
      const key = selectedKey.split(':')[1]
      const item = localPresets?.find(v => v.file === key)
      return item && { item, mode: 'local' }
    }
    if (selectedKey.startsWith('online:')) {
      const key = selectedKey.split(':')[1]
      const item = onlinePresets?.find(v => v.file === key)
      return item && { item, mode: 'online' }
    }
  }, [selectedKey])

  return localPresets == null && onlinePresets == null ?
    <div className="w-full h-48 flex-center bg-[--ant-color-bg-container] rounded">
      <Spin indicator={<LoadingOutlined spin />} />
    </div> :
    <div className="w-full h-48 flex-center bg-[--ant-color-bg-container] rounded">
      <div className="w-full h-full p-2 flex animate-fadeIn">
        <div className="w-24 shrink-0 flex flex-col overflow-auto no-scrollbar">
          {localPresets && localPresets.length !== 0 && <div className="mb-1 last:mb-0">
            <div className="mb-1 font-bold">{t('g.local')}</div>
            {localPresets?.map(v => <PresetItemView
              key={v.file}
              title={asLang(v.name)}
              className={`local:${v.file}` === selectedKey ? 'bg-[--ant-color-primary-bg]' : undefined}
              onSelect={() => setSelectedKey(`local:${v.file}`)}
            />)}
          </div>}
          {onlinePresets && onlinePresets.length !== 0 && <div className="mb-1 last:mb-0">
            <div className="mb-1 font-bold">{t('g.online')}</div>
            {localPresets?.map(v => <PresetItemView
              key={v.file}
              title={asLang(v.name)}
              className={`online:${v.file}` === selectedKey ? 'bg-[--ant-color-primary-bg]' : undefined}
              onSelect={() => setSelectedKey(`online:${v.file}`)}
            />)}
          </div>}
        </div>
        <Divider className="h-full mx-2" type='vertical' />
        <div className="grow rounded">
          {infoProps == null ?
            <div className="h-full flex-center">{t('tip.label.select-content')}</div> :
            <PresetInfoView {...infoProps} onApply={onApply} />}
        </div>
      </div>
    </div>
}

/**
 * 预设项
 */
const PresetItemView = ({ title, onSelect, className }: {
  title?: string
  onSelect?: () => void
  className?: string
}) => {
  return <div
    className={"p-1 truncate rounded hover:bg-[--ant-color-primary-bg-hover] cursor-pointer duration-300 " + (className ?? '')}
    onClick={onSelect}
  >
    <span>{title ?? 'null'}</span>
  </div>
}

/**
 * 预设信息
 */
const PresetInfoView = ({ mode, item, onApply }: {
  mode: 'local' | 'online' | (string & {})
  item: PresetItem
  onApply?: (preset: DeepPartial<LocalStorage>) => void
}) => {
  const { t, asLang } = useI18n()

  const [isLoading, setIsLoading] = useState(false)
  const [preset, setPreset] = useState<DeepPartial<LocalStorage>>()

  const manifest = useMemo(() => chrome.runtime.getManifest(), [])

  useEffect(() => {
    if (!item?.file) return;
    const url = mode === 'local' ?
      chrome.runtime.getURL(`presets/${item.file}`) :
      mode === 'online' ?
        GithubApi.asRawUrl(`example/presets/${item.file}`) :
        null;

    if (!url) {
      setPreset(undefined)
      return;
    };

    setIsLoading(true)
    setPreset(undefined)
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json()
      })
      .then(setPreset)
      .catch(() => setPreset(undefined))
      .finally(() => setIsLoading(false))
  }, [mode, item])

  return isLoading ?
    <div className="h-full flex-center"><Spin indicator={<LoadingOutlined spin />} /></div> :
    preset == null ?
      <div className="h-full flex-center">{'tip.label.unsupport-content'}</div> :
      <div className="h-full flex flex-col gap-2 overflow-y-auto">
        <div>
          <Tag>{t('g.' + mode)}</Tag>
          {preset.version && <Tag>v{preset.version}</Tag>}
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

export default PresetPanel