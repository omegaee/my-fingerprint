
export type ToggleProps = {
  className?: string
  checked?: boolean
  leftNode?: React.ReactNode
  rightNode?: React.ReactNode
  onChange?: (checked: boolean) => void
}

export const Toggle = function (props: ToggleProps) {
  return <div className={props.className}>
    <label className="inline-flex items-center cursor-pointer">
      {props.leftNode}
      <div className="mx-2">
        <input type="checkbox" value="" checked={props.checked} className="sr-only peer" onChange={({target}) => props.onChange?.(target.checked)} />
        <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
      </div>
      {props.rightNode}
    </label>
  </div>
}

export default Toggle