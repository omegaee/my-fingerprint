
[中文](./README.md) | English

---

# My Fingerprint - 自定义指纹

- Practical Chrome/Edge extension
- Customizable browser fingerprint
- User-friendly configuration interface
- Ready to use upon installation

## Interface

![界面](/images/popup.jpg)

## Usage

***Plugin Installation:***

1. Download the latest version of the plugin zip – [Plugin Download](https://github.com/omegaee/my-fingerprint/releases)
2. Open the browser extension management, turn on developer mode
3. Drag and drop the downloaded zip
4. Enable the plugin

***Plugin Usage:***

- Effective upon installation (previously opened tabs need to be refreshed to take effect)
- Left-click the plugin icon to enter the configuration page
- DIY according to the [configuration content](#features)

## Features

[Configuration Interface Image](#interface)

- **Records - 记录**
  - This saves the number of visits to this tab for a specific fingerprint
- **Configuration - 配置**
  - [x] Navigator Proxy
    - This proxy must be enabled to record and proxy the content of the navigator item in the basic fingerprint
  - [x] Screen Proxy
    - This proxy must be enabled to record and proxy the content of the screen item in the basic fingerprint
- **Basic Fingerprint - 基本指纹**
  - [x] navigator.language – Language
  - [x] navigator.platform – Operating System
  - [x] navigator.hardwareConcurrency – Number of Processor Cores
  - [x] navigator.appVersion – Browser’s Platform and Version Information
  - [x] navigator.userAgent – UA
  - [x] screen.height – Screen Height
  - [x] screen.width – Screen Width
  - [x] screen.colorDepth – Screen Color Depth
  - [x] screen.pixelDepth – Screen Bit Depth/Color Depth
- **Special Fingerprint - 特殊指纹**
  - [x] canvas – Canvas Hardware Fingerprint
  - [x] audio – Audio Hardware Fingerprint
  - [x] webgl – WebGL Hardware Fingerprint
  - [x] timezone – Browser Timezone
  - [x] webrtc – WebRTC-Real IP Disguise
- **About - 关于**
