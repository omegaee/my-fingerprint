import { debounce } from "@/utils/timer";
import { AutoComplete, AutoCompleteProps, Button, Divider, Space, Switch, Tag } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  CheckOutlined,
  PlusOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { FontGroupProvider, useFontGroup } from "./context";

export const FontConfigGroup = () => {
  return <FontGroupProvider>
    <div className="flex flex-col gap-4">
      <FontSwitch />
      <FontInfo />
      <Divider className="my-0" />
      <FontList />
      <FontInput />
    </div>
  </FontGroupProvider>
}

const FontSwitch = () => {
  const { action, changeEnable } = useFontGroup()

  return <div className="flex items-center justify-between">
    <div>
      <span className="font-bold">{'仅允许字体'}</span>
      <p className="text-default-500">{'开启后，页面仅能检测到以下字体'}</p>
    </div>
    <Switch
      className="[&_.ant-switch-inner>span]:font-bold"
      checked={action?.enable}
      onChange={changeEnable}
    />
  </div>
}

const FontInfo = () => {
  const { action, supportedFonts, isSupportedFontsPending, syncFonts } = useFontGroup()

  const [isSyncFinished, setIsSyncFinished] = useState(false)

  const doSyncFonts = async () => {
    await syncFonts()
    setIsSyncFinished(true)
    setTimeout(() => setIsSyncFinished(false), 2000)
  }

  return isSupportedFontsPending ? (
    <div>正在加载...</div>
  ) : (
    <div className="flex items-center justify-between gap-2">
      <div>
        <span>{'支持字体'}</span>
        <span><Tag className="mx-0 ml-1">{supportedFonts?.length ?? '--'}</Tag></span>
      </div>

      <div>
        <span>{'允许 / 禁用'}</span>
        <span><Tag className="mx-0 ml-1">{action?.allowlist.length ?? '--'} / {action?.blocklist.length ?? '--'}</Tag></span>
      </div>

      <div>
        {isSyncFinished ? (
          <Tag className="mx-0 cursor-pointer" color='success'>
            <CheckOutlined /> 已同步
          </Tag>
        ) : (
          <Tag className="mx-0 cursor-pointer" color='orange' onClick={doSyncFonts}>
            <SyncOutlined /> 同步
          </Tag>
        )}
      </div>
    </div>
  )
}

const FontList = () => {
  const { action, blockFont } = useFontGroup()

  return <div className="h-36 overflow-auto">
    <div className="h-full flex flex-wrap gap-1 content-start text-xs">
      {/* <Tag className="mx-0 px-2 py-0.5 cursor-pointer rounded-xl bg-warning-50 hover:bg-warning-100">恢复默认</Tag> */}
      {action?.allowlist.map((v) => (
        <Tag key={v} className="mx-0 px-2 py-0.5 rounded-xl" closeIcon onClose={() => blockFont(v)}>{v}</Tag>
      ))}
    </div>
  </div>
}

const FontInput = () => {
  const { supportedFonts, allowFont } = useFontGroup()

  const [value, setValue] = useState('');
  const [options, setOptions] = useState<AutoCompleteProps['options']>([]);

  useEffect(() => {
    if (!supportedFonts) return
    setOptions(supportedFonts.map((value) => ({ value })))
  }, [supportedFonts])

  const onValidAdd = () => {
    const v = value.trim()
    if (!v) return
    allowFont(v)
    setValue('')
    if (supportedFonts) {
      setOptions(supportedFonts.map((value) => ({ value })))
    }
  }

  const doFilter = useCallback(debounce((input) => {
    if (!supportedFonts) return
    const lv = input.toLowerCase()
    setOptions(supportedFonts.filter((v) => v.toLowerCase().includes(lv)).map((value) => ({ value })))
  }, 300), [supportedFonts])

  return <div className="w-full">
    <Space.Compact className="w-full">
      <AutoComplete
        placeholder="Search allow font..."
        value={value}
        onChange={(v) => {
          setValue(v)
          doFilter(v)
        }}
        className="w-full"
        options={options}
        onKeyDown={({ key }) => key === 'Enter' && onValidAdd()}
      />
      <Button
        icon={<PlusOutlined />}
        onClick={onValidAdd}
      />
    </Space.Compact>
  </div>
}