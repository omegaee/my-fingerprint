import { HookType } from "@/types/enum"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export type HookModeHandler<V, I> = {
  type: HookType
  input: I
  value: V  // 不支持直接修改
  isDefault: boolean
  isValue: boolean
  setType: (type: HookType) => void
  setInput: (input: I) => void
  setValue: (value: V) => void
  updateValue: (onBefore?: () => void) => void
}

export const useHookMode = <V, I>(mode?: HookMode<V>, parser?: {
  toInput?: (value?: V) => I  // value to input 序列化
  toValue?: (input: I) => V  // input to value 序列化
}): HookModeHandler<V, I> => {
  const modeValue = (mode as any).value
  const { toInput, toValue } = parser ?? {}

  const [type, setType] = useState<HookType>(mode?.type ?? HookType.default)
  const [input, setInput] = useState<I>(toInput ? toInput(modeValue) : modeValue)
  const [version, setVersion] = useState(0)

  return {
    type,
    input,
    value: modeValue,
    isDefault: type === HookType.default,
    isValue: type === HookType.value,
    setType: (type: HookType) => {
      if (mode) mode.type = type;
      setType(type)
    },
    setInput: (input: I) => {
      setInput(input)
      if (mode) {
        (mode as any).value = toValue ? toValue(input) : input;
      }
    },
    setValue: (value: V) => {
      if (mode) {
        (mode as any).value = value;
      }
      setInput(toInput ? toInput(value) : value as any)
    },
    updateValue: (onBefore) => {
      onBefore?.()
      if (mode) {
        (mode as any).value = toValue ? toValue(input) : input;
      }
      setVersion(v => v + 1)
    },
  }
}

export const useI18n = () => {
  const [t, i18n] = useTranslation()
  const default_locale = useMemo(() => chrome.runtime.getManifest().default_locale, [])
  const asLang = (ps?: I18nString): string | undefined => {
    if (!ps) return undefined;
    if (typeof ps === 'string') return ps;
    const langs = [
      i18n.language,
      i18n.language.split('-')[0],
      default_locale,
      'en',
    ];
    for (const lang of langs) {
      if (!lang) continue;
      const value = ps[lang];
      if (value) return value;
    }
    return Object.values(ps)[0] ?? undefined;
  };
  return {
    t, i18n, asLang, default_locale,
  }
}