# MakeCode Arcade AI Studio — 设计文档

日期：2026-06-20
状态：已通过 brainstorming，待评审

## 1. 目标

让学生用 AI（Claude Code 等）开发 Microsoft MakeCode Arcade 游戏：AI 在本地写
TypeScript 代码与资源，本地一个网页 iframe 嵌入**官方** `arcade.makecode.com`，通过
`postMessage` 实现本地磁盘项目与官方编辑器之间的**实时双向同步**。学生在网页里即时
看到游戏运行，也能在 UI 里改精灵/地图并回写磁盘；项目是标准 pxt 工程，可 git、可导入
MakeCode 云端。

交付物是一个 **Skill**，让安装者快速起脚手架、准确查文档、不走弯路。

### 成功标准
- 安装 skill 后，一条命令生成可运行脚手架。
- `npm run studio` 起本地小服务，打开网页即看到官方编辑器加载本地游戏。
- AI 改 `game/main.ts` → 网页自动刷新、游戏更新（无需手动操作）。
- 学生在编辑器 UI 里改代码/精灵/地图 → 自动回写本地磁盘文件。
- skill 内置精简参考手册，AI 能据此写出符合 arcade 限制的代码、避开已知坑。

## 2. 关键事实与既有验证（来自 spike）

- **协议选定 `workspacesync`（host 模式）**：spike 的 `spike/index.html` + `spike/host.js`
  已跑通。本地服务充当 MakeCode 的"存储后端"，握手消息 `pxthost` /
  `workspacesync` / `workspacesave`。
- **不采用** README 里的 `controller`/`writecode` 路径——spike 未验证过。
- **手动刷新页面即可把本地改动推进编辑器**（采坑指南第 3.3 节已验证）。因此"AI 改文件
  → 自动进游戏"的兜底（程序化 reload iframe）是**已验证、零风险**的。
- **不用 `pxt serve` 全套**：太重太脆，且目标是线上 iframe，本地编译链非必需。

### 必须固化进模板的 4 个坑（采坑指南）
1. `assets.json` 必须是合法 `"{}"`，不能是空文件。
2. `pxt.json` 的 `files[]` 必须列全 `README.md` / `main.ts` / `main.blocks` /
   `assets.json`。
3. 推送给编辑器的 header 用 `editor: "blocksprj"`。
4. iframe.src 用根域名 `https://arcade.makecode.com/?controller=1`，不带 `index.html`。

## 3. 架构：两层（Skill + 单一 npm 包）

1. **Skill**（核心，装进 Claude Code）= 知识 + 编排：精简参考手册，以及教 AI"写哪、怎么
   起 studio、怎么查手册、遵守哪些限制、何时跑 check"的 SKILL.md / AGENTS.md。skill **不
   重复实现任何逻辑**，只调下面这个包的命令——单一事实源就是这个包。
2. **单一 npm 包 `arcade-ai`**（CLI 命令 `aca`）= 脚手架模板 + studio 服务 + 自检，一个
   包全包。命令只有三个：

   | 命令 | 作用 |
   |------|------|
   | `aca init [dir]` | 起脚手架：**纯拷贝静态模板**，4 个坑预置好。不装 pxt、不跑本地编译。 |
   | `aca dev` | 起 studio：watch `game/` + 宿主页 + SSE + iframe 嵌官方编辑器。开发循环。 |
   | `aca check` | 自检探针：puppeteer 跑握手 + save 往返，确认协议仍通。 |

   命名：包名 `arcade-ai` 直白可搜（arcade + ai）；`makecode` 不进包名（微软商标），只放
   `description` / `keywords`。CLI 短命令 `aca`（ArCade Ai）。

> 取舍：原先拆"运行时包 + CLI 薄壳"两个包是过度设计，合并为单包。把分层落在"知识
> (skill) / 实现(npm 包)"，而非在"脚手架 or CLI"里二选一。

### 稳定性来源
- **编译在官方浏览器编辑器里，不在本地** → 本地 `game/` 不需要 `pxt_modules`、无本地编译
  工具链 → `init` 只是文件拷贝，**无原生依赖、无版本地狱**。
- **skill 锁定精确版本**（`npx arcade-ai@x.y.z`）→ MakeCode 改 postMessage 契约也不会静默
  冲垮学生；升级是主动的，且升级前用 `check` 把关。
- 发布：公开发布到 npm，走 semver。

## 4. 脚手架产出结构

```
my-game/
  game/                 # 标准 pxt 工程，可 git、可导入云端
    main.ts             # AI 主要写这里
    pxt.json            # files[] 已列全（避坑 2）
    main.blocks         # 合法空积木
    assets.json         # "{}"（避坑 1）；精灵/地图（4-bit 16 色）作为独立资源存这里
    README.md
  package.json          # devDependencies: arcade-ai；scripts.dev = "aca dev"
  AGENTS.md             # 给 AI 的项目规则：写哪、限制、怎么验证
```

资源策略（确认为方案 A）：精灵和地图是 4-bit 16 色资源，作为**独立文件**存在
（`assets.json` + pxt 自动生成的 `*.g.ts` / `.g.jres`），不内联进 JS，**坚决不引入 PNG**。
全量目录同步天然覆盖。

## 5. 核心实时双向同步链路

本地服务（默认 :8080）：
- 托管宿主页 `index.html`。
- **watch `game/` 整个目录**。
- `GET /api/project` → 读取 `game/` 下所有项目文件。
- `POST /api/save` → 把编辑器回传的文件**全量写回** `game/`（含 `assets.json`，即 UI 里
  画的精灵/地图）。
- `GET /events`（SSE）→ 文件变化时通知页面。

流程：
1. 页面 iframe → `https://arcade.makecode.com/?controller=1`。
2. 收到 `workspacesync` 握手 → 拉 `/api/project` → 按 spike 已验证格式推回
   （header `editor: "blocksprj"`）。
3. AI 改 `game/` 任意文件 → watcher 触发 → SSE 通知 → 页面**程序化 reload iframe**
   （= 自动版的手动刷新，已验证路径），重走握手加载最新代码。
4. 编辑器里手改代码/精灵/地图 → `workspacesave` → `POST /api/save` → 落盘。**双向。**

> v2 优化（非第一版）：用握手后的"二次推送"替代整页 reload，省刷新、更顺滑。第一版不做。

## 6. 自检探针

沿用 spike 的 `test-host.js`（puppeteer）：装完 / 按需跑一次，确认 ① workspacesync 握手
完成 ② 一次 save 能往返落盘。MakeCode 若改动无 SemVer 承诺的 postMessage 契约，几秒内
暴露，避免学生对白屏。

## 7. 内置精简参考手册（`reference/`）

- `arcade-api.md`：sprites / controller / game / tilemap / music 高频 API 速查。
- `limits.md`：内存、sprite 数量、图片尺寸、不支持的 JS 特性等硬限制。
- `pitfalls.md`：第 2 节的 4 个坑 + postMessage 协议契约（字段格式）。
- `project-format.md`：`pxt.json` 的 `files[]`、`assets.json` 格式、`.g.ts` 生成规则。

策略：内置精简手册打底（最稳、离线可用）；需要深入时再按需抓官方原文（v2）。

## 8. 第一版范围（YAGNI）

**做**：两层结构（skill + `arcade-ai` 单包）、全量目录双向同步（含资源文件）、SSE→自动
reload iframe、4 坑固化进模板、内置精简参考手册、自检探针、`aca init` 多格式规则文件
生成、GitHub README 分工具安装片段。

**不做（留 v2）**：握手后二次推送优化、实时抓官方文档、PNG→img 调色板转换器。

## 9. 分发与跨工具可移植

核心价值放在**工具无关**的两块，各家的 "skill" 只是薄适配层：

1. **npm 包 `arcade-ai`（CLI `aca`）** —— 任何能跑 shell 的 agent 都能用，零平台绑定。
2. **一套工具无关的参考 markdown**（第 7 节 `reference/`）。

**`aca init` 顺手生成对应工具的项目规则文件**（同一份内容，多格式输出）：

| 目标工具 | skill 放置 | 项目规则文件 | 安装方式 |
|----------|-----------|-------------|---------|
| Claude Code | `~/.claude/skills/`（可全局） | `CLAUDE.md` | 插件市场 `/plugin marketplace add <repo>` |
| Trae | `.trae/skills/<name>/SKILL.md`（项目级） | `project_rules.md` | Trae 添加 skill 流程 |
| 通用兜底 / WorkBuddy | —（直接读规则文件） | `AGENTS.md` | 让 agent 读 `AGENTS.md` + `reference/` |

要点：
- `SKILL.md` 格式 Claude Code 与 Trae 通用，**内容可复用**，只是放置目录与安装入口不同。
- **没有"贴链接全平台通吃"的安装**；每个工具按自己方式装。Claude Code 主路径是插件市场
  （持久、每会话自动加载）；bootstrap 引导词可作可选快捷入口，但本质是执行安装脚本，且
  只有真写进 skill 目录才对后续会话持久。
- WorkBuddy（项目方自有 agent 平台）机制由其自定，建议直接复用工具无关核心：读 `AGENTS.md`
  + `reference/`，调 `aca`。

GitHub 仓库 README「使用方法」据此给出**分工具的安装片段**，而非单一链接。

## 10. 待办风险

- MakeCode postMessage 契约无正式版本承诺 → 靠自检探针缓解。
- `game/` 全量回写需做并发/覆盖保护：编辑器回写与 AI 写盘可能撞车，需约定写盘时机
  （如 save 时短暂忽略自身触发的 watcher 事件），实现阶段细化。
