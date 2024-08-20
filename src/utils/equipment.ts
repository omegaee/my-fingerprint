import { getMainVersion, versionRandomOffset } from "./base"

const uaRule = /^(?<product>.+?) \((?<systemInfo>.+?)\)( (?<engine>.+?))?( \((?<engineDetails>.+?)\))?( (?<extensions>.+?))?$/
const firefoxUaRule = /^(?<product>.+?) \((?<systemInfo>.+?)\)( (?<engine>.+?))?( (?<extensions>.+?))?/

export class UAItem {
  public name: string
  public version: string

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
    let product: string
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

type MyNavigatorUAData = {
  brands: { brand: string, version: string }[]
  platform: string
  mobile: boolean
}

export class EquipmentInfoHandler {
  public nav: Navigator
  public seed?: number

  public userAgent?: string
  public appVersion?: string

  public userAgentData?: any
  public brands?: MyNavigatorUAData['brands']

  public fullVersionList?: MyNavigatorUAData['brands']
  public uaFullVersion?: string

  private rawUserAgentData?: any
  private rawToJSON?: any
  private rawGetHighEntropyValues?: any

  public constructor(nav: Navigator, seed?: number, isHook?: boolean) {
    this.nav = nav
    if (seed !== undefined) {
      this.setSeed(seed, isHook)
    }
  }

  public setSeed(seed: number, isHook?: boolean) {
    if (this.seed === seed) return
    this.seed = seed

    let uaParser: UAParser
    try {
      uaParser = new UAParser(this.nav.userAgent)
    } catch (err) {
      return
    }

    if (uaParser.engine) {
      uaParser.engine.forEach((item) => {
        item.setVersion(versionRandomOffset(item.version, seed))
      })
      uaParser.extensions?.forEach((item) => {
        item.version && item.setVersion(versionRandomOffset(item.version, seed))
      })
    }

    /// userAgent
    this.userAgent = uaParser.toString()

    /// appVersion
    if (this.nav.appVersion) {
      this.appVersion = uaParser.toString(true)
    }

    /// userAgentData
    // @ts-ignore
    if (this.nav.userAgentData) {
      if (!uaParser.extensions) return
      // @ts-ignore
      this.rawUserAgentData = this.nav.userAgentData
      const brands: MyNavigatorUAData['brands'] = this.rawUserAgentData.brands
      this.brands = brands.map((brand) => ({ ...brand, version: getMainVersion(versionRandomOffset(brand.version, seed)) }))

      // @ts-ignore
      this.rawGetHighEntropyValues = NavigatorUAData.prototype.getHighEntropyValues

      /// 若无需hook，则结束
      if (!isHook) return

      this.userAgentData = new Proxy(this.rawUserAgentData, {
        get: (target, key: string) => {
          let res = null
          switch (key) {
            case 'brands': {
              res = this.brands
              break
            }
          }
          if (res === null) {
            res = target[key]
            if (typeof res === "function") return res.bind(target)
          }
          return res
        }
      })

      // @ts-ignore
      if (NavigatorUAData?.prototype?.toJSON) {
        // @ts-ignore
        this.rawToJSON = NavigatorUAData.prototype.toJSON
        // @ts-ignore
        NavigatorUAData.prototype.toJSON = new Proxy(NavigatorUAData.prototype.toJSON, {
          apply: (target, thisArg, args) => {
            const res = target.apply(thisArg, args)
            return { ...res, brands: this.brands }
          }
        })
      }

      // @ts-ignore
      if (NavigatorUAData?.prototype?.getHighEntropyValues) {
        // @ts-ignore
        NavigatorUAData.prototype.getHighEntropyValues = new Proxy(NavigatorUAData.prototype.getHighEntropyValues, {
          apply: (target: (opt?: string[]) => Promise<any>, thisArg, args: Parameters<(opt?: string[]) => Promise<any>>) => {
            const res = target.apply(thisArg, args)
            return res.then((data) => {
              if (data.brands?.length) {
                for (const brand of data.brands as MyNavigatorUAData['brands']) {
                  brand.version = versionRandomOffset(brand.version, seed)
                }
              }
              if (data.fullVersionList?.length) {
                for (const brand of data.fullVersionList as MyNavigatorUAData['brands']) {
                  brand.version = versionRandomOffset(brand.version, seed)
                }
              }
              if (data.uaFullVersion !== undefined) {
                data.uaFullVersion = versionRandomOffset(data.uaFullVersion, seed)
              }
              return data
            })
          }
        })
      }
    }

  }

  public getValue(key: string) {
    switch (key) {
      case 'userAgent':
        return this.userAgent ?? null
      case 'appVersion':
        return this.appVersion ?? null
      case 'userAgentData':
        return this.userAgentData ?? null
      default:
        return null
    }
  }

  public async getHighEntropyValues() {
    // @ts-ignore    
    if (this.seed !== undefined && this.rawGetHighEntropyValues && this.nav.userAgentData) {
      // @ts-ignore
      const data = await this.rawGetHighEntropyValues.apply(this.nav.userAgentData, [['fullVersionList', 'uaFullVersion']])

      if (data.fullVersionList) {
        const fullVersionList: MyNavigatorUAData['brands'] = data.fullVersionList
        for (const brand of fullVersionList) {
          brand.version = versionRandomOffset(brand.version, this.seed)
        }
        this.fullVersionList = fullVersionList
      }

      if (data.uaFullVersion) {
        this.uaFullVersion = versionRandomOffset(data.uaFullVersion, this.seed)
      }
    }

    return {
      fullVersionList: this.fullVersionList,
      uaFullVersion: this.uaFullVersion
    }
  }
}
