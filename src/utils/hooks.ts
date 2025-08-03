import { useCallback, useEffect, useState } from "react"
import type { DependencyList, Dispatch, SetStateAction } from "react"
import { debounce } from "./timer"
import { HookType } from "@/types/enum"

export const useDebounceState = <S>(initialState: S | (() => S), wait?: number): [S, Dispatch<SetStateAction<S>>, (value: S) => void] => {
  const [state, setState] = useState(initialState)
  return [state, setState, useDebounceCallback(setState, wait)]
}

export const useDebounceCallback = function <T extends (...args: any) => any>(callback: T, wait?: number, deps?: DependencyList) {
  return useCallback(debounce(callback, wait), deps ?? [])
}

export const useHookMode = <T = any>(mode?: HookMode<T>, parser?: {
  ser?: (value?: T) => string  // 序列化
  deser?: (str: string) => T  // 反序列化
  defaultValue?: T
}) => {
  const modeValue = (mode as any).value
  const { ser, deser, defaultValue } = parser ?? {}

  const [type, setType] = useState<HookType>(mode?.type ?? HookType.default)
  const [stringValue, setStringValue] = useState<string>(ser ? ser(modeValue) : modeValue)

  // useEffect(() => {
  //   if (!mode) return;
  //   setStringValue(ser ? ser(modeValue) : modeValue)
  // }, [ser ? ser(modeValue) : modeValue])

  return {
    type,
    stringValue,
    setType: (type: HookType) => {
      if (mode) mode.type = type;
      setType(type)
    },
    setStringValue: (value: string) => {
      if (value.trim() === '') {
        (mode as any).value = defaultValue
      } else {
        if (mode) {
          (mode as any).value = deser ? deser(value) : value;
        }
      }

      setStringValue(value)
    }
  }
}