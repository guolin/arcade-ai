---
name: arcade-ai
description: Use when building or modifying a Microsoft MakeCode Arcade game — scaffolds a project, runs a live studio embedding the official editor, and provides an offline API/limits reference.
---

# MakeCode Arcade AI Studio

帮助用 AI 开发 MakeCode Arcade 游戏。

## 何时用
- 用户想做 / 改 arcade 游戏、像素小游戏、makecode 游戏时。

## 怎么用
1. 起项目：`npx arcade-ai init <dir>`（已固化 4 个常见坑）。
2. 起 studio：在项目目录 `npx aca dev`，浏览器实时预览，AI 改 `game/main.ts` 自动刷新。
3. 协议自检：`npx aca check`（官方编辑器握手是否仍通）。

## 写代码规则
- 只改 `game/main.ts`；资源走 `game/assets.json`。
- 写前查随包 `reference/`：`arcade-api.md`（API）、`limits.md`（硬限制）、`pitfalls.md`（坑）、`project-format.md`（工程格式）。
- 不要臆造 arcade 不存在的 API。
