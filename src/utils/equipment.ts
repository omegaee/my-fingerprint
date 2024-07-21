import { getMainVersion, versionRandomOffset } from "./base"

export class UAItem {
  public name: string
  public version: string

  public constructor(name: string, version: string){
    this.name = name
    this.version = version
  }

  public static parse (item: string) {
    const parts = item.split('/')
    return new UAItem(parts[0], parts[1])
  }

  public toString(): string {
    return this.version ? `${this.name}/${this.version}` : this.name
  }

  public setName(name: string){
    this.name = name
  }

  public setVersion(version: string){
    this.version = version
  }
}

export class UAParser {
  private static uaRule = /^(?<product>.+?) \((?<systemInfo>.+?)\)( (?<engine>.+?))?( \((?<engineDetails>.+?)\))?( (?<extensions>.+?))?$/
  private static firefoxUaRule = /^(?<product>.+?) \((?<systemInfo>.+?)\)( (?<engine>.+?))?( (?<extensions>.+?))?/
  private type: 'base' | 'firefox'

  public product: UAItem
  public systemInfo: string[]
  public engine?: UAItem[]
  public engineDetails?: string[]
  public extensions?: UAItem[]

  public constructor(ua: string) {
    let groups
    if(ua.includes('Firefox')){
      this.type = 'firefox'
      groups = ua.match(UAParser.firefoxUaRule)?.groups
    }else{
      this.type = 'base'
      groups = ua.match(UAParser.uaRule)?.groups
    }
    
    if(!groups){
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
    if(ignoreProductName){
      product = this.product.version
    }else{
      product = this.product.toString()
    }
    const systemInfo = this.systemInfo.join('; ')
    const engine = this.engine?.map((item) => item.toString()).join(' ')
    const extensions = this.extensions?.map((item) => item.toString()).join(' ')

    if(this.type === 'firefox'){
      return `${product} (${systemInfo}) ${engine} ${extensions}`
    }else{
      const engineDetails = this.engineDetails?.join(', ')
      return `${product} (${systemInfo}) ${engine} (${engineDetails}) ${extensions}`
    }
  }

}

type MyNavigatorUAData = {
  brands: {brand: string, version: string}[]
  platform: string
  mobile: boolean
}

export class EquipmentInfoHandler {
  private rawUserAgentData?: any

  public userAgent?: string
  public appVersion?: string

  public userAgentData?: any
  public brands?: MyNavigatorUAData['brands'] = []

  public constructor(nav: Navigator, seed: number){
    let uaParser: UAParser
    try{
      uaParser =  new UAParser(nav.userAgent)
    }catch(err){
      return
    }

    if(uaParser.engine){
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
    if(nav.appVersion){
      this.appVersion = uaParser.toString(true)
    }
    
    /// userAgentData
    // @ts-ignore
    if(nav.userAgentData){
      if(!uaParser.extensions)return
      // @ts-ignore
      this.rawUserAgentData = nav.userAgentData
      const brands: MyNavigatorUAData['brands'] = this.rawUserAgentData.brands
      // Chrome / Edg
      const extensionMap = new Map<string, string>(uaParser.extensions.map((item) => [item.name, item.version]))
      for(const brand of brands){
        switch(brand.brand){
          case 'Chromium':{
            const version = extensionMap.get('Chrome')
            if(version){
              this.brands?.push({...brand, version: getMainVersion(version)})
            }else{
              this.brands?.push(brand)
            }
            break
          }
          case 'Microsoft Edge':{
            const version = extensionMap.get('Edg')
            if(version){
              this.brands?.push({...brand, version: getMainVersion(version)})
            }else{
              this.brands?.push(brand)
            }
            break
          }
          default: {
            this.brands?.push(brand)
            break
          }
        }
      }

      this.userAgentData = new Proxy(this.rawUserAgentData, {
        get: (target, key: string) => {
          let res = null
          switch(key){
            case 'brands':{
              res = this.brands
              break
            }
          }
          if(res === null){
            res = target[key]
            if (typeof res === "function") return res.bind(target)
          }
          return res
        }
      })

      // @ts-ignore
      if(NavigatorUAData?.prototype?.toJSON){
        // @ts-ignore
        NavigatorUAData.prototype.toJSON = new Proxy(NavigatorUAData.prototype.toJSON, {
          apply: (target, thisArg, args) => {
            const res = target.apply(thisArg, args)
            return {...res, brands: this.brands}
          }
        })
      }

    }
    
  }

  public getValue(key: string){
    switch(key){
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
}
