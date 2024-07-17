
[中文](./README.md) | English

---

> v2 update

# My Fingerprint

- Useful `Chrome / Edge` Plugin
- Installation takes effect immediately
- Customizable for various fingerprints
- Monitor page access to fingerprints
- Whitelisting module

# Usage

***Plugin Installation:***
1. Download the latest version of the plugin zip -- [Plugin Download](https://github.com/omegaee/my-fingerprint/releases)
2. Open the browser extension management, open the developer mode
3. Drag and drop the downloaded zip into the Browser Extension Manager page.
4. Enable the plugin (check `Allow in InPrivate` in `Details` if necessary).

***Plugin Usage:***
- Installation takes effect immediately (previously opened tabs have to be refreshed to take effect)
- (Optional) Left-click on the plug-in icon to enter the configuration page for customized configuration.


# Popup Module

<img src='./images/en/ui.png' width='360px' />

## Configuration Module
- For customization of various fingerprints

> Options are currently supported:
> - Default
> - Custom value
> - Randomized values per tab
> - Every time the browser starts a random
> - Randomized based on domain name
> - Randomization based on global seed

- **Base Fingerprint Config**
  - [x] Equipment Info
  - [x] Browser Language
  - [x] Number of logical processors
  - [x] Screen Size
  - [x] Screen Color Depth
  - [x] Screen Pixel Depth
- **Special Fingerprint Config**
  - [x] Timezone
  - [x] Canvas Fingerprint
  - [x] Audio Fingerprint
  - [x] WebGL Fingerprint
- **Other Config**
  - [x] Language - Languages used by browser extensions
  - [x] Global Seed - Global Seed, Acts on `Randomization based on global seed` Options
  - [x] Web Request Hooks - Making changes to web requests（`User-Agent`）
  - [x] Blank Iframe Hooks - Injection into a blank source Iframe

## Record Module
> Shows how many times the current tab has been accessed for various fingerprints

## Whitelist Module
> The whitelist list can be edited


# Known Issues
> If there is a solution, you are welcome to propose it!
- **Since the configuration needs to be read asynchronously, the core script injection will have a delay and may miss some extreme cases.**
- Web request hooks, which are implemented through `declarativeNetRequest`
  - **Unable to support whitelisting**
  - The Sec-CH-UA series request header is not currently supported.
