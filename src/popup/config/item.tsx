type ConfigItemXProps = {
  children: React.ReactNode
  label?: React.ReactNode
  startContent?: React.ReactNode
  endContent?: React.ReactNode
}

export const ConfigItemX = ({ children, label, startContent, endContent }: ConfigItemXProps) => {
  return <div className="py-2 px-1 mb-1 last:mb-0 flex gap-2 items-center justify-between rounded hover:bg-[--ant-color-primary-bg-hover] duration-200">
    <div className="flex items-center gap-3">
      {label}
      {startContent}
    </div>
    <div className="flex items-center gap-3">
      {endContent}
      {children}
    </div>
  </div>
}

type ConfigItemYProps = {
  children: React.ReactNode
  label?: React.ReactNode
  startContent?: React.ReactNode
  endContent?: React.ReactNode
  bottomContent?: React.ReactNode
}

export const ConfigItemY = ({ children, label, startContent, endContent, bottomContent }: ConfigItemYProps) => {
  return <div className="mb-1 last:mb-0 flex flex-col gap-2 p-1 rounded hover:bg-[--ant-color-primary-bg-hover] duration-200">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {label}
        {startContent}
      </div>
      {endContent && <div className="flex items-center gap-3">
        {endContent}
      </div>}
    </div>
    {children}
    {bottomContent}
  </div>
}