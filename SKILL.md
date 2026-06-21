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
1. 起项目：`npx arcade-ai init <dir> [--template blank|platformer|flappy] [--tool claude|trae|agents]`

   **执行 init 前，先问用户想做哪种游戏，根据回答选模板：**
   - `--template blank`（**默认**）：空白项目，只有最简单的精灵和地图引用，适合从零开始。
   - `--template platformer`：横版平台跳跃，含地图、敌人、重力跳跃，推荐有明确玩法时选。
   - `--template flappy`：Flappy Bird 风格，管道障碍 + 重力下坠，推荐单一机制练习。

   生成纯 TS 脚手架，并把规则文件与 `reference/` 一并拷进项目。
2. 起 studio：在项目目录 `npx aca dev` —— 浏览器实时预览，AI 改 `game/main.ts` 自动刷新；
   在编辑器里改代码/画精灵也会回写磁盘（双向）。
3. 协议自检：`npx aca check` —— 验证官方编辑器握手 + 代码真渲染（联网，需 puppeteer）。

## 接手项目时必须先读文档
拿到一个 arcade 项目（或准备写代码）时，**第一步读以下文件，不要跳过**：
- `reference/arcade-api.md` —— 有哪些 API、怎么用
- `reference/pitfalls.md` —— 哪些写法会翻车（踩坑成本极高）
- `reference/limits.md` —— 内存/尺寸/功能硬限制
- `reference/project-format.md` —— 文件格式约定（pxt.json / assets.json）

读完再动手，遇到不确认的 API 回来查，不要靠记忆臆造。

## 写代码硬约束（违反会翻车）
- 代码只写 `game/main.ts`；资源（精灵/地图，4-bit 16 色）走 `game/assets.json`，不内联大图到 JS。
- **纯 TS 项目**：`game/` 里不要 `main.blocks`，`pxt.json` 的 `files` 也不列它，
  `preferredEditor` 用 `tsprj`。否则编辑器会开在空白积木视图、看不到代码。
- `assets.json` 必须是合法 JSON（空资源写 `{}`），不要清空成空文件。
- **地图**：用命名地图 `tiles.setTilemap(tilemap`level`)`（编辑器自动建、人可画、自动同步回磁盘），
  或 `createTilemap` 配**内置图块**（`sprites.castle.*`）。❌ 别把内联 `img` 当图块塞进 `createTilemap`，会崩。
- 不臆造 arcade 不存在的 API。

## 查文档（按需读，不要全量背）
本 skill 同级、以及 `aca init` 生成的用户项目内，都有一份 `reference/`：
- `reference/arcade-api.md` —— sprites / controller / game / tilemap / music / info API 速查
- `reference/limits.md` —— 屏幕、调色板、内存、不支持的 JS 特性等硬限制
- `reference/pitfalls.md` —— 已知坑 + postMessage 协议字段（动手前务必扫一遍）
- `reference/project-format.md` —— pxt.json / assets.json / 文件格式约定

写代码前，遇到不确定的 API 或限制就读对应文件，不要凭记忆。
