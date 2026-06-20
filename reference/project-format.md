# MakeCode Arcade Project Format Reference

本文档介绍了 Microsoft MakeCode Arcade (PXT) 项目的工程格式与文件结构，包括核心配置文件、资源存储模式、自动生成的 TypeScript 代码以及开发时遵守的白名单机制。

## 1. 核心配置文件

- **`pxt.json`**：
  项目的包管理器和工程说明书。它声明了项目的名称、依赖的库和编译的入口文件。
  * `name`：项目名称。
  * `dependencies`：外部包依赖。默认包含 `"device": "*"` 代表核心 API。
  * `files`：非常关键！列出了该项目参与编译的所有文件列表。
  * `preferredEditor`：首选编辑器类型。在我们做同步时应为 `"blocksprj"`（积木加代码模式）。

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

*注意*：虽然这些 `*.g.ts` 文件在官方编辑器内部会被动态加入编译，但在本地 `arcade-ai` 的工程中，我们不需要（也不应该）手动修改这些生成出来的只读代码。

## 3. `arcade-ai` 工程读写白名单

由于我们采用无服务的本地双向实时同步架构，为了安全并避免冗余文件产生，`arcade-ai` (ACA) CLI 的底层 `project-io` 模块使用了严格的**文件白名单**机制。

所有的读（`readProject`）和写（`writeProject`）都只能操作以下白名单内的六个文件（顺序是固定的）：
1. **`README.md`**：项目的使用与玩法说明文档。
2. **`main.ts`**：游戏编写的主 TypeScript/JavaScript 文件。
3. **`main.blocks`**：存储图形化积木位置和连接信息的 XML 文件。
4. **`pxt.json`**：项目工程配置。
5. **`assets.json`**：美术及瓦片图资源数据。
6. **`test.ts`**：项目的测试入口（非必须，但支持）。

任何不在该白名单中的文件（如临时文件、宿主配置或 `.env` 环境变量文件）均会被 `arcade-ai` 在与编辑器交互时自动过滤，这保障了本地和编辑器内存工作区的整洁性。
