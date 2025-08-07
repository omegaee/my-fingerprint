import Markdown from "react-markdown"

type MdProps = {
  className?: string
  children?: string | null | undefined;
}

export const Md = ({ className, children }: MdProps) => {
  return <Markdown className={'markdown-body max-w-64' + (className ?? '')}>{children}</Markdown>
}