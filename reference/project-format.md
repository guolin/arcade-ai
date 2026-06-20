# MakeCode Arcade Project Format Reference

本文档介绍了 Microsoft MakeCode Arcade (PXT) 项目的工程格式与文件结构，包括核心配置文件、资源存储模式、自动生成的 TypeScript 代码以及开发时遵守的白名单机制。

## 1. 核心配置文件

- **`pxt.json`**：
  项目的包管理器和工程说明书。它声明了项目的名称、依赖的库和编译的入口文件。
  * `name`：项目名称。
  * `dependencies`：外部包依赖。默认包含 `"device": "*"` 代表核心 API。
  * `files`：非常关键！列出了该项目参与编译的所有文件列表。加了 tilemap/命名资源后，
    编辑器会自动把生成的 `*.g.ts` 加进这里——同步时要原样带回（见第 3 节）。
  * `preferredEditor`：首选编辑器类型。本项目是纯 TS 工作流，应为 `"tsprj"`（JavaScript 视图）。
    **不要用 `blocksprj`**，否则编辑器开在空白积木视图、看不到 `main.ts` 代码（见 pitfalls 坑3）。

- **`assets.json`**：
  在 MakeCode 项目中用来存放用户设计的所有美术资源（图像、精灵图、瓦片、瓦片图、动画等）。
  * 必须是一个合法的 JSON 对象，内容不得为空。即使没有资源也应初始化为 `"{}"`。
  * 其中的美术资源使用类似 F4（MakeCode 资源版本格式）的结构表示。图像在底层会被编译为 `Image` 字面量。

## 2. 自动生成的 TS 文件 (`*.g.ts`)

当在编辑器的 Assets 管理面板中设计或导入图片、瓦片图后，编辑器在自动保存时会在内存中或输出的工程里动态生成相关的 TypeScript 代码接口：

- **`images.g.ts`**：
  自动生成美术精灵图（Sprite Images）的声明。例如，在 assets 面板建了一个叫 `hero` 的精灵图，它会在代码中生成类似：
  ```typescript
  namespace myImages {
      export const hero = img`...`;
  }
  ```
  在代码中可通过 `assets.image`hero`` 直接引用。

- **`tilemap.g.ts`**：
  声明编辑的瓦片地图（Tilemap）以及关联的图块（Tiles）。它将复杂的二维图块数组序列化，并暴露常量（如 `tilemap`level1``）。

*注意*：这些 `*.g.ts`（以及 tilemap 关联的 `*.g.jres`）是编辑器生成的、AI 不应手改的代码，
但**必须参与同步**——否则在编辑器里画的地图/命名资源会丢失。`arcade-ai` 会自动往返这些文件。

## 3. `arcade-ai` 工程同步规则（按扩展名，非固定名单）

本地双向实时同步**不再用固定文件名白名单**（旧版只认 6 个文件，会把 tilemap 生成的
`*.g.ts` / `*.g.jres` 丢掉，导致地图存不住）。现在 `project-io` 按**扩展名**动态同步项目根下
所有项目文件：

- **同步的扩展名**：`.ts`、`.js`、`.json`、`.md`、`.blocks`、`.jres`、`.txt`。
  涵盖 `main.ts`、`pxt.json`、`assets.json`、`README.md`、以及 `tilemap.g.ts`、`tiles.g.jres`
  等动态生成文件。
- **自动排除**：
  - 目录 `pxt_modules` / `built` / `node_modules` / `.git`（依赖与产物）。
  - 隐藏文件（`.gitignore`、`.env` 等）。
  - 其它扩展（`.sh`、`.png`、二进制等）。
  - 带路径分隔或 `..` 的名字（防目录遍历，只接受项目根下的纯文件名）。

这样地图、命名精灵等会生成额外文件的功能都能完整往返，同时仍挡住危险/冗余文件。
