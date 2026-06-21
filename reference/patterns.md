# MakeCode Arcade 真实游戏模式速查

本文件是从 `playground/` 中 89 个有效 `g_*` 游戏提炼出的短速查。这里保持精简，便于 AI 复制参考；长解释见 `docs/playground-89-game-analysis.md` 和 `docs/makecode-arcade-design-tutorial.md`。

## 先用这个对象模型

| 概念 | Arcade 工具 | 常见函数 |
| :--- | :--- | :--- |
| 游戏对象 | `sprites.create`, `SpriteKind` | `createPlayer`, `spawnEnemy`, `spawnPickup` |
| 地图世界 | `tiles`, `scene` | `loadLevel`, `spawnFromMap`, `openDoor` |
| 输入 | `controller` | `jump`, `shoot`, `interact`, `attack` |
| 规则循环 | `game.onUpdate`, `game.onUpdateInterval`, `timer` | `updateEnemies`, `spawnWave`, `startBoss` |
| 状态 | 全局变量、`sprites.setData*`, `settings` | `damageEnemy`, `saveProgress`, `loadProgress` |
| 反馈 | `info`, `statusbars`, `textsprite`, `music`, effects | `updateHud`, `showPrompt`, `playHitFeedback` |

## 89 款游戏 API 热点

最常出现的设计支点：`sprites.create`、`tiles.setTileAt`、`tiles.getTileLocation`、`sprites.onOverlap`、`tiles.placeOnTile`、`animation.runImageAnimation`、`sprites.destroy`、`sprites.allOfKind`、`tiles.getTilesByType`、`timer.background`、`sprites.createProjectileFromSprite`。

含义：

- 互动对象优先建成 sprite，不要用抽象数据假装对象。
- 出生点、门、陷阱、出口优先放进 tilemap，再用 `tiles.getTilesByType` 读取。
- 碰撞规则优先通过 `SpriteKind` 和 `sprites.onOverlap` 表达。
- 延迟和冷却用 `timer.after` / `timer.debounce`；周期逻辑用 `game.onUpdateInterval`。
- Boss、剧情、多段攻击用 `timer.background` 写成顺序脚本。

## 架构规则

主要系统用命名函数：

```typescript
function loadLevel(level: number) {}
function spawnEnemies() {}
function damageEnemy(enemy: Sprite, amount: number) {}
function updateEnemies() {}
```

每个系统尽量一个 update 调度入口：

```typescript
game.onUpdate(function () {
    updateEnemies()
    updateProjectiles()
    updateHud()
})
```

周期任务用 interval：

```typescript
game.onUpdateInterval(1000, function () {
    spawnWave()
})
```

不要在 `game.onUpdate` 中无保护地创建 `timer.after`。

## 稳定起步骨架

```typescript
namespace SpriteKind {
    export const Pickup = SpriteKind.create()
}

let player: Sprite = null

function createPlayer() {
    player = sprites.create(assets.image`player`, SpriteKind.Player)
    controller.moveSprite(player, 100, 0)
    player.ay = 350
    scene.cameraFollowSprite(player)
}

function loadLevel(level: number) {
    sprites.destroyAllSpritesOfKind(SpriteKind.Enemy)
    sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
    tiles.setCurrentTilemap(assets.tilemap`level1`)
    createPlayer()
    spawnFromMap()
}

function spawnFromMap() {
    for (let loc of tiles.getTilesByType(assets.tile`pickupSpawn`)) {
        const pickup = sprites.create(assets.image`pickup`, SpriteKind.Pickup)
        tiles.placeOnTile(pickup, loc)
        tiles.setTileAt(loc, assets.tile`transparency16`)
    }
}

sprites.onOverlap(SpriteKind.Player, SpriteKind.Pickup, function (player, pickup) {
    pickup.destroy()
    info.changeScoreBy(1)
})
```

## 模式：平台跳跃移动

```typescript
controller.moveSprite(player, 100, 0)
player.ay = 350
player.fx = 80

controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (player.isHittingTile(CollisionDirection.Bottom)) {
        player.vy = -180
    }
})

controller.A.onEvent(ControllerButtonEvent.Released, function () {
    if (player.vy < -80) player.vy = -80
})
```

## 模式：Tilemap 出生点

```typescript
function spawnFromMap() {
    for (let loc of tiles.getTilesByType(assets.tile`enemySpawn`)) {
        const enemy = sprites.create(assets.image`enemy`, SpriteKind.Enemy)
        tiles.placeOnTile(enemy, loc)
        tiles.setTileAt(loc, assets.tile`transparency16`)
    }
}
```

出生点、道具、门、NPC、陷阱、出口都可以用特殊 tile 表示。

## 模式：Sprite Data 组件

```typescript
function configureEnemy(enemy: Sprite) {
    sprites.setDataNumber(enemy, "hp", 5)
    sprites.setDataNumber(enemy, "damage", 1)
    sprites.setDataString(enemy, "state", "patrol")
}

function damageEnemy(enemy: Sprite, amount: number) {
    const hp = sprites.readDataNumber(enemy, "hp") - amount
    sprites.setDataNumber(enemy, "hp", hp)
    if (hp <= 0) enemy.destroy(effects.disintegrate, 100)
}
```

每个 sprite 自己的属性放在 sprite data 中，不要用平行数组。

## 模式：Overlap 伤害冷却

```typescript
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (player, enemy) {
    timer.debounce("playerDamage", 800, function () {
        info.changeLifeBy(-1)
        scene.cameraShake(3, 150)
    })
})
```

重叠事件会在接触期间持续触发。

## 模式：临时近战判定框

```typescript
namespace SpriteKind {
    export const PlayerAttack = SpriteKind.create()
}

function meleeAttack(attacker: Sprite, facingRight: boolean) {
    const hitbox = sprites.create(image.create(12, 14), SpriteKind.PlayerAttack)
    hitbox.setFlag(SpriteFlag.Invisible, true)
    hitbox.setPosition(attacker.x + (facingRight ? 14 : -14), attacker.y)
    hitbox.lifespan = 120
}

sprites.onOverlap(SpriteKind.PlayerAttack, SpriteKind.Enemy, function (hitbox, enemy) {
    damageEnemy(enemy, 1)
    hitbox.destroy()
})
```

## 模式：发射子弹

```typescript
controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    const projectile = sprites.createProjectileFromSprite(assets.image`bullet`, player, 120, 0)
    projectile.setFlag(SpriteFlag.DestroyOnWall, true)
})

sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (projectile, enemy) {
    projectile.destroy()
    damageEnemy(enemy, 1)
})
```

## 模式：Boss 或剧情 fiber

```typescript
function startBossSequence(boss: Sprite) {
    timer.background(function () {
        boss.sayText("Phase 1", 1000)
        pause(1000)
        boss.vx = 60
        pause(2000)
        scene.cameraShake(5, 500)
        boss.sayText("Phase 2", 1000)
    })
}
```

`timer.background` 适合顺序脚本，不适合替代普通每帧模拟。

## 模式：固定屏幕 HUD

```typescript
const prompt = textsprite.create("A")
prompt.setFlag(SpriteFlag.RelativeToCamera, true)
prompt.setPosition(150, 10)
```

标准 HUD 优先用 `info`，自定义文字再用 `textsprite`。

## 模式：绑定到精灵的状态条

```typescript
let hp = statusbars.create(20, 4, StatusBarKind.Health)
hp.max = 100
hp.value = 100
hp.attachToSprite(enemy)
```

适合敌人血条、Boss 血条、体力、蓄力和经验。

## 模式：保存小型进度

```typescript
function saveProgress(level: number) {
    settings.writeNumber("level", level)
}

function loadProgress(): number {
    return settings.readNumber("level") || 0
}
```

`settings` 适合最高分、已解锁关卡、难度、看过开场、通关标记。

## 模式：塔防同行锁定

```typescript
function placePlant(col: number, row: number) {
    const plant = sprites.create(assets.image`plant`, SpriteKind.Player)
    tiles.placeOnTile(plant, tiles.getTileLocation(col, row))
    sprites.setDataNumber(plant, "row", row)
}

game.onUpdateInterval(1000, function () {
    for (let plant of sprites.allOfKind(SpriteKind.Player)) {
        const row = sprites.readDataNumber(plant, "row")
        for (let enemy of sprites.allOfKind(SpriteKind.Enemy)) {
            if (sprites.readDataNumber(enemy, "row") == row && enemy.x > plant.x) {
                sprites.createProjectileFromSprite(assets.image`pea`, plant, 80, 0)
                break
            }
        }
    }
})
```

## 模式：切关清理

```typescript
function clearLevelSprites() {
    sprites.destroyAllSpritesOfKind(SpriteKind.Enemy)
    sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
}

function loadLevel(level: number) {
    clearLevelSprites()
    tiles.setCurrentTilemap(assets.tilemap`level1`)
    spawnFromMap()
}
```

切关时先清理旧对象，再生成新对象。

## 按玩法选模式

| 玩法 | 必选系统 | 关键模式 |
| :--- | :--- | :--- |
| 平台跳跃 | 重力、落地检测、tile 陷阱、镜头 | 平台跳跃移动、Tilemap 出生点、Overlap 冷却 |
| 射击 | projectile、敌人波次、命中反馈 | 发射子弹、Sprite Data 组件、切关清理 |
| 塔防 | 网格/行、周期目标选择、敌人血量 | Tilemap 出生点、塔防同行锁定、状态条 |
| 生存割草 | 大量敌人、升级、周期刷怪 | Sprite Data 组件、interval 调度、状态条、存档 |
| RPG/冒险 | 多房间、NPC、商店、门、Boss | Tilemap 关卡数据、HUD、Boss fiber、存档 |
| 小游戏合集 | 快速重置、状态切换、倒计时 | 命名函数、切关清理、interval、`info.startCountdown` |

## 给 AI 的生成要求

- 先查 `reference/arcade-api.md` 和 `reference/pitfalls.md`，不要凭经验猜 API。
- 只改 `game/main.ts`；资源文件和生成文件按 `reference/project-format.md` 处理。
- 自定义 `SpriteKind` 必须写在顶层 `namespace SpriteKind`。
- 已有素材用 `assets.image\`name\``、`assets.tile\`name\``、`assets.tilemap\`name\``。
- 每个主要系统写命名函数，避免把全部逻辑塞进事件回调。
- 每个 sprite 自己的属性用 `sprites.setData*`，不用平行数组。
- 切关、重开、小游戏切换前清理旧 sprite。
- overlap 造成伤害、得分、开门时必须考虑重复触发。

## 避免的技术债

- 用平行数组保存 sprite 属性。
- 很多无关 `game.onUpdate` 同时改同一批状态。
- 每帧无保护调用 `timer.after`。
- overlap 伤害没有冷却。
- UI 每 1ms 刷新。
- 大量复制粘贴 tile handler。
- 使用 `fetch`、`window`、DOM、`Promise`、`async/await` 等浏览器或 Node API。
- 正常开发时手改 `images.g.ts`、`images.g.jres`、`tilemap.g.ts`、`tilemap.g.jres`。
