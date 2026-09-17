# XnetAIops Web · GOAI v1.3.0

[![GOAI release](https://img.shields.io/badge/GOAI%20release-1.3.0-1677ff.svg)](https://github.com/synapxnet/XnetAIops-web/releases/tag/v1.3.0)

## GOAI 决赛版 · v1.3.0

[发布页与校验文件](https://github.com/synapxnet/XnetAIops-web/releases/tag/v1.3.0) · [下载源码 ZIP](https://github.com/synapxnet/XnetAIops-web/releases/download/v1.3.0/XnetAIops-web-v1.3.0-a5e9c2c0-source.zip) · [查看 v1.3.0 源码](https://github.com/synapxnet/XnetAIops-web/tree/v1.3.0) · [配套后端 XnetAIops](https://github.com/synapxnet/XnetAIops/releases/tag/v1.3.0) · [OpenXnet 桌面安装包](https://github.com/synapxnet/OpenXnet/releases/tag/v1.3.0)

> GOAI 产品版本为 **v1.3.0**。固定标签和发布附件对应正式交付；此后的 README 更新不会改变已发布制品。

包含统一登录与皮肤、驻场 Agent 聊天和配置入口、运行保障工作台及受控终端交互。跨平台协作和审批通过 OpenXnet 与 AgentTeams 组织，页面状态本身不代表已经取得执行授权。

部署依赖、实测结果和能力边界见[本仓源码交付与构建说明](./docs/GOAI-FINALS-V1.3.0-SOURCE-DELIVERY.md)。发布源码不代表线上服务已重新部署。本轮生产构建通过，全量类型检查仍有 135 处问题。

> 下方为历史界面截图，仅用于了解原有功能与布局，不作为 v1.3.0 新界面的验收证据。

## 上游框架说明（保留来源）

本文件下半部分保留 Vue Vben Admin 的历史说明、维护者和许可证来源；其中版本号、示例账号及运行指令属于上游框架。OpenXnet 配套平台的使用入口请查看[本仓项目说明](./README.md)及上方 v1.3.0 发布材料。

<div align="center"> <a href="https://github.com/anncwb/vue-vben-admin"> <img alt="VbenAdmin Logo" width="215" src="https://unpkg.com/@vbenjs/static-source@0.1.7/source/logo-v1.webp"> </a> <br> <br>

[![license](https://img.shields.io/github/license/anncwb/vue-vben-admin.svg)](LICENSE)

<h1>Vue Vben Admin</h1>
</div>

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=vbenjs_vue-vben-admin&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=vbenjs_vue-vben-admin) ![codeql](https://github.com/vbenjs/vue-vben-admin/actions/workflows/codeql.yml/badge.svg) ![build](https://github.com/vbenjs/vue-vben-admin/actions/workflows/build.yml/badge.svg) ![ci](https://github.com/vbenjs/vue-vben-admin/actions/workflows/ci.yml/badge.svg) ![deploy](https://github.com/vbenjs/vue-vben-admin/actions/workflows/deploy.yml/badge.svg)

**上游中文说明** | [上游 English](https://github.com/vbenjs/vue-vben-admin/blob/main/README.md) | [上游 日本語](https://github.com/vbenjs/vue-vben-admin/blob/main/README.ja-JP.md)

## 简介

Vue Vben Admin 是 Vue Vben Admin 的升级版本。作为一个免费开源的中后台模板，它采用了最新的 Vue 3、Vite、TypeScript 等主流技术开发，开箱即用，可用于中后台前端开发，也适合学习参考。

## 升级提示

该版本为最新版本`5.0`, 与其他版本不兼容，如果你是新项目，建议使用最新版本。如果你想查看旧版本，请使用 [v2 分支](https://github.com/vbenjs/vue-vben-admin/tree/v2)

## 特性

- **最新技术栈**：使用 Vue3/vite 等前端前沿技术开发
- **TypeScript**: 应用程序级 JavaScript 的语言
- **主题**：提供多套主题色彩，可配置自定义主题
- **国际化**：内置完善的国际化方案
- **权限** 内置完善的动态路由权限生成方案

## 预览

- [Vben Admin](https://vben.pro/) - 完整版中文站点

测试账号: vben/123456

<p align="center">
    <img alt="VbenAdmin Logo" width="100%" src="https://anncwb.github.io/anncwb/images/preview1.png">
    <img alt="VbenAdmin Logo" width="100%" src="https://anncwb.github.io/anncwb/images/preview2.png">
    <img alt="VbenAdmin Logo" width="100%" src="https://anncwb.github.io/anncwb/images/preview3.png">
</p>

### 使用 Gitpod

在 Gitpod（适用于 GitHub 的免费在线开发环境）中打开项目，并立即开始编码.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/vbenjs/vue-vben-admin)

## 文档

[文档地址](https://doc.vben.pro/)

## 安装使用

- 获取项目代码

```bash
git clone https://github.com/vbenjs/vue-vben-admin.git
```

- 安装依赖

```bash
cd vue-vben-admin

corepack enable

pnpm install
```

- 运行

```bash
pnpm dev
```

- 打包

```bash
pnpm build
```

## 更新日志

[CHANGELOG](https://github.com/vbenjs/vue-vben-admin/releases)

## 如何贡献

非常欢迎你的加入！[提一个 Issue](https://github.com/anncwb/vue-vben-admin/issues/new/choose) 或者提交一个 Pull Request。

**Pull Request:**

1. Fork 代码!
2. 创建自己的分支: `git checkout -b feature/xxxx`
3. 提交你的修改: `git commit -am 'feat(function): add xxxxx'`
4. 推送您的分支: `git push origin feature/xxxx`
5. 提交`pull request`

## Git 贡献提交规范

- 参考 [vue](https://github.com/vuejs/vue/blob/dev/.github/COMMIT_CONVENTION.md) 规范 ([Angular](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular))

  - `feat` 增加新功能
  - `fix` 修复问题/BUG
  - `style` 代码风格相关无影响运行结果的
  - `perf` 优化/性能提升
  - `refactor` 重构
  - `revert` 撤销修改
  - `test` 测试相关
  - `docs` 文档/注释
  - `chore` 依赖更新/脚手架配置修改等
  - `ci` 持续集成
  - `types` 类型定义文件更改
  - `wip` 开发中

## 浏览器支持

本地开发推荐使用`Chrome 80+` 浏览器

支持现代浏览器, 不支持 IE

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt=" Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>IE | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt=" Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Safari |
| :-: | :-: | :-: | :-: | :-: |
| not support | last 2 versions | last 2 versions | last 2 versions | last 2 versions |

## 维护者

[@Vben](https://github.com/anncwb)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=vbenjs/vue-vben-admin&type=Date)](https://star-history.com/#vbenjs/vue-vben-admin&Date)

## 捐赠

如果你觉得这个项目对你有帮助，你可以帮作者买一杯咖啡表示支持!

![donate](https://unpkg.com/@vbenjs/static-source@0.1.7/source/sponsor.png)

<a style="display: block;width: 100px;height: 50px;line-height: 50px; color: #fff;text-align: center; background: #408aed;border-radius: 4px;" href="https://www.paypal.com/paypalme/cvvben">Paypal Me</a>

## Contributor

<a href="https://github.com/vbenjs/vue-vben-admin/graphs/contributors">
  <img alt="Contributors"
        src="https://opencollective.com/vbenjs/contributors.svg?button=false" />
</a>

## Discord

- [Github Discussions](https://github.com/anncwb/vue-vben-admin/discussions)

## License

[MIT © Vben-2020](./LICENSE)
