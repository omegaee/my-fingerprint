<h4 align="center">
<a href="./README.md">简体中文</a> | English
</h4>

<hr/>

<h1 align="center">My Fingerprint</h1>

<p align="center">
Protect your browser fingerprints and enhance privacy. Supports <code>Chrome</code>, <code>Edge</code>, and <code>Firefox</code>.
</p>

<p align="center">
Lightweight injection script. Built on Manifest V3 with excellent performance and zero disruption.
</p>


<p align="center">
<a href="https://github.com/omegaee/my-fingerprint/releases">
  <img alt="Latest Release" src="https://img.shields.io/github/v/release/omegaee/my-fingerprint?style=flat">
</a>
<a href="https://github.com/omegaee/my-fingerprint/stargazers">
  <img alt="Stars" src="https://img.shields.io/github/stars/omegaee/my-fingerprint?style=flat">
</a>
<a href="https://github.com/omegaee/my-fingerprint/issues">
  <img alt="Issues" src="https://img.shields.io/github/issues/omegaee/my-fingerprint?style=flat">
</a>
<a href="https://github.com/omegaee/my-fingerprint/blob/main/LICENSE">
  <img alt="License" src="https://img.shields.io/github/license/omegaee/my-fingerprint?style=flat">
</a>
</p>

---

<h5 align="center">
  <a href="#features">✨ Features</a> |
  <a href="#fingerprint">🧬 Fingerprint</a> |
  <a href="#installation">🧰 Installation</a> |
  <a href="#configuration">⚙️ Configuration</a> |
  <a href="#testing">🧪 Testing</a> |
  <a href="#development">🛠️ Development</a> |
  <a href="#support">🌸 Support</a> |
  <a href="#disclaimer">📜 Disclaimer</a> |
  <a href="#credi">🙏 Credits</a>
</h5>


## ✨ Features <a id="features"></a>

- 🚀 Supports Chrome, Edge, and Firefox
- ⚙️ Works instantly upon installation, no configuration required
- 📦 Built on Manifest V3 for modern compatibility
- 🔍 Monitors fingerprint API access on web pages
- 🧱 Customizable protection rules and whitelist support
- 📤 Import/export configuration and subscription support
- 🧩 Lightweight native injection (20.0 KB / Gzip: 10.0 KB), zero dependencies, negligible performance cost

## 🧬 Fingerprint Protection <a id="fingerprint"></a>

- Canvas fingerprint
- Audio fingerprint
- Fonts fingerprint
- WebGL fingerprint
- WebRTC protection
- WebGPU fingerprint
- DomRect fingerprint
- Language and timezone
- Graphics driver info
- UserAgent series
- Screen size and resolution

## 🧰 Installation <a id="installation"></a>

### Chrome / Edge

- Required version: `Chrome/Edge 102+`
- Recommended: 120+
- [Download](https://github.com/omegaee/my-fingerprint/releases/latest) `.zip` → Drag into extension manager → Enable
- Optional: Enable in Incognito/InPrivate mode

### Firefox

- Required version: `Firefox 136+`
- [Download](https://github.com/omegaee/my-fingerprint/releases/latest) `.xpi` → Drag into browser window → Click “Add”

## ⚙️ Configuration Module <a id="configuration"></a>

This module provides flexible options for customizing fingerprint protection behavior:

- **Strong Fingerprint Group**
  - Simulates highly unique user characteristics  
  - Typically used in combination with other fingerprints or IP data

- **Weak Fingerprint Group**
  - Captures basic, high-repetition information  
  - Suitable for lightweight protection scenarios

- **Script Settings**
  - Global Seed: Used for the “Random by Global Seed” option to ensure consistent output  
  - Injection Mode: Recommended to enable “Fast Injection” for better compatibility and performance

- **Whitelist Management**
  - Supports editing whitelist entries  
  - Subdomain matching supported: e.g., `example.com` matches `*.example.com`, `*.*.example.com`

- **Subscription Options**
  - Use configuration templates for quick setup (subscription can be disabled after initial use)  
    - [Standard Mode – Default Template](https://raw.githubusercontent.com/omegaee/my-fingerprint/main/example/config/template.json)  
  - Empty value disables subscription  
  - Supports manual subscription or auto-fetching remote config (JSON format) on extension startup  
  - Subscription config will override existing settings and merge whitelist entries

## 🧪 Testing Targets <a id="testing"></a>

- [webbrowsertools.com](https://webbrowsertools.com/)
- [browserscan.net](https://www.browserscan.net/)
- [CreepJS](https://abrahamjuliot.github.io/creepjs/)
- [yalala.com](https://www.yalala.com/)
- [uutool.cn](https://uutool.cn/browser/)

## 🛠️ Development <a id="development"></a>

```bash
cd <project>
npm install
npm run dev          # Chrome / Edge
npm run dev:firefox  # Firefox
```

## 🌸 Support <a id="support"></a>

- Submit feedback via Issues or Pull Requests
- If you find this project helpful, give it a ⭐
- Your feedback helps make this project better. Every star counts!

## 📜 Disclaimer <a id="disclaimer"></a>

This project is for educational and research purposes only. Do not use it for illegal activities. The developer is not responsible for any consequences.

## 🙏 Credits <a id="credits"></a>

Thanks to all contributors and the open-source community!
