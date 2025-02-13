export enum HookType {
  default = 0,  // 系统值
  value = 1,  // 自定义值
  page = 2,  // 每个标签页随机
  browser = 3,  // 每次启动浏览器随机
  domain = 4,  // 根据域名随机
  global = 5,  // 根据全局种子随机
  enabled = 6,  // 启用
  disabled = 7,  // 禁用
}