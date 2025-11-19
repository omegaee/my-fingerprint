export const getBrowser = (ua: string): BrowserType | undefined => {
  if (ua.includes("Chrome")){
    return 'chrome'
  } else if (ua.includes("Firefox")){
    return 'firefox'
  }
}