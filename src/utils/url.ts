import { existParentDomain } from "./base";

/**
 * 域名匹配范围去重
 */
export function domainDedup(list: string[]): string[] {
  if (list.length === 0) {
    return [];
  }
  const sorted = [...list].sort((a, b) => a.length - b.length);
  const result: string[] = [];
  for (const v of sorted) {
    if (!existParentDomain(result, v)) {
      result.push(v);
    }
  }
  return result;
}

/**
 * 域名合并去重
 */
export function domainMergeDedup(...list: (string[] | undefined | null)[]): string[] {
  return domainDedup(list.filter(v => !!v).flat());
}