import { useCallback, useState } from "react"
import type { DependencyList, Dispatch, SetStateAction } from "react"
import { debounce } from "./timer"

export const useDebounceState = <S>(initialState: S | (() => S), wait?: number): [S, (value: S) => void, Dispatch<SetStateAction<S>>] => {
  const [state, setState] = useState(initialState)
  return [state, useDebounceCallback(setState, wait), setState]
}

export const useDebounceCallback = function<T extends (...args: any) => any>(callback: T, wait?: number, deps?: DependencyList) {
  return useCallback(debounce(callback, wait), deps ?? [])
}