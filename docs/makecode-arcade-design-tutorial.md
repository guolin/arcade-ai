# MakeCode Arcade 游戏设计教程

这是一份给个人阅读的 MakeCode Arcade 游戏设计教程。它先解释 Arcade 的核心概念，再说明如何把一个游戏想法拆成代码结构。

## 1. Arcade 的基本心智模型

MakeCode Arcade 游戏可以理解为一个运行在 **160 x 120 像素屏幕**上的小型模拟系统。它主要由这些部分组成：

- Sprite：会移动、会碰撞、有图片、有类型的游戏对象。
- Scene：当前世界，包括背景、镜头、tilemap 和渲染层。
- Tilemap：网格化关卡，负责地形、墙壁和很多关卡数据。
- Controller：按键和方向输入。
- Info：内置 HUD，显示分数、生命、倒计时、最高分。
- Game Loop：每帧或定时执行的规则。
- Assets：命名图片、瓦片、动画、音乐和地图。

平台跳跃、射击、解谜、RPG 其实都建立在这些同样的部件上。区别只是规则和内容不同。

## 2. 项目文件

一个标准 TypeScript Arcade 项目通常长这样：

```text
game/
  main.ts
  pxt.json
  assets.json
  README.md
  images.g.ts
  images.g.jres
  tilemap.g.ts
  tilemap.g.jres
```

开发时主要写 `game/main.ts`。`*.g.ts` 和 `*.g.jres` 是编辑器生成的资源文件，正常情况下不要手动改。

`pxt.json` 的关键规则：

```json
{
  "preferredEditor": "tsprj",
  "files": ["main.ts", "README.md", "assets.json"]
}
```

纯 TypeScript 项目不要加空的 `main.blocks`，否则 MakeCode 可能打开空白积木视图，而不是显示 `main.ts`。

## 3. Sprite：游戏里的对象

Sprite 是游戏世界中的对象：

```typescript
let player = sprites.create(assets.image`player`, SpriteKind.Player)
player.setPosition(80, 60)
player.vx = 50
```

常用属性：

- `x`, `y`：中心坐标。
- `vx`, `vy`：速度，单位是像素/秒。
- `ax`, `ay`：加速度，平台跳跃常用 `ay` 做重力。
- `fx`, `fy`：摩擦。
- `z`：绘制顺序。
- `lifespan`：多少毫秒后自动销毁。

用 `SpriteKind` 表示对象在规则里的身份：

```typescript
namespace SpriteKind {
    export const Coin = SpriteKind.create()
    export const PlayerAttack = SpriteKind.create()
}
```

经验规则：如果两类对象需要不同碰撞规则，就给它们不同的 kind。

## 4. Controller：输入

直接移动：

```typescript
controller.moveSprite(player, 100, 100)
```

平台跳跃：

```typescript
controller.moveSprite(player, 100, 0)
player.ay = 350

controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (player.isHittingTile(CollisionDirection.Bottom)) {
        player.vy = -180
    }
})
```

单次动作，例如跳、射击、交互、攻击，用按键事件。持续动作，例如蓄力、瞄准、举盾，可以在 update 中检查 `isPressed()`。

## 5. Tilemap：关卡和地图数据

Tilemap 是关卡。它可以存地面、墙、陷阱、出口、出生点和装饰。

```typescript
tiles.setCurrentTilemap(assets.tilemap`level1`)
tiles.placeOnTile(player, tiles.getTileLocation(2, 5))
```

更高级的用法是把特殊 tile 当数据：

```typescript
for (let loc of tiles.getTilesByType(assets.tile`enemySpawn`)) {
    let enemy = sprites.create(assets.image`enemy`, SpriteKind.Enemy)
    tiles.placeOnTile(enemy, loc)
    tiles.setTileAt(loc, assets.tile`transparency16`)
}
```

用 tile overlap 处理陷阱和目标：

```typescript
scene.onOverlapTile(SpriteKind.Player, assets.tile`spike`, function (player, loc) {
    info.changeLifeBy(-1)
})
```

注意：玩家停在 tile 上时，overlap 会持续触发。伤害、加分、开门这类逻辑通常要加冷却或状态锁。

## 6. Scene 和 Camera

Scene 管视觉世界：

```typescript
scene.setBackgroundColor(game.Color.LightBlue)
scene.cameraFollowSprite(player)
scene.cameraShake(3, 200)
```

大地图用 `scene.cameraFollowSprite(player)`。自定义 HUD 如果要固定在屏幕上，用 `SpriteFlag.RelativeToCamera`：

```typescript
let label = textsprite.create("A")
label.setFlag(SpriteFlag.RelativeToCamera, true)
label.setPosition(150, 10)
```

## 7. Game Loop：游戏循环

常见两种循环：

```typescript
game.onUpdate(function () {
    // 每帧执行
})

game.onUpdateInterval(1000, function () {
    // 每秒执行
})
```

`onUpdate` 适合平滑行为：瞄准、跟随、物理检测、自定义绘制状态。

`onUpdateInterval` 适合周期行为：刷怪、倒计时、AI 决策、回血、周期得分。

不要在 `onUpdate` 里无保护地创建 `timer.after`，否则每帧都会创建新的延迟回调。

## 8. Timer 和 Fiber

延迟执行：

```typescript
timer.after(500, function () {
    player.setFlag(SpriteFlag.Ghost, false)
})
```

冷却：

```typescript
timer.debounce("playerDamage", 800, function () {
    info.changeLifeBy(-1)
})
```

长序列：

```typescript
timer.background(function () {
    boss.sayText("Phase 1", 1000)
    pause(1000)
    boss.vx = 80
    pause(2000)
    boss.sayText("Phase 2", 1000)
})
```

可以把 `timer.background` 理解成 Boss、剧情、商店对话、多段攻击的脚本。普通每帧模拟不要靠它实现。

## 9. 碰撞和伤害

Sprite 和 sprite 重叠：

```typescript
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (projectile, enemy) {
    projectile.destroy()
    damageEnemy(enemy, 1)
})
```

Sprite 撞墙：

```typescript
scene.onHitWall(SpriteKind.Enemy, function (enemy, loc) {
    enemy.vx = -enemy.vx
})
```

动作游戏建议把视觉和攻击判定分开：

```typescript
function attack(player: Sprite, facingRight: boolean) {
    let hitbox = sprites.create(image.create(10, 12), SpriteKind.PlayerAttack)
    hitbox.setFlag(SpriteFlag.Invisible, true)
    hitbox.setPosition(player.x + (facingRight ? 12 : -12), player.y)
    hitbox.lifespan = 120
}
```

这样攻击范围和攻击时长更容易调。

## 10. State：游戏状态

小游戏可以用全局变量：

```typescript
let currentLevel = 0
let hasKey = false
```

每个 sprite 自己的状态，推荐挂在 sprite 上：

```typescript
sprites.setDataNumber(enemy, "hp", 3)
sprites.setDataString(enemy, "state", "patrol")
```

这比单独维护 `enemyHealth[]`、`enemyState[]` 这类平行数组可靠。sprite 销毁后，数据也跟着销毁。

需要保存进度时用 `settings`：

```typescript
settings.writeNumber("bestLevel", currentLevel)
let bestLevel = settings.readNumber("bestLevel") || 0
```

只保存真正重要的小数据，不要轻易保存整个世界。

## 11. HUD 和反馈

先用内置 HUD：

```typescript
info.setScore(0)
info.setLife(3)
info.startCountdown(60)
```

血条、体力条、Boss 条、经验条用 `statusbars`：

```typescript
let hp = statusbars.create(20, 4, StatusBarKind.Health)
hp.attachToSprite(enemy)
hp.value = 100
```

提示文字、自定义计时器、浮动标签用 `textsprite`。

声音和震屏不是装饰，而是反馈：告诉玩家命中、受伤、得分、失败、状态变化。

## 12. Assets：资源

优先使用命名资源：

```typescript
assets.image`player`
assets.tile`spike`
assets.tilemap`level1`
assets.animation`walk`
```

内联 `img\`...\`` 适合小占位图或示例。真实游戏里，复用资源建议放到 assets 中，代码更清楚，也更容易让 AI 修改。

## 13. 从想法到游戏结构

先问：玩家反复做的动作是什么？

例子：

- 跳跃和收集。
- 躲避和射击。
- 放置防御单位。
- 推箱子。
- 探索房间。
- 生存刷怪。
- 解网格规则。

再定义循环：

```text
开始关卡 -> 玩家行动 -> 规则响应 -> 奖励或惩罚 -> 关卡结束 -> 下一关或重试
```

然后拆系统：

| 问题 | 对应系统 |
| :--- | :--- |
| 什么东西会移动？ | Sprite 和物理。 |
| 什么挡住移动？ | Tilemap 墙壁。 |
| 什么触发变化？ | overlap、按键、timer。 |
| 什么需要记住？ | 全局变量、sprite data、settings。 |
| 如何告诉玩家发生了什么？ | info、状态条、文字、声音、特效。 |

## 14. 稳定起步代码结构

```typescript
namespace SpriteKind {
    export const Coin = SpriteKind.create()
}

let player: Sprite = null
let currentLevel = 0

function createPlayer() {
    player = sprites.create(assets.image`player`, SpriteKind.Player)
    controller.moveSprite(player, 100, 0)
    player.ay = 350
    scene.cameraFollowSprite(player)
}

function loadLevel(level: number) {
    currentLevel = level
    tiles.setCurrentTilemap(assets.tilemap`level1`)
    createPlayer()
    spawnCoins()
}

function spawnCoins() {
    for (let loc of tiles.getTilesByType(assets.tile`coinSpawn`)) {
        let coin = sprites.create(assets.image`coin`, SpriteKind.Coin)
        tiles.placeOnTile(coin, loc)
        tiles.setTileAt(loc, assets.tile`transparency16`)
    }
}

sprites.onOverlap(SpriteKind.Player, SpriteKind.Coin, function (player, coin) {
    coin.destroy()
    info.changeScoreBy(1)
})

controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (player.isHittingTile(CollisionDirection.Bottom)) {
        player.vy = -180
    }
})

info.setLife(3)
info.setScore(0)
loadLevel(0)
```

这个结构故意简单：它给敌人、陷阱、出口、多关卡、攻击、升级都留下了清楚的位置。

## 15. 常见游戏类型怎么拆

### 平台跳跃

重力、水平移动、落地跳跃、tile 陷阱、镜头跟随、收集物、出口。

### 俯视角冒险

四方向移动、房间地图、NPC overlap 提示、道具、钥匙和锁、`settings` 保存进度。

### 射击

子弹、敌人出生、子弹命中、`AutoDestroy` 或 `DestroyOnWall`、波次。

### 塔防

格子放置、路线/行、周期目标选择、子弹、敌人血量、tile 出生点。

### 生存割草

大量敌人、sprite data 敌人属性、周期刷怪、升级、状态条、谨慎清理对象。

### 解谜

状态存在数组或 tilemap 中。只有需要移动或碰撞的东西才做成 sprite。

## 16. 完成前检查表

- 玩家目标清楚。
- 有重复决策，不只是移动。
- 碰撞伤害有冷却。
- 切关会清理旧 sprite。
- UI 清楚显示分数、生命、时间或目标。
- 复用素材有命名资源。
- 没有浏览器/Node API。
- 游戏可以重开，不会被旧全局状态破坏。
- 主要系统有命名函数。

## 17. 如何读本仓库的参考文档

- `reference/arcade-api.md`：API 存不存在、怎么调用。
- `reference/project-format.md`：项目文件如何存储和同步。
- `reference/pitfalls.md`：MakeCode 编辑器和 AI 常见坑。
- `reference/limits.md`：硬件和 Static TypeScript 限制。
- `reference/patterns.md`：从真实游戏提炼的短模式速查。

API 事实看 `reference/`，设计教程看 `docs/`。
