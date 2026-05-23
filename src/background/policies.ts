import { existParentDomain } from "@/utils/base";

/**
 * SiteListHelper
 * 同步更新 Context 内容
 */
export class SiteListHelper {
  private storage: LocalStorage
  private mode: 'whitelist' | 'blacklist'

  private siteList: string[]

  constructor(storage: LocalStorage, mode: 'whitelist' | 'blacklist') {
    this.storage = storage;
    this.mode = mode;

    this.siteList = storage.policies[mode];
    if (!this.siteList) {
      this.siteList = [];
      storage.policies[mode] = this.siteList;
    }
  }

  public get() {
    return this.siteList;
  }

  public len() {
    return this.siteList.length;
  }

  public match(v: string) {
    return existParentDomain(this.siteList, v)
  }

  public add(v: string) {
    this.siteList.push(v);
  }

  public addList(list: string[]) {
    this.siteList.push(...list.filter(v => !this.match(v)));
  }

  public remove(v: string) {
    const index = this.siteList.indexOf(v)
    if (index !== -1) {
      this.siteList.splice(index, 1)
    }
  }

  public set(v: string[]) {
    this.siteList = v;
    this.storage.policies[this.mode] = this.siteList;
  }

  public clean() {
    this.siteList = [];
  }
}