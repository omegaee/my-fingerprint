
const repo = 'my-fingerprint'
const owner = 'omegaee'

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
  getContentList(path: string): Promise<GithubContentItem[]> {
    if (path.startsWith('/')) path = path.slice(1);
    return fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`).then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json()
    })
  },
}