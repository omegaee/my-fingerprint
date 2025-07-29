/**
 * 所有参数是否是默认模式
 * @example !isDefault([...]) // 至少一个元素是非默认值
 */
export const isDefaultMode = (mode?: HookMode | HookMode[]) => {
  if (!mode) return true
  if (Array.isArray(mode)) {
    return mode.every(m => m.type === HookType.default)
  } else {
    return mode.type === HookType.default
  }
}