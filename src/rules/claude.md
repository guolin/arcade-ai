# 给 AI 的项目规则：MakeCode Arcade 游戏

- 游戏代码只写在 `game/main.ts`；资源（精灵/地图，4-bit 16 色）走 `game/assets.json`，不要内联大图到 JS。
- 这是**纯 TypeScript 项目**：`game/` 里**不要**有 `main.blocks`，`pxt.json` 的 `files` 也不要列它（否则官方编辑器会开在空白积木视图，看不到你的代码）。
- 改完代码后 `aca dev` 的页面会自动刷新预览；无需手动操作。
- **精灵**用内联 `img\`\``，AI 直接写。
- **地图**有两条可靠路线，二选一（细节见 `reference/arcade-api.md` 第7节 / `reference/pitfalls.md` 坑5）：
  1. 命名地图 `tiles.setTilemap(tilemap\`level\`)`——编辑器自动建空地图，人在网页里画好后同步回磁盘；
  2. `tiles.createTilemap(...)` + **内置图块**（如 `sprites.castle.tileGrass1`），图块用自带图库。
  - ❌ **千万别**把内联 `img` 当图块塞进 `createTilemap`——会让编辑器崩溃（已实测）。
- 不确定图块/API 名字时查 `reference/` 或编辑器图库，不要臆造不存在的 arcade API。
- 不要清空 `assets.json`（必须是合法 JSON，空资源写 `{}`），也不要手写 `tilemap.g.jres`（编辑器生成）。
