
[中文](./README.md) | English

---

[--- v2.5 Update ---](https://github.com/omegaee/my-fingerprint/releases/latest)

# My Fingerprint

- `Chrome / Edge / Firefox` Extension
- Modify various fingerprints of the browser
- Optional fingerprints
- Optional random conditions
- Installation takes effect immediately
- Monitor page access to fingerprints
- Supports whitelist control

**Supports fingerprints**
- [x] UserAgent Series
- [x] Screen Series
- [x] Language
- [x] Time Zone
- [x] Canvas Fingerprint
- [x] Audio Fingerprint
- [x] Font Fingerprint
- [x] WebGL Fingerprint
- [x] WebRTC Protection
- [x] WebGPU Fingerprint
- [x] Graphics Driver Info

## Table of Contents
- [Usage](#usage)
- [Popup Module](#popup-module)
- [Test Target](#test-target)
- [Development](#development)
- [Support](#support)
- [Disclaimer](#disclaimer)


## Usage

#### Chrome & Edge

***Frontend:***
- Browser version required `Chrome 120+` `Edge 120+`.

***Installation:***
1. Download the latest version of the Extension `.zip` -- [Extension Download](https://github.com/omegaee/my-fingerprint/releases/latest)
2. Open the browser extension management, open the developer mode
3. Drag and drop the downloaded `.zip` into the Browser Extension Manager page.
4. Enable the Extension (check `Allow in Incognito / Allow in InPrivate` in `Details` if necessary).

***Usage:***
- Installation takes effect immediately (previously opened tabs have to be refreshed to take effect)
- (Optional) Left-click on the plug-in icon to enter the configuration page for customized configuration.
- (Optional) If this does not work, try restarting your browser.

#### Firefox

***Frontend:***
- Browser version required `Firefox 136+`.

***Installation:***
1. Download the latest version of the Extension `.xpi` -- [Extension Download](https://github.com/omegaee/my-fingerprint/releases/latest)
2. Drag and drop the `.xpi` file directly into the browser window.
3. The browser will pop up installation prompt.
4. Left click on the extension icon to enter the extension page, click on `More -> Permission` to permission the feature.

***Usage:***
- Installation takes effect immediately (previously opened tabs have to be refreshed to take effect)
- (Optional) Left-click on the plug-in icon to enter the configuration page for customized configuration.
- (Optional) If this does not work, try restarting your browser.


## Popup Module

<img src='./images/en/ui.png' width='360px' />

### Configuration Module
- **Normal Fingerprint Config**
- **Special Fingerprint Config**
- **Other Config**
  - [x] Language - Languages used by browser extensions
  - [x] Global Seed - Global Seed, Acts on `Random by Global Seed` Options
  - [x] Web Request Hooks - Making changes to web request headers
  - [x] Iframe Hooks - Injection into Iframe

### Record Module
- Shows how many times the current tab has been accessed for various fingerprints

### Whitelist Module
- The whitelist list can be edited
- Support for sub-domain matching


## Test Target
- [x] https://webbrowsertools.com/
- [x] https://www.yalala.com/
- [x] https://uutool.cn/browser/
- [x] https://www.ip77.net/
- [x] https://www.browserscan.net/
- [x] https://abrahamjuliot.github.io/creepjs/


## Development
```sh
cd <project>
npm install
```

#### Chrome & Edge
- Run `npm run dev`
- In the browser extension interface, turn on `Developer Mode`, click `Load Unzipped Extension`, and select the `<project>/dist/` directory.

#### Firefox
- Run `npm run dev:firefox`, failing which you run it again.
- In the browser extension interface, click `Load Temporary Extension` and select `<project>/dist/manifest.json`.
- It is recommended to delete `<project>/src/core/output.js` before compiling for non-first time.


## Support
- This project is free and open source, if you think it is helpful to you, please give me a Star.
- If you have any good suggestions or comments, please feel free to submit an Issue or Pull Request.


## Disclaimer
- For certain more sensitive operations, use more specialized tools.
- This project is intended for educational and research purposes only. The developer is not responsible for any losses or issues caused by the use of this project.