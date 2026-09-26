import { HookType } from '@/types/enum';
import { debounce } from "@/utils/timer";
import { AutoComplete, AutoCompleteProps, Button, Divider, Space, Spin, Tag } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LoadingOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { FontGroupProvider, useFontGroup } from "./context";
import { useTranslation } from "react-i18next";
import { HookModeProvider } from "../context";
import { HookModeSelector } from "../ui";
import { cn } from '@/utils/style';
import { selectStatusDotStyles as dotStyles } from "../styles"

const baseTypes = [HookType.default, HookType.page, HookType.browser, HookType.domain, HookType.global, HookType.value]

export const FontConfigGroup = () => {
  return <FontGroupProvider>
    <div className="py-2 flex flex-col gap-4">
      <FontSwitch />
      <FontInfo />
      <Divider className="my-0" />
      <FontList />
      <FontInput />
    </div>
  </FontGroupProvider>
}

const FontSwitch = () => {
  const { t } = useTranslation()
  const { config, isDefault, isCustom, isRandom } = useFontGroup()
  const fp = config?.fp

  return fp ? <div className="w-full flex flex-col justify-between gap-1">
    <HookModeProvider obj={fp.other} name='font'>
      <div className={cn('w-full', !isDefault && dotStyles.success)}>
        <HookModeSelector className='w-full' types={baseTypes} />
      </div>
    </HookModeProvider>
    <p className="text-default-500">
      {isCustom && t('label.font.custom-tip')}
      {isRandom && t('label.font.random-tip')}
    </p>
  </div> : <Spin indicator={<LoadingOutlined spin />} />
}

const FontInfo = () => {
  const { t } = useTranslation()
  const { action, supportedFonts, isSupportedFontsPending, isCustom } = useFontGroup()

  const allowSize = action?.allowlist.length ?? 0
  const blockSize = (supportedFonts?.length ?? 0) - allowSize

  return isSupportedFontsPending ? (
    <div>{t('label.font.loading')}</div>
  ) : (
    <div className="flex items-center justify-between gap-2">
      <div>
        <span>{t('label.font.supported')}</span>
        <span><Tag className="mx-0 ml-1">{supportedFonts?.length ?? '--'}</Tag></span>
      </div>

      {isCustom && <div>
        <span>{t('label.font.allow-block')}</span>
        <span><Tag className="mx-0 ml-1">{allowSize} / {blockSize}</Tag></span>
      </div>}
    </div>
  )
}

const FontList = () => {
  const { t } = useTranslation()
  const { action, blockFont, resetAllowlist } = useFontGroup()

  return <div className="h-36 overflow-auto">
    <div className="h-full flex flex-wrap gap-1 content-start text-xs">
      <Tag className="mx-0 px-2 py-0.5 cursor-pointer rounded-xl bg-warning-50 hover:bg-warning-100" onClick={resetAllowlist}>{t('g.reset')}</Tag>
      {action?.allowlist.map((v) => (
        <Tag key={v} className="mx-0 px-2 py-0.5 rounded-xl" closeIcon onClose={() => blockFont(v)}>{v}</Tag>
      ))}
    </div>
  </div>
}

const FontInput = () => {
  const { t } = useTranslation()
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
        placeholder={t('label.font.search')}
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