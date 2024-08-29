/**
 * @example
 * debounce(()=>{})
 * debounce(()=>{}, 500)
 */
export const debounce = function<T extends (...args: any) => any>(func: T, wait?: number): (...args: Parameters<T>) => void {
  wait = wait || 300;
  var timeout: NodeJS.Timeout;
  return function(...args: any[]) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 合并async函数，防止多次调用
 * @example
 * debouncedAsync(async()=>{})
 * debouncedAsync(()=>new Promise(...))
 */
export const debouncedAsync = function<T extends (...args: any[]) => Promise<any>> (func: T): (...args: Parameters<T>) => ReturnType<T> {
  let promise: ReturnType<T> | undefined
  return function (...args: Parameters<T>): ReturnType<T>  {
    if (promise) {
      return promise
    }
    promise = func(...args).finally(() => promise = undefined) as ReturnType<T>
    return promise
  }
}