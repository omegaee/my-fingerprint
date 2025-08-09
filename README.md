<h4 align="center">
简体中文 | <a href="./README_EN.md">English</a>
</h4>

<hr/>

<h1 align="center">My Fingerprint</h1>

<p align="center">
保护你的浏览器指纹，提升隐私安全。支持 <code>Chrome</code>、<code>Edge</code>、<code>Firefox</code>，安装即生效。
</p>

<p align="center">
轻量注入脚本，基于 Manifest V3 构建，性能优秀，零干扰。
</p>


<p align="center">
<a href="https://github.com/omegaee/my-fingerprint/releases">
  <img alt="Latest Release" src="https://img.shields.io/github/v/release/omegaee/my-fingerprint?style=flat-square">
</a>
<a href="https://github.com/omegaee/my-fingerprint/stargazers">
  <img alt="Stars" src="https://img.shields.io/github/stars/omegaee/my-fingerprint?style=flat-square">
</a>
<a href="https://github.com/omegaee/my-fingerprint/issues">
  <img alt="Issues" src="https://img.shields.io/github/issues/omegaee/my-fingerprint?style=flat-square">
</a>
<a href="https://github.com/omegaee/my-fingerprint/blob/main/LICENSE">
  <img alt="License" src="https://img.shields.io/github/license/omegaee/my-fingerprint?style=flat-square">
</a>
</p>

---

<h5 align="center">
  <a href="#features">✨ 功能</a> |
  <a href="#fingerprint">🧬 指纹</a> |
  <a href="#installation">🧰 安装</a> |
  <a href="#testing">🧪 测试</a> |
  <a href="#development">🛠️ 开发</a> |
  <a href="#community">🌱 社区</a> |
  <a href="#support">🌸 支持</a> |
  <a href="#disclaimer">📜 声明</a> |
  <a href="#acknowledgements">🙏 鸣谢</a>
</h5>


## ✨ 功能特点 <a id="features"></a>

- 🚀 支持 Chrome、Edge、Firefox 浏览器
- ⚙️ 安装即生效，无需额外配置
- 📦 基于 Manifest V3，兼容性强
- 🔍 可监控页面对指纹 API 的访问情况
- 🧱 支持白名单控制与自定义配置
- 📤 提供配置导入导出与订阅功能
- 🧩 轻量级原生注入（20.0 KB / Gzip: 10.0 KB），无第三方依赖，性能开销极低

## 🧬 指纹保护 <a id="fingerprint"></a>

- Canvas 指纹
- WebGL 指纹
- Audio 指纹
- Fonts 指纹
- WebRTC 保护
- WebGPU 指纹
- DomRect 指纹
- 语言与时区
- 图形驱动信息
- UserAgent
- 屏幕尺寸与分辨率

## 🧰 安装指南 <a id="installation"></a>

### Chrome / Edge

- 浏览器版本要求：`Chrome/Edge 102+`
- 推荐版本：120+
- 下载 `.zip` 文件 → 拖入扩展管理页面 → 启用扩展
- 可选：启用无痕模式支持

### Firefox

- 浏览器版本要求：`Firefox 136+`
- 下载 `.xpi` 文件 → 拖入浏览器窗口 → 点击添加

## 🧪 测试目标 <a id="testing"></a>

- [webbrowsertools.com](https://webbrowsertools.com/)
- [yalala.com](https://www.yalala.com/)
- [uutool.cn](https://uutool.cn/browser/)
- [browserscan.net](https://www.browserscan.net/)
- [CreepJS](https://abrahamjuliot.github.io/creepjs/)

## 🛠️ 开发 <a id="development"></a>

```bash
cd <project>
npm install
npm run dev          # Chrome / Edge
npm run dev:firefox  # Firefox
```

## 🌱 社区 <a id="community"></a>

- 欢迎通过 Issues 和 Pull Requests 提交建议与反馈
- [![QQ群](https://img.shields.io/badge/QQ%E7%BE%A4-971379868-fedcba?style=flat-square&logo=qq&logoColor=white)](https://qm.qq.com/q/hxchiOUTtu)

## 🌸 支持一下 <a id="support"></a>

- 如果你觉得项目有帮助，请点个 Star ⭐
- 微信赞赏支持也欢迎！

| 微信 |
| :---: |
| <img src='./images/wechat-code.png' title='微信' width='200px' height='200px'  /> |

## 📜 声明 <a id="disclaimer"></a>

本项目仅用于学习与研究目的。请勿用于非法用途，开发者不对任何损失或问题负责。

## 🙏 鸣谢 <a id="acknowledgements"></a>

感谢所有贡献者与支持者。特别感谢开源社区的力量！
