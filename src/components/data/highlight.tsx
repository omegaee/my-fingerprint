export type HighlightProps = {
  text: string
  keyword?: string | string[]
  ignoreCase?: boolean
  className?: string
}

/**
 * 文本高亮
 */
export const Highlight = function ({ className, text, keyword, ignoreCase }: HighlightProps) {
  if(keyword === undefined || keyword === null) return text
  if(Array.isArray(keyword)){
    if(keyword.length === 0) return <span className={className}>{text}</span>
    return <span className={className}>{text.split(new RegExp(keyword.map((item) => `${item}`).join('|'), ignoreCase ? "gi" : "g"))
    .map((str, index) => keyword.includes(str) ? <mark key={index}>{str}</mark> : str )}</span>
  }else{
    if(keyword === "") return <span className={className}>{text}</span>
    return <span className={className}>{text.split(new RegExp(`(${keyword})`, ignoreCase ? "gi" : "g"))
    .map((str, index) => str === keyword ? <mark key={index}>{str}</mark> : str )}</span>
  }
}

export default Highlight