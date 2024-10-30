import { subversionRandom } from "./base"

const uaRule = /^(?<product>.+?) \((?<systemInfo>.+?)\)( (?<engine>.+?))?( \((?<engineDetails>.+?)\))?( (?<extensions>.+?))?$/
const firefoxUaRule = /^(?<product>.+?) \((?<systemInfo>.+?)\)( (?<engine>.+?))?( (?<extensions>.+?))?/

export class UAItem {
  public name: string
  public version?: string

  public constructor(name: string, version: string) {
    this.name = name
    this.version = version
  }

  public static parse(item: string) {
    const parts = item.split('/')
    return new UAItem(parts[0], parts[1])
  }

  public toString(): string {
    return this.version ? `${this.name}/${this.version}` : this.name
  }

  public setName(name: string) {
    this.name = name
  }

  public setVersion(version: string) {
    this.version = version
  }
}

export class UAParser {
  private type: 'base' | 'firefox'

  public product: UAItem
  public systemInfo: string[]
  public engine?: UAItem[]
  public engineDetails?: string[]
  public extensions?: UAItem[]

  public constructor(ua: string) {
    let groups
    if (ua.includes('Firefox')) {
      this.type = 'firefox'
      groups = ua.match(firefoxUaRule)?.groups
    } else {
      this.type = 'base'
      groups = ua.match(uaRule)?.groups
    }

    if (!groups) {
      throw new Error('unable to parse')
    }

    this.product = UAItem.parse(groups.product)
    this.systemInfo = groups.systemInfo.split(';').map((item) => item.trim())
    this.engine = groups.engine?.split(' ').map((item) => UAItem.parse(item))
    this.engineDetails = groups.engineDetails?.split(',').map((item) => item.trim())
    this.extensions = groups.extensions?.split(' ').map((item) => UAItem.parse(item))
  }

  public toString(ignoreProductName?: boolean): string {
    let product: string | undefined
    if (ignoreProductName) {
      product = this.product.version
    } else {
      product = this.product.toString()
    }
    const systemInfo = this.systemInfo.join('; ')
    const engine = this.engine?.map((item) => item.toString()).join(' ')
    const extensions = this.extensions?.map((item) => item.toString()).join(' ')

    if (this.type === 'firefox') {
      return `${product} (${systemInfo}) ${engine} ${extensions}`
    } else {
      const engineDetails = this.engineDetails?.join(', ')
      return `${product} (${systemInfo}) ${engine} (${engineDetails}) ${extensions}`
    }
  }

}

export const brandRandom = (seed: number, brand: Brand): Brand => ({
  ...brand,
  version: brand.version && subversionRandom(seed, brand.version).full,
})

type NavigatorPlus = Navigator & {
  userAgentData?: NavigatorUAData
}

type UserAgentDataVersion = {
  brands?: Brand[]
  fullVersionList?: Brand[]
  uaFullVersion?: string
}

/**
 * 生成 UserAgentData 的随机版本内容
 */
export const genRandomVersionUserAgentData = async (seed: number, nav: NavigatorPlus): Promise<UserAgentDataVersion> => {
  if (!nav.userAgentData || !nav.userAgentData.brands) return {};

  const option: UserAgentDataVersion = {
    brands: nav.userAgentData.brands.map((brand) => brandRandom(seed, brand))
  }

  if (nav.userAgentData.getHighEntropyValues) {
    const { fullVersionList, uaFullVersion }: HighEntropyValuesAttr = await nav.userAgentData.getHighEntropyValues(['fullVersionList', 'uaFullVersion'])
    option.fullVersionList = fullVersionList?.map((brand) => brandRandom(seed, brand))
    option.uaFullVersion = uaFullVersion && subversionRandom(seed, uaFullVersion).full
  }

  return option
}

const uaCache = new Map<string, Record<'ua' | 'app', string>>()

/**
 * 生成随机版本的 UserAgent
 */
export const genRandomVersionUserAgent = (seed: number, nav: Navigator, ignoreProductName?: boolean) => {
  const uaIden = ignoreProductName ? 'app' : 'ua'

  let item = uaCache.get(nav.userAgent)
  if (item) return item[uaIden];

  try {
    const uaParser = new UAParser(nav.userAgent)
    // AppleWebKit ...
    if (uaParser.engine?.length) {
      uaParser.engine.forEach((item) => item.version && item.setVersion(subversionRandom(seed, item.version).full))
    }
    // Chrome Edg ...
    if (uaParser.extensions?.length) {
      uaParser.extensions.forEach((item) => item.version && item.setVersion(subversionRandom(seed, item.version).full))
    }
    item = {
      ua: uaParser.toString(),
      app: uaParser.toString(ignoreProductName),
    }
    uaCache.set(nav.userAgent, item)
  } catch (_) {
    return ignoreProductName ? nav.appVersion : nav.userAgent
  }

  return item[uaIden]
}