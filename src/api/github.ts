
const repo = 'my-fingerprint'
const owner = 'omegaee'
const branch = 'main'

export type GithubContentItem = {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url?: string
  type: 'file' | 'dir'
}

export const GithubApi = {
  asRawUrl(path: string) {
    if (path.startsWith('/')) path = path.slice(1);
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
  },

  getContentList(path: string): Promise<GithubContentItem[]> {
    if (path.startsWith('/')) path = path.slice(1);
    return fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`).then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json()
    })
  },

  getJson<T = any>(path: string): Promise<T> {
    if (path.startsWith('/')) path = path.slice(1);
    return fetch(GithubApi.asRawUrl(path)).then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    })
  }
}