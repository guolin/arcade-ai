# 给 AI 的项目规则：MakeCode Arcade 游戏

- 游戏代码只写在 `game/main.ts`；资源（精灵/地图，4-bit 16 色）走 `game/assets.json`，不要内联大图到 JS.
- 改完代码后 `aca dev` 的页面会自动刷新预览；无需手动操作。
- 严守 MakeCode Arcade 限制：见随包 `reference/limits.md`；API 速查见 `reference/arcade-api.md`。
- 不要改 `game/pxt.json` 的 `files` 数组、不要清空 `assets.json`（必须是合法 JSON）。
- 不确定 API 时查 `reference/`，不要臆造不存在的 arcade API。
