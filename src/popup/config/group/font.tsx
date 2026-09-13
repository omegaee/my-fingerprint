import { LocalApi } from "@/api/local";
import { useAsyncValue } from "@/utils/hooks";
import { debounce } from "@/utils/timer";
import { AutoComplete, AutoCompleteProps, Button, Space, Switch, Tag } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  PlusOutlined,
} from '@ant-design/icons';
import { useShallow } from "zustand/shallow";
import { useStorageStore } from "@/popup/stores/storage";

const defaultFonts = ["Arial", "Helvetica", "Times New Roman", "monospace", "sans-serif", "serif", "Courier New", "Microsoft YaHei", "Consolas"]

export function filterSupportedFonts(fonts: string[]) {
  const canvas = new OffscreenCanvas(100, 100);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get OffscreenCanvas 2d context");
  }

  const fontSize = "16px";
  const measuredText = "mmMwWLliI0O&1";

  ctx.font = `${fontSize} Arial`;
  /** Arial 字体宽度，它将作为对比的基准 */
  const baseFontWidth = ctx.measureText(measuredText).width;

  const filtered = fonts.filter((f) => {
    ctx.font = `${fontSize} "${f}", Arial`;
    return ctx.measureText(measuredText).width !== baseFontWidth;
  });

  filtered.unshift("Arial")
  return filtered;
}

export const FontConfigGroup = ({ }: {}) => {
  const { config, saveConfig } = useStorageStore(useShallow((s) => ({
    version: s.version,
    config: s.config,
    saveConfig: s.saveConfig,
  })))

  const action = config?.action.fonts

  useEffect(() => {
    if (!action) return
    if (action.allowlist.length === 0) {
      action.allowlist = filterSupportedFonts(defaultFonts)
      saveConfig()
    }
  }, [action?.allowlist])

  const changeEnable = async (checked: boolean) => {
    if (!action) return;
    action.enable = checked;
    saveConfig()
  }

  const onAdd = (v: string) => {
    if (!action) return;
    if (!action.allowlist.includes(v)) {
      action.allowlist.push(v)
      saveConfig()
    }
  }

  const onRemove = (v: string) => {
    if (!action) return;
    action.allowlist = action.allowlist.filter((i) => i !== v)
    saveConfig()
  }

  return <div className="flex flex-col gap-2">
    <div className="p-1 flex items-center justify-between">
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

    <ListView items={action?.allowlist} onRemove={onRemove} />
    <InputView onAdd={onAdd} />
  </div>
}

const ListView = ({ items = [], onRemove }: {
  items?: string[]
  onRemove?: (value: string) => void
}) => {
  return <div className="h-36 overflow-auto">
    <div className="h-full flex flex-wrap gap-1 content-start text-xs">
      {/* <Tag className="mx-0 px-2 py-0.5 cursor-pointer rounded-xl bg-warning-50 hover:bg-warning-100">恢复默认</Tag> */}
      {items.map((v) => (
        <Tag key={v} className="mx-0 px-2 py-0.5 rounded-xl" closeIcon onClose={() => onRemove?.(v)}>{v}</Tag>
      ))}
    </div>
  </div>
}

const InputView = ({ onAdd }: {
  onAdd?: (value: string) => void
}) => {
  const [value, setValue] = useState('');
  const [options, setOptions] = useState<AutoCompleteProps['options']>([]);

  const { value: fonts } = useAsyncValue(() => {
    return LocalApi.fonts()
  }, [])

  useEffect(() => {
    if (!fonts) return
    setOptions(fonts.map((value) => ({ value })))
  }, [fonts])

  const onValidAdd = () => {
    const v = value.trim()
    if (!v) return
    onAdd?.(v)
    setValue('')
    if (fonts) {
      setOptions(fonts.map((value) => ({ value })))
    }
  }

  const doFilter = useCallback(debounce((input) => {
    if (!fonts) return
    const lv = input.toLowerCase()
    setOptions(fonts.filter((v) => v.toLowerCase().includes(lv)).map((value) => ({ value })))
  }, 200), [fonts])

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