/**
 * @example
 * debounce(()=>{})
 * debounce(()=>{}, 500)
 */
export const debounce = function <T extends (...args: any) => any>(func: T, wait?: number): (...args: Parameters<T>) => void {
  wait = wait || 300;
  let timeout: NodeJS.Timeout;
  return function (...args: any[]) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * @example
 * debounce((key)=>{})
 * debounce((key)=>{}, 500)
 */
export const debounceByFirstArg = function <T extends (key: any, ...args: any[]) => any>(func: T, wait?: number): (...args: Parameters<T>) => void {
  wait = wait || 300;
  const timers = new Map<any, NodeJS.Timeout>();
  return function (key: any, ...args: any[]) {
    if (timers.has(key)) clearTimeout(timers.get(key)!);
    timers.set(key, setTimeout(() => {
      func(key, ...args);
      timers.delete(key);
    }, wait))
  }
}

/**
 * 合并async函数，防止多次调用
 * @example
 * debouncedAsync(async()=>{})
 * debouncedAsync(()=>new Promise(...))
 */
export const debouncedAsync = function <T extends (...args: any[]) => Promise<any>>(func: T): (...args: Parameters<T>) => ReturnType<T> {
  let promise: ReturnType<T> | undefined
  return function (...args: Parameters<T>): ReturnType<T> {
    if (promise) {
      return promise
    }
    promise = func(...args).finally(() => promise = undefined) as ReturnType<T>
    return promise
  }
}