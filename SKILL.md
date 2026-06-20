---
name: arcade-ai
description: Use when building or modifying a Microsoft MakeCode Arcade game — scaffolds a project, runs a live studio embedding the official editor, and provides an offline API/limits/pitfalls reference.
---

# MakeCode Arcade AI Studio

帮助用 AI 开发 Microsoft MakeCode Arcade 游戏：脚手架 + 嵌入官方编辑器的实时双向同步 studio
+ 离线参考手册。

## 何时用
- 用户想做 / 改 arcade 游戏、像素小游戏、makecode 游戏时。

## 怎么用（三个命令）
1. 起项目：`npx arcade-ai init <dir> [--tool claude|trae|agents]`
   —— 生成纯 TS 脚手架，并把规则文件与 `reference/` 一并拷进项目。
2. 起 studio：在项目目录 `npx aca dev` —— 浏览器实时预览，AI 改 `game/main.ts` 自动刷新；
   在编辑器里改代码/画精灵也会回写磁盘（双向）。
3. 协议自检：`npx aca check` —— 验证官方编辑器握手 + 代码真渲染（联网，需 puppeteer）。

## 写代码硬约束（违反会翻车）
- 代码只写 `game/main.ts`；资源（精灵/地图，4-bit 16 色）走 `game/assets.json`，不内联大图到 JS。
- **纯 TS 项目**：`game/` 里不要 `main.blocks`，`pxt.json` 的 `files` 也不列它，
  `preferredEditor` 用 `tsprj`。否则编辑器会开在空白积木视图、看不到代码。
- `assets.json` 必须是合法 JSON（空资源写 `{}`），不要清空成空文件。
- 不臆造 arcade 不存在的 API。

## 查文档（按需读，不要全量背）
本 skill 同级、以及 `aca init` 生成的用户项目内，都有一份 `reference/`：
- `reference/arcade-api.md` —— sprites / controller / game / tilemap / music / info API 速查
- `reference/limits.md` —— 屏幕、调色板、内存、不支持的 JS 特性等硬限制
- `reference/pitfalls.md` —— 已知坑 + postMessage 协议字段（动手前务必扫一遍）
- `reference/project-format.md` —— pxt.json / assets.json / 文件格式约定

写代码前，遇到不确定的 API 或限制就读对应文件，不要凭记忆。
