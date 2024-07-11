export type HighlightProps = {
  text: string
  keyword?: string | string[]
  ignoreCase?: boolean
}

/**
 * 文本高亮
 */
export const Highlight = function ({ text, keyword, ignoreCase }: HighlightProps) {
  if(keyword === undefined || keyword === null) return text
  if(Array.isArray(keyword)){
    if(keyword.length === 0) return text
    return text.split(new RegExp(keyword.map((item) => `${item}`).join('|'), ignoreCase ? "gi" : "g"))
      .map((str, index) => keyword.includes(str) ? <mark key={index}>{str}</mark> : str )
  }else{
    if(keyword === "") return text
    return text.split(new RegExp(`(${keyword})`, ignoreCase ? "gi" : "g"))
      .map((str, index) => str === keyword ? <mark key={index}>{str}</mark> : str )
  }
}

export default Highlight