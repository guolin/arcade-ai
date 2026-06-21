# Playground 89 款游戏总结：设计模式、函数分工与 AI 参考

本文总结 `playground/` 中 89 个有效 `g_*` MakeCode Arcade 游戏项目的可复用经验。当前 `playground` 目录里实际有 96 个 `game/main.ts` 入口，但已有分析脚本 `playground/analyze-apis.mjs` 只扫描 `g_` 前缀项目，因此本文沿用 **89 款游戏样本** 这个口径。

用途：

- 给其他 AI 当游戏生成参考，减少臆造 API 和混乱结构。
- 给游戏设计者看真实项目里反复出现的玩法结构。
- 先作为独立总结文档保存，后续再考虑合并进 `reference/` 的短速查资料。

## 1. 样本整体印象

这 89 款游戏覆盖教学练习、经典街机、平台跳跃、射击、解谜、视觉模拟、体育、塔防、生存战斗和大型 RPG 式项目。它们共同说明一件事：Arcade 好游戏不是简单把精灵画出来，而是把 **Sprite、Tilemap、Controller、Game Loop、Timer、State、HUD、Assets** 组合成一个小型模拟系统。

代表性大项目：

| 项目 | 行数 | 主要价值 |
| :--- | ---: | :--- |
| `g_duat` | 8061 | 大型 RPG/冒险：tile 驱动生成、商店、Boss、状态条、存档、大量后台 fiber。 |
| `g_goober` | 6159 | 大型平台冒险：秘籍组合键、tile 事件、冷却、关卡物件、交互提示。 |
| `g_five_second_games` | 5897 | 五秒小游戏合集：快速重置、小游戏状态切换、自定义渲染。 |
| `g_zenith` | 2336 | 竞技/格斗：百分比伤害、多人控制、边缘检测、文本 HUD。 |
| `g_vampire` | 2180 | 类割草生存：sprite data 组件化、升级、持久化标记、多敌人和状态条。 |
| `g_planet_putt_putt` | 1836 | 物理运动：角度、蓄力、摩擦、球场、分数和最好成绩。 |
| `g_pvz2` | 1352 | 塔防行锁定和重复实体处理。 |
| `g_jetpack` | 1234 | 平台移动、镜头、滚动、计时器和能力道具。 |

## 2. API 使用热度

来自 `playground/analyze-apis.mjs` 的静态扫描：

| 命名空间 | 调用次数 |
| :--- | ---: |
| `sprites` | 1335 |
| `tiles` | 934 |
| `scene` | 675 |
| `music` | 451 |
| `timer` | 291 |
| `animation` | 212 |
| `info` | 171 |
| `story` | 101 |
| `statusbars` | 92 |
| `controller` | 91 |
| `textsprite` | 49 |

Top API：

| 排名 | API | 次数 | 说明 |
| :--- | :--- | ---: | :--- |
| 1 | `sprites.create` | 598 | 一切可交互对象都是 sprite：玩家、敌人、道具、判定框、UI 图标。 |
| 2 | `timer.after` | 192 | 延迟动作、冷却窗口、临时特效。 |
| 3 | `tiles.setTileAt` | 188 | 运行时改地图：开门、清除出生点、破坏砖块。 |
| 4 | `tiles.getTileLocation` | 181 | 网格坐标转世界位置。 |
| 5 | `sprites.onOverlap` | 166 | 不同对象类型之间的核心碰撞规则。 |
| 6 | `tiles.placeOnTile` | 150 | 把对象可靠放到地图格子中心。 |
| 7 | `animation.runImageAnimation` | 150 | 动作反馈和视觉状态。 |
| 8 | `sprites.destroy` | 147 | 生命周期清理。 |
| 9 | `scene.setTile` | 140 | 旧项目中较多，新项目优先参考当前 tilemap API。 |
| 10 | `music.play` | 136 | 操作反馈和游戏手感。 |
| 11 | `sprites.allOfKind` | 91 | 查询同类实体，用于 AI、伤害、清理、目标选择。 |
| 12 | `tiles.getTilesByType` | 89 | 用地图瓦片承载出生点和关卡元数据。 |
| 13 | `timer.background` | 84 | Boss、剧情、长序列行为的线性 fiber。 |
| 14 | `music.createSoundEffect` | 84 | 程序化音效。 |
| 15 | `sprites.createProjectileFromSprite` | 82 | 子弹、法术、投掷物。 |

## 3. 核心对象模型

多数好项目都可以拆成下面几层：

| 概念 | Arcade 工具 | 常见函数职责 |
| :--- | :--- | :--- |
| 角色/对象 | `sprites.create`, `SpriteKind` | 玩家、敌人、NPC、子弹、道具、触发器、判定框。 |
| 世界 | `tiles.setCurrentTilemap`, `scene` | 关卡布局、镜头、背景、墙壁碰撞、tile 事件。 |
| 输入 | `controller.*.onEvent`, `controller.moveSprite` | 移动、跳跃、攻击、菜单、秘籍、多人控制。 |
| 规则 | `game.onUpdate`, `game.onUpdateInterval`, `timer.*` | AI、计时、冷却、波次、模拟。 |
| 状态 | 全局变量、数组、`sprites.setData*`, `settings` | 血量、当前关卡、升级、Boss 阶段、存档。 |
| 反馈 | `info`, `statusbars`, `textsprite`, `music`, effects | HUD、血条、分数、对话、闪白、震屏。 |

优秀项目会把职责落到短函数里，例如 `loadLevel`、`spawnEnemy`、`takeDamage`、`startBoss`、`updateHud`、`openDoor`、`resetRound`。

## 4. 可复用架构模式

### 模式 1：把 Tilemap 当关卡数据

很多游戏不只用 tilemap 表示墙，还用特殊瓦片表示出生点、门、陷阱、NPC、目标点。

```typescript
function spawnEnemiesFromMap() {
    for (let loc of tiles.getTilesByType(assets.tile`enemySpawn`)) {
        const enemy = sprites.create(assets.image`enemy`, SpriteKind.Enemy)
        tiles.placeOnTile(enemy, loc)
        tiles.setTileAt(loc, assets.tile`transparency16`)
    }
}
```

好处：

- 设计者移动出生点时只改地图，不改代码。
- `tiles.setTileAt` 可以读取后清除标记瓦片。
- `scene.onOverlapTile` 和 `scene.onHitWall` 能让关卡规则贴近地图数据。

适用：平台跳跃、RPG 房间、塔防路线、潜入巡逻、解谜触发器。

### 模式 2：用 SpriteKind 表达碰撞契约

Arcade 的重叠事件按 kind 注册，不按实例注册。项目变大后，kind 应该表达玩法意义。

```typescript
namespace SpriteKind {
    export const PlayerAttack = SpriteKind.create()
    export const Pickup = SpriteKind.create()
    export const Trigger = SpriteKind.create()
}

sprites.onOverlap(SpriteKind.PlayerAttack, SpriteKind.Enemy, function (hitbox, enemy) {
    damageEnemy(enemy, 1)
    hitbox.destroy()
})
```

建议把子弹、近战判定框、陷阱、道具、NPC、隐形触发器分成不同 kind。不要在中大型游戏里把所有东西都塞进 `SpriteKind.Food` 或 `SpriteKind.Enemy`。

### 模式 3：用 Sprite Data 做轻量组件

`g_vampire` 这类项目会把敌人属性直接挂在 sprite 上。

```typescript
function configureEnemy(enemy: Sprite, hp: number, speed: number, damage: number) {
    sprites.setDataNumber(enemy, "hp", hp)
    sprites.setDataNumber(enemy, "speed", speed)
    sprites.setDataNumber(enemy, "damage", damage)
    sprites.setDataBoolean(enemy, "attackCooldown", false)
}

function damageEnemy(enemy: Sprite, amount: number) {
    const hp = sprites.readDataNumber(enemy, "hp") - amount
    sprites.setDataNumber(enemy, "hp", hp)
    if (hp <= 0) enemy.destroy(effects.disintegrate, 100)
}
```

这比 `enemyHealth[i]` 这类平行数组可靠。sprite 销毁后，数据也跟着消失，不容易错位。

### 模式 4：每个系统尽量一个更新入口

小项目可以有多个 `game.onUpdate`。大项目如果到处注册 update，很容易出现顺序问题。

推荐每个主要系统一个调度函数：

```typescript
game.onUpdate(function () {
    updateEnemies()
    updateWeapons()
    updateCameraRules()
})
```

不需要每帧执行的逻辑用 interval：

```typescript
game.onUpdateInterval(1000, function () {
    spawnWave()
})
```

不要在 `game.onUpdate` 中无条件注册 `timer.after`，否则每帧都会新增延迟回调。

### 模式 5：用后台 fiber 写长序列

复杂项目常用 `timer.background`，因为它能把 Boss、剧情和多阶段攻击写成顺序脚本。

```typescript
function startBossIntro(boss: Sprite) {
    timer.background(function () {
        boss.sayText("Ready?", 1000)
        pause(1000)
        scene.cameraShake(4, 500)
        pause(500)
        boss.vx = 80
    })
}
```

适合：

- Boss 阶段。
- 剧情演出。
- 商店或 NPC 提示。
- 多段延迟攻击。

不适合：

- 给每个普通敌人启动无限后台 fiber。
- 在会重复触发的 overlap 里直接 `pause`，却没有冷却或锁。

### 模式 6：视觉和攻击判定分离

动作/格斗游戏常用短生命周期的隐形 sprite 做攻击判定框。

```typescript
function meleeAttack(player: Sprite, facingRight: boolean) {
    const hitbox = sprites.create(image.create(12, 14), SpriteKind.PlayerAttack)
    hitbox.setFlag(SpriteFlag.Invisible, true)
    hitbox.setPosition(player.x + (facingRight ? 14 : -14), player.y)
    hitbox.lifespan = 120
}
```

这样动画大小、攻击范围、判定持续时间可以独立调整。

### 模式 7：自定义 HUD 用 RelativeToCamera

自定义 HUD 元素如果要固定在屏幕上，使用 `SpriteFlag.RelativeToCamera`。

```typescript
const prompt = textsprite.create("A")
prompt.setFlag(SpriteFlag.RelativeToCamera, true)
prompt.setPosition(150, 10)
```

标准分数、生命、倒计时优先用 `info`。只有内置 HUD 不够时，再用 `textsprite` 和 `statusbars`。

### 模式 8：只保存小型进度数据

项目常用 `settings` 保存最高分、是否看过开场、是否通关、解锁关卡、难度。

```typescript
function saveProgress(level: number) {
    settings.writeNumber("level", level)
}

function loadProgress() {
    return settings.readNumber("level") || 0
}
```

建议只存数字、字符串、布尔值。数组可以序列化，但不要无必要保存整个世界状态。

## 5. 常见玩法结构

### 平台跳跃

核心函数：

- `makePlayer`：创建玩家、设置重力、镜头跟随。
- `jump`：用 `isHittingTile(CollisionDirection.Bottom)` 判断是否能跳。
- `loadLevel`：设置地图、放置玩家、生成道具和敌人。
- `handleHazards`：用 `scene.onOverlapTile` 处理尖刺、岩浆、出口，并加冷却。

核心 API：

```typescript
controller.moveSprite(player, 100, 0)
player.ay = 350
scene.cameraFollowSprite(player)
```

### 射击

核心函数：

- `shoot`：从玩家创建 projectile。
- `spawnEnemy`：从屏幕边缘或地图标记生成敌人。
- `damageEnemy`：处理子弹和敌人重叠。
- `cleanupWave`：清理旧子弹和离场实体。

核心 API：

```typescript
sprites.createProjectileFromSprite(assets.image`bullet`, player, 100, 0)
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, onHit)
```

### 塔防

核心函数：

- `placePlant(col, row)`。
- `spawnZombie(row)`。
- `updatePlants`：找同一行敌人。
- `advanceWave`。

常用技巧：把行号存进 `sprite.z` 或 sprite data，只攻击同行敌人。

### 生存割草

核心函数：

- `spawnEnemyWave`。
- `updateEnemyFollowers`。
- `dealAreaDamage`。
- `levelUp`。
- `chooseUpgrade`。

关键是批处理：定期生成和更新敌人，避免每帧创建大量临时对象。

### 解谜和模拟

核心函数：

- `readGrid`。
- `stepSimulation`。
- `drawGrid`。
- `reset`。

这类游戏常用 `game.onPaint`、自定义 `Image` 绘制，或把 tilemap 当网格。大网格要把模型数据和显示逻辑分开。

### 小游戏合集

核心函数：

- `startMinigame(id)`。
- `clearMinigame`。
- `setWinCondition`。
- `nextMinigame`。

规则：每个小游戏都必须清理自己创建的 sprite、timer 影响和全局状态。

## 6. 给 AI 的函数设计模板

让 AI 写新 Arcade 游戏时，可以要求它使用这个骨架：

```typescript
namespace SpriteKind {
    export const Pickup = SpriteKind.create()
    export const PlayerAttack = SpriteKind.create()
}

let player: Sprite = null
let currentLevel = 0

function initGame() {
    info.setScore(0)
    info.setLife(3)
    loadLevel(0)
}

function loadLevel(level: number) {
    currentLevel = level
    tiles.setCurrentTilemap(assets.tilemap`level1`)
    createPlayer()
    spawnFromTiles()
}

function createPlayer() {
    player = sprites.create(assets.image`player`, SpriteKind.Player)
    controller.moveSprite(player, 100, 0)
    player.ay = 350
    scene.cameraFollowSprite(player)
}

function spawnFromTiles() {
    for (let loc of tiles.getTilesByType(assets.tile`coinSpawn`)) {
        const coin = sprites.create(assets.image`coin`, SpriteKind.Pickup)
        tiles.placeOnTile(coin, loc)
        tiles.setTileAt(loc, assets.tile`transparency16`)
    }
}

function registerEvents() {
    sprites.onOverlap(SpriteKind.Player, SpriteKind.Pickup, function (player, pickup) {
        pickup.destroy()
        info.changeScoreBy(1)
    })
}

registerEvents()
initGame()
```

这个结构的好处：

- 初始化和事件注册分开。
- 关卡加载负责地图和出生。
- 事件里调用命名函数，不把所有逻辑塞进匿名回调。
- AI 后续加功能时有明确位置。

## 7. 给其他 AI 的提示词要点

让其他 AI 写或改 Arcade 游戏时，建议明确要求：

- 只使用 `reference/arcade-api.md` 中存在的 API。
- 全部玩法逻辑写在 `game/main.ts`。
- 自定义 `SpriteKind` 写在顶层 `namespace SpriteKind`。
- 已有资源用 `assets.image\`name\``、`assets.tilemap\`name\`` 引用。
- 出生点优先使用 `tiles.getTilesByType`，不要硬编码大量坐标。
- 每个 sprite 的属性用 `sprites.setData*`，不要用平行数组。
- 生成、冷却、周期 AI 用 `game.onUpdateInterval`。
- Boss、剧情、长序列用 `timer.background`，普通模拟逻辑不要滥用。
- 切关时清理旧 sprite。
- 不使用浏览器/Node API、Promise、DOM、fetch、动态 JS 特性。

## 8. 样本中暴露的技术债

真实游戏很有价值，因为它们也暴露了常见问题：

- 全局变量过多，导致重开和切关容易坏。
- `game.onUpdate` 太多，执行顺序不清楚。
- tile 事件大量复制粘贴，后期维护困难。
- UI 每 1ms 更新通常是浪费，应该按变化或合理间隔刷新。
- 旧项目里有 `scene.setTileMap`、`scene.setTile` 等旧 API，新项目应优先参考 `reference/arcade-api.md`。
- 大量内联图片塞在 `main.ts` 中，会让 AI 很难改代码。
- overlap 持续触发，伤害必须有冷却、无敌帧、`timer.debounce` 或标记位。

## 9. 推荐阅读顺序

给 AI：

1. `reference/arcade-api.md`
2. `reference/pitfalls.md`
3. `reference/patterns.md`
4. 本文档

给人：

1. `docs/makecode-arcade-design-tutorial.md`
2. 本文档
3. `reference/patterns.md`
4. `reference/arcade-api.md`
