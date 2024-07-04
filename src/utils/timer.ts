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