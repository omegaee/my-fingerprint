export type IPData = {
  query: string
  countryCode: string
  timezone: string
}

export const IpApi = {
  getIp(): Promise<IPData> {
    return fetch('http://ip-api.com/json/', { cache: 'no-store' }).then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    })
  }
}