<h4 align="center">
<a href="./README.md">简体中文</a> | English
</h4>

<hr/>

<h1 align="center">My Fingerprint</h1>

<br/>

<p align="center">
<strong>
Protect your browser fingerprints and enhance privacy. <code>Chrome</code>, <code>Edge</code>, <code>Firefox</code> supported.
</strong>
</p>

<p align="center">
<strong>
A lightweight, zero-disruption browser extension built on Manifest V3.
</strong>
</p>

<br/>

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

<p align="center">
  <a href="https://microsoftedge.microsoft.com/addons/detail/mikeajonghdjobhfokpleagjockmmgdk">
    <img src="https://img.shields.io/badge/Edge-Addon-blue?logo=microsoftedge" alt="Edge Addon" />
  </a>
  <a href="https://addons.mozilla.org/firefox/addon/my-fingerprint/">
    <img src="https://img.shields.io/badge/Firefox-Addon-orange?logo=firefox" alt="Firefox Addon" />
  </a>
  <a href="https://addons.mozilla.org/android/addon/my-fingerprint/">
    <img src="https://img.shields.io/badge/Firefox%20for%20Android-Addon-orange?logo=firefoxbrowser" alt="Firefox for Android Addon" />
  </a>
  <img src="https://img.shields.io/badge/Chrome-Manual%20Install-lightgrey?logo=googlechrome" alt="Chrome Manual Install" />
</p>

<p align="center">
<a href="https://ko-fi.com/omegaee">
  <img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support me on Ko-fi" />
</a>
</p>

---

## 💖 Sponsors

<table>
<tr>
<td style="width:420px">
<a href="https://www.thordata.com/?ls=github&lk=My%20Fingerprint">
  <img
    src="./docs/sponsors/thordata.png"
    alt="Thordata is a reliable and cost-effective proxy service provider. Sign up to receive 1GB of residential proxy and 2,000 serp‑api calls for free." 
    width="420"
  />
</a>
</td>
</tr>
<tr>
<td style="width:420px" align="center">
<small>
<a href="https://www.thordata.com/?ls=github&lk=My%20Fingerprint">Thordata</a> is a reliable and cost-effective proxy service provider. Sign up to receive 1GB of residential proxy and 2,000 serp‑api calls for free.
</small>
</td>
</tr>
</table>

---

<h5 align="center">
  <a href="#features">✨ Features</a> |
  <a href="#fingerprint">🧬 Fingerprint</a> |
  <a href="#installation">🧰 Installation</a> |
  <a href="#configuration">⚙️ Configuration</a> |
  <a href="#testing">🧪 Testing</a> |
  <a href="#development">🛠️ Development</a> |
  <a href="#faq">❓ FAQ</a> |
  <a href="#support">💝 Support</a> |
  <a href="#disclaimer">📜 Disclaimer</a> |
  <a href="#credits">🙏 Credits</a>
</h5>


## ✨ Features <a id="features"></a>

- 🚀 Supports Chrome, Edge, and Firefox
- ⚙️ Works instantly upon installation, no configuration required
- 📦 Built on Manifest V3 for modern compatibility
- 🔍 Monitors fingerprint API access on web pages
- 🧱 Customizable protection rules and whitelist support
- 📤 Import/export configuration and subscription support
- 🧩 Lightweight native injection, zero dependencies, negligible performance cost

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

### 🧩 Extension Store Installation

💡 Extension store updates may lag behind GitHub due to review delays.

- [Edge](https://microsoftedge.microsoft.com/addons/detail/mikeajonghdjobhfokpleagjockmmgdk)
- [Firefox](https://addons.mozilla.org/firefox/addon/my-fingerprint/)
- [Firefox for Android](https://addons.mozilla.org/android/addon/my-fingerprint/)
- Chrome: Not yet available. Please use manual installation.

### 📦 Manual Installation

#### Chrome / Edge

- Required version: `Chrome/Edge 102+`
- Recommended: 120+
- [Download](https://github.com/omegaee/my-fingerprint/releases/latest) `.zip` → Drag into extension manager → Enable
- Optional: Enable in Incognito/InPrivate mode

#### Firefox

- Required version: `Firefox 136+`
- [Download](https://github.com/omegaee/my-fingerprint/releases/latest) `.xpi` → Drag into browser window → Click “Add”

## ⚙️ Configuration Module <a id="configuration"></a>

This module provides flexible options for customizing fingerprint protection behavior:

- Strong Fingerprint Group
  - Simulates highly unique user characteristics  
  - Typically used in combination with other fingerprints or IP data

- Weak Fingerprint Group
  - Captures basic, high-repetition information  
  - Suitable for lightweight protection scenarios

- Script Settings
  - Global Seed: Used for the “Random by Global Seed” option to ensure consistent output  
  - Injection Mode: Recommended to enable “Fast Injection” for better compatibility and performance

- Whitelist Management
  - Supports editing whitelist entries  
  - Subdomain matching supported: e.g., `example.com` matches `*.example.com`, `*.*.example.com`

- Subscription Options
  - Use configuration templates for quick setup (subscription can be disabled after initial use)  
    - [Standard Mode – Default Template](https://raw.githubusercontent.com/omegaee/my-fingerprint/main/example/config/template.json)  
  - Empty value disables subscription  
  - Supports manual subscription or auto-fetching remote config (JSON format) on extension startup  
  - Subscription config will override existing settings and merge whitelist entries

## 🧪 Testing Targets <a id="testing"></a>

- [webbrowsertools.com](https://webbrowsertools.com/)
- [browserleaks.com](https://browserleaks.com/)
- [CreepJS](https://abrahamjuliot.github.io/creepjs/)
- [browserscan.net](https://www.browserscan.net/)
- [yalala.com](https://www.yalala.com/)
- [uutool.cn](https://uutool.cn/browser/)

## 🛠️ Development <a id="development"></a>

```bash
cd <project>
npm install
npm run dev          # Chrome / Edge
npm run dev:firefox  # Firefox
```


## ❓ FAQ <a id="faq"></a>

**Q: Why do I need this extension?**
> A: Browser fingerprints can be used for cross-site tracking, compromising user privacy. This extension disguises key fingerprint data to reduce the risk of identification and tracking.

**Q: How is this extension different from a fingerprint browser?**
> A: A well-designed fingerprint browser simulates a complete environment for deep obfuscation, ideal for anti-detection scenarios. This extension uses JS injection, offering lightweight protection suitable for everyday use and most fingerprint-related threats.

**Q: Are browser fingerprints a unique identifier?**
> A: Not strictly. A single fingerprint may not be unique, but when combined with IP address, browser storage, and other data, it can strongly identify a user.

**Q: Is it better to protect as many fingerprints as possible?**
> A: Not necessarily. In many cases, modifying just one key fingerprint is enough to break tracking. Overprotecting may cause site compatibility issues or expose abnormal behavior. Choose protection items based on actual needs.

**Q: What's the difference between strong and weak fingerprints?**
> A: Strong fingerprints are highly unique and often used for precise tracking—modifying them greatly enhances privacy. Weak fingerprints have low uniqueness and are usually safe to leave unchanged to maintain compatibility.

**Q: What should I do if the extension doesn't work properly or some pages behave abnormally?**  
> A: Try enabling **Fast Injection Mode** in the script settings to improve compatibility. For abnormal pages, you can either **add them to the whitelist** or apply the **Known Issues List** from the configuration presets to resolve common problems.


## 💝 Support <a id="support"></a>

- If you find this project helpful, give it a ⭐
- Your feedback helps make this project better. Every star counts!
- [Support me on Ko-fi](https://ko-fi.com/omegaee)

## 📜 Disclaimer <a id="disclaimer"></a>

This project is for educational and research purposes only. Do not use it for illegal activities. The developer is not responsible for any consequences.

## 🙏 Credits <a id="credits"></a>

Thanks to all contributors and the open-source community!
