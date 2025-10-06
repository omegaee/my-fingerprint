export type TimeZoneInfoOption = TimeZoneInfo & {
  key: string
  title: I18nString
}

export const LocalApi = {
  timezone: async () => {
    const url = chrome.runtime.getURL('settings/timezone.json')
    return await fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(v => v.timezone as TimeZoneInfoOption[])
  }
}