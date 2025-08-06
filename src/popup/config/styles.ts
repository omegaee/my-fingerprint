export const selectStatusDotStyles = {
  base: "after:block after:absolute after:left-1 after:top-1/2 after:translate-y-[-50%] after:h-2 after:w-1 [&_.ant-select-selection-item]:ml-2 after:rounded-sm after:duration-300 after:bg-[--ant-color-fill-content] hover:after:bg-[--ant-color-fill-content-hover]",
  success: "[&_.ant-select]:after:bg-[--ant-color-success-border-hover] [&_.ant-select]:hover:after:bg-[--ant-color-success-text-hover]",
  error: "[&_.ant-select]:after:bg-[--ant-color-error-border-hover] [&_.ant-select]:hover:after:bg-[--ant-color-error-text-hover]",
  warning: "[&_.ant-select]:after:bg-[--ant-color-warning-border-hover] [&_.ant-select]:hover:after:bg-[--ant-color-warning-text-hover]",
}