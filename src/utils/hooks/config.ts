import { HookType } from "@/types/enum"
import { useState } from "react"

export const useHookMode = <V, I>(mode?: HookMode<V>, parser?: {
  toInput?: (value?: V) => I  // 初次时序列化
  toValue?: (input: I) => V  // 存储时反序列化
}) => {
  const modeValue = (mode as any).value
  const { toInput, toValue } = parser ?? {}

  const [type, setType] = useState<HookType>(mode?.type ?? HookType.default)
  const [input, setInput] = useState<I>(toInput ? toInput(modeValue) : modeValue)

  return {
    type,
    input,
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
    isDefault: type === HookType.default,
    isValue: type === HookType.value,
  }
}