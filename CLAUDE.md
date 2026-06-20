# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 **Donut 小程序多端框架**（`projectArchitecture: "multiPlatform"`）的微信小程序，使用 TypeScript 编写。同一套代码既作为微信小程序运行，也可通过 Donut 框架编译为原生 iOS / Android App。AppID 为 `wx8fd005be10d08e8b`。

## 开发与构建方式

**本仓库没有 npm scripts、没有 lint、没有测试框架，也不依赖 node_modules。** 所有编译、预览、上传、原生打包都通过**微信开发者工具**完成，不要尝试用 `tsc`/`npm run build` 构建源码。

- 用微信开发者工具打开本目录（读取 `project.config.json`）即可开发预览。
- TypeScript 由开发者工具内置的编译插件即时编译（见 `project.config.json` 的 `useCompilerPlugins: ["typescript"]`），仓库里没有编译产物。
- 打包原生 iOS / Android App 时使用 Donut 框架的工具链（SDK 版本见 `project.miniapp.json`），同样在开发者工具中触发。
- `package.json` 仅声明类型依赖 `miniprogram-api-typings`（微信 API 类型），无运行时依赖。

配置覆盖关系：`project.private.config.json` 会覆盖 `project.config.json` 中的同名字段（如 `libVersion`、`projectname`）。修改项目级配置时优先同步到 private 文件。

## 多端架构（关键）

理解多端结构需要同时看多个文件，这是本仓库的核心：

- `miniprogram/` —— 小程序源码根目录（`miniprogramRoot`），所有页面、组件、工具、图片都在此处。
- `project.miniapp.json` —— 原生端打包配置，分 `mini-android` / `mini-ios` 两块，含 SDK 版本、扩展 SDK 开关、图标、闪屏、隐私等。`i18nFilePath` 指向 `i18n`。
- `miniprogram/app.miniapp.json` —— 原生端的身份/登录服务配置（`adapteByMiniprogram`、`identityServiceConfig`、`adaptWxLogin`），用于原生 App 内适配微信登录。
- `i18n/base.json` —— 多端文案，按 `ios` / `android` / `common` 分区（由 `project.miniapp.json` 的 `i18nFilePath` 引用），不是普通小程序的国际化。
- `miniapp/android/nativeResources/` —— 预留给 Android 原生资源（`res`、`app`、`assets`、`res/raw`）的空目录树，按需放入原生资源。

## 小程序代码结构

- `app.ts` —— `onLaunch` 时把启动时间戳写入本地存储 `logs`（`logs` 页面读取它）。
- `app.json` —— 4 个页面，但 `tabBar` 只暴露 `index`（首页）和 `contact`（联系我们）。`cases` 和 `logs` 不在 tabBar 中，分别通过 `wx.navigateTo` 和 `wx.switchTab` 进入。开启了 `componentFramework: "glass-easel"`、`lazyCodeLoading: "requiredComponents"` 和 Skyline 渲染（`skylineRenderEnable: true`）。
- 页面构造器混用：`index` / `logs` / `contact` 使用 `Component({})`，而 `cases` 使用 `Page({})`。新增页面时按需选择——`Component` 构造器更契合 Skyline 与懒加载，且可用 `lifetimes`。
- `typings/index.d.ts` 定义全局 `IAppOption` 接口；`typings/types/` 是微信 API 类型定义（`miniprogram-api-typings`），通过 `tsconfig.json` 的 `typeRoots` 引入。`tsconfig.json` 开启了严格模式（`strict`、`noUnusedLocals`、`noUnusedParameters` 等）。

## 页面要点

- `pages/cases/cases.ts` —— 案例数据**硬编码在文件内**（`getCaseData` 里的 `casesList`）。同目录的 `case.ts` 是另一份未使用的备选数据集，修改案例列表时认准 `cases.ts`，不要改 `case.ts`。
- `pages/logs/logs.ts` —— 用 `miniprogram/utils/util.ts` 的 `formatTime` 格式化时间戳。
- `pages/contact/contact.ts` —— 目前是空壳组件（无数据、无方法）。
- 样式约定：尺寸普遍用 `rpx`，`cases.wxss` 中注释标注了 px→rpx 的换算系数 `1.81`；`index.wxml`、`contact.wxml` 大量使用内联 style。
