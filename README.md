
中文 | [English](./README_EN.md)

---

# My Fingerprint - 自定义指纹

- 实用的Chrome/Edge插件
- 可自定义浏览器指纹
- 友好的配置界面
- 安装即用

## 配置界面

![界面](/images/popup.jpg)

## 使用

***插件安装：***
1. 下载插件最新版本的zip -- [插件下载](https://github.com/omegaee/my-fingerprint/releases)
2. 打开浏览器扩展管理，开启开发者模式
3. 把下载好的zip拖拽进去
4. 启用插件

***插件使用：***
- 安装即生效（之前打开的标签页要刷新才生效）
- 默认配置即可混淆常用的浏览器指纹
- 左键插件图标进入配置页面
- 根据[配置内容](#功能)进行DIY

## 功能

[配置界面图片](#配置界面)

- **记录**
  - 这里保存了该标签页对特定指纹的访问次数
- **配置**
  - [x] Navigator代理
    - 开启此代理才能记录和代理基本指纹中的navigator项内容
  - [x] Screen代理
    - 开启此代理才能记录和代理基本指纹中的screen项内容
- **基本指纹**
  - [x] navigator.language -- 语言
  - [x] navigator.platform -- 操作系统
  - [x] navigator.hardwareConcurrency -- 处理器核心数量
  - [x] navigator.appVersion -- 浏览器的平台和版本信息
  - [x] navigator.userAgent -- UA
  - [x] screen.height -- 屏幕高度
  - [x] screen.width -- 屏幕宽度
  - [x] screen.colorDepth -- 屏幕颜色深度
  - [x] screen.pixelDepth -- 屏幕的位深度/色彩深度
- **特殊指纹**
  - [x] canvas -- Canvas硬件指纹
  - [x] audio -- Audio硬件指纹
  - [x] webgl -- WebGL硬件指纹
  - [x] timezone -- 浏览器时区
  - [x] webrtc -- WebRTC-真实IP伪装
- **关于**

