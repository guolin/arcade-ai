# arcade-ai

AI-driven scaffold and live studio for Microsoft MakeCode Arcade games.

## 安装与集成方式 (Installation & Integration)

### 1. Claude Code 插件市场 (Claude Code plugin marketplace)
你可以在 Claude Code plugin marketplace 中搜索并安装 `arcade-ai`。安装后即可在与 AI 对话时使用对应的技能，帮助生成和实时验证 MakeCode Arcade 游戏代码。

### 2. Trae 智能辅助工具 (.trae)
如果你使用 Trae，请将技能配置添加到 `.trae` 相关的规则路径中。初始化脚手架时通过指定 `--tool trae` 会在项目根目录下自动创建 `.trae/project_rules.md`。

### 3. AI 代理常规配置 (AGENTS.md)
对于通用的 AI 代理（如 Cline 或 Cursor 等），会在初始化时生成 `AGENTS.md` 文件。该文件定义了只修改 `game/main.ts`、严守 MakeCode Arcade 的 4 个约束、不可臆造 API 等核心规则，请确保将此规则导入你的 AI Agent 配置中。

## 使用方法 (Usage)

1. **项目初始化**：
   ```bash
   npx aca init <your-game-dir> [--tool claude|trae|agents]
   ```
2. **启动本地 Studio 双向实时预览服务**：
   ```bash
   cd <your-game-dir>
   npx aca dev
   ```
3. **自检 postMessage 协议状态**：
   ```bash
   npx aca check
   ```
