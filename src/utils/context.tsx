import { createContext, useContext, ReactNode } from "react"

/**
 * Creates a context with a provider and a hook to access the context value.
 * @example
 * const { DataProvider, useData } = createDataContext(defaultValue)
 */
export function createDataContext<T>(defaultValue: T) {
  const Context = createContext<T>(defaultValue)

  function Provider({ value, children }: { value: T; children: ReactNode }) {
    return <Context.Provider value={value}>{children}</Context.Provider>
  }

  function useCtx() {
    const ctx = useContext(Context)
    if (ctx === null) throw new Error("useCtx must be used within a DataProvider");
    return ctx
  }

  return { Provider, useCtx }
}

export function createHookContext<P extends object, R>(fn: (props: P) => R) {
  const Context = createContext<R | null>(null)

  function Provider({ children, ...props }: P & { children: ReactNode }) {
    return <Context.Provider value={fn(props as P)}>{children}</Context.Provider>
  }

  function useCtx() {
    const ctx = useContext(Context)
    if (ctx === null) throw new Error("useCtx must be used within a HookProvider");
    return ctx
  }

  return { Provider, useCtx }
}