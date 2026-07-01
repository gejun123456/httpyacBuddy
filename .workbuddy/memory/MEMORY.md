# Spring HTTP Buddy - 项目长期记忆

## 项目概述
VS Code 扩展，通过正则解析 Spring Controller Java 源码，自动生成 `.http` 请求文件。

## 上次优化记录 (2026-06-24)
- 添加了 httpYac 安装检测提示：`activate()` 中检查 `anweber.vscode-httpyac`，未安装时弹出通知引导安装
- 用 `globalState` 持久化 "已提示" 标记，避免重复骚扰
- 更新了 README Quick start 部分，推荐 httpYac 作为首选 HTTP client
