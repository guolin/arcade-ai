# MakeCode Arcade API Quick Reference

源自 pxt-common-packages TypeScript 声明文件，涵盖精灵、控制器、游戏循环、地图、音乐、Info 等模块。

---

## 颜色速查（game.Color 枚举）

避免用魔法数字，直接用命名常量：

| 常量 | 值 | 常量 | 值 |
|------|----|------|----|
| `game.Color.Transparent` | 0 | `game.Color.Teal` | 6 |
| `game.Color.White` | 1 | `game.Color.Green` | 7 |
| `game.Color.Red` | 2 | `game.Color.Blue` | 8 |
| `game.Color.Pink` | 3 | `game.Color.LightBlue` | 9 |
| `game.Color.Orange` | 4 | `game.Color.Purple` | 10 |
| `game.Color.Yellow` | 5 | `game.Color.Brown` | 14 |

---

## 1. 精灵 (Sprites)

### 创建
```typescript
let player = sprites.create(img`...`, SpriteKind.Player);
let enemy  = sprites.create(assets.image`goblin`, SpriteKind.Enemy);
let bullet = sprites.createProjectileFromSprite(img`...`, player, 200, 0); // 从精灵位置发射，自动出屏销毁
let meteor = sprites.createProjectileFromSide(img`...`, 0, 50);           // 从屏幕边缘射入
```

### 位置与物理属性
```typescript
sprite.x     // 中心 x（可赋值）
sprite.y     // 中心 y
sprite.left  // 左边缘 x（⭐ 用于边缘对齐，比手算方便）
sprite.top   // 上边缘 y
sprite.vx    // x 轴速度 (px/s)
sprite.vy    // y 轴速度
sprite.ax    // x 轴加速度
sprite.ay    // y 轴加速度（重力通常 250–500）
sprite.fx    // x 轴摩擦（松开按键后减速）
sprite.z     // 渲染层级，值大的在前
sprite.lifespan = 2000  // ⭐ ms 后自动销毁（不设 = 永久）
sprite.data             // ⭐ 任意自定义数据对象（可直接附加属性）
sprite.layer            // ⭐ 碰撞层 bitmask（默认 1，两精灵 layerA & layerB ≠ 0 才碰撞）
```

### 常用方法
```typescript
sprite.setPosition(x, y)
sprite.setVelocity(vx, vy)
sprite.setImage(img)
sprite.kind()               // 获取 kind 索引
sprite.setKind(kind)
sprite.setStayInScreen(true)
sprite.setBounceOnWall(true)
sprite.overlapsWith(other)  // ⭐ 即时判断两精灵是否重叠（返回 boolean，用于一次性检测）
sprite.follow(target, speed?, turnRate?) // ⭐ AI 跟随（turnRate 控制转向惯性）
sprite.unfollow()
sprite.setScale(value, ScaleAnchor.Center)  // 缩放，需指定锚点
sprite.sayText("Hi!", 2000, true)           // ⭐ 对话气泡（含打字机动画）
sprite.startEffect(effects.fire, 1000)
sprite.onDestroyed(fn)      // ⭐ 单个精灵销毁回调
sprite.destroy(effects.disintegrate, 500)
```

### SpriteFlag（用 `sprite.setFlag` 设置）
```typescript
sprite.setFlag(SpriteFlag.AutoDestroy, true)        // 出屏自动销毁
sprite.setFlag(SpriteFlag.Invisible, true)           // 隐藏
sprite.setFlag(SpriteFlag.DestroyOnWall, true)       // 撞墙销毁（适合子弹）
sprite.setFlag(SpriteFlag.BounceOnWall, true)        // 撞墙反弹
sprite.setFlag(SpriteFlag.RelativeToCamera, true)    // ⭐ HUD 模式：坐标相对屏幕而非世界
sprite.setFlag(SpriteFlag.GhostThroughWalls, true)  // 穿墙不碰撞
sprite.setFlag(SpriteFlag.GhostThroughSprites, true)// 穿精灵不碰撞
sprite.setFlag(SpriteFlag.GhostThroughTiles, true)  // 穿瓦片不触发重叠
sprite.setFlag(SpriteFlag.FlipX, true)              // 水平翻转（不要用 sprite.flipX = true）
sprite.setFlag(SpriteFlag.FlipY, true)
```

### 精灵事件
```typescript
sprites.onCreated(SpriteKind.Enemy, (s) => { /* 每次创建该类精灵时触发 */ });
sprites.onDestroyed(SpriteKind.Enemy, (s) => { /* 销毁时触发 */ });
sprites.onOverlap(SpriteKind.Player, SpriteKind.Coin, (hero, coin) => {
    coin.destroy(); info.changeScoreBy(10);
});
sprites.destroyAllSpritesOfKind(SpriteKind.Enemy);
sprites.allOfKind(SpriteKind.Enemy); // 返回当前存活的同类精灵数组
```

### 扩展 SpriteKind
```typescript
namespace SpriteKind {
    export const Coin = SpriteKind.create();
    export const Goal = SpriteKind.create();
}
```

---

## 2. Image 图像 API

```typescript
// 创建与基础操作
let canvas = image.create(160, 120);
canvas.fill(game.Color.Blue);
canvas.setPixel(10, 20, game.Color.Red);
canvas.getPixel(10, 20);

// 克隆与翻转
let copy = sprite.image.clone();
copy.flipX();        // 水平翻转
copy.flipY();
copy.scroll(dx, dy); // ⭐ 滚动像素（循环包裹）
copy.replace(7, 2);  // 颜色替换（换肤技巧）

// 绘图
canvas.drawLine(x0, y0, x1, y1, color);
canvas.drawRect(x, y, w, h, color);
canvas.fillRect(x, y, w, h, color);
canvas.drawCircle(cx, cy, r, color);  // ⭐
canvas.fillCircle(cx, cy, r, color);  // ⭐
canvas.fillTriangle(x0,y0, x1,y1, x2,y2, color); // ⭐
canvas.drawTransparentImage(src, x, y); // 贴图合成（透明通道有效）
canvas.drawImage(src, x, y);           // 无透明（全覆盖）

// 变换
let rotated = canvas.rotated(90);  // ⭐ 返回旋转 90°/180°/270° 的新图像
canvas.blit(xDst,yDst,wDst,hDst, src, xSrc,ySrc,wSrc,hSrc, transparent, check); // ⭐ 拉伸贴图

// 工具
image.create(w, h)
image.font5         // ⭐ 小字体（5px 高）
image.font8         // ⭐ 大字体（8px 高）
image.getFontForText(text) // 自动选字体
image.repeatY(3, img)     // ⭐ 垂直重复 N 次
image.concatY([img1, img2]) // ⭐ 垂直拼接图像数组
```

---

## 3. 控制器 (Controller)

```typescript
controller.moveSprite(player, 100, 0); // 锁 Y 轴（平台跳跃标准写法）

// 按键事件（onEvent 会覆盖已有 handler；addEventListener 叠加，扩展库用这个）
controller.A.onEvent(ControllerButtonEvent.Pressed, fn);
controller.A.addEventListener(ControllerButtonEvent.Pressed, fn); // ⭐ 叠加不冲突
controller.A.removeEventListener(ControllerButtonEvent.Pressed, fn);
controller.A.isPressed()        // 即时状态（在 onUpdate 里用）
controller.A.pressureLevel()    // ⭐ 模拟压力 0–512（支持模拟手柄）
controller.A.repeatDelay = 300  // ⭐ 自定义长按触发延迟（ms）
controller.A.repeatInterval = 80 // ⭐ 自定义长按重复间隔

controller.configureRepeatEventDefaults(delay, interval); // 全局设置重复参数

// 多人手柄 ⭐
controller.player1.A.onEvent(ControllerButtonEvent.Pressed, fn);
controller.player2.left.isPressed();
```

---

## 4. 游戏控制与循环 (Game)

```typescript
game.onUpdate(fn)               // 每帧执行
game.onUpdateInterval(1000, fn) // 每 N ms 执行一次
game.forever(fn)                // ⭐ 独立协程，循环执行（~20ms/次），不阻塞主线程
game.onPaint(fn)                // ⭐ 在所有精灵绘制前执行（z = -20，画地板/背景）
game.onShade(fn)                // ⭐ 在所有精灵绘制后执行（z = 80，画天气叠加层）
game.runtime()                  // ⭐ 场景运行毫秒数（用于计时/动画）

// 对话
game.splash(title, subtitle?)   // ⭐ 阻塞式开场画面，按 A 继续
game.showDialog(title, subtitle, footer?) // ⭐ 非阻塞，立即绘制一帧
game.showLongText(str, DialogLayout.Bottom) // 可翻页长文本，阻塞
game.setDialogFrame(frameImg)   // ⭐ 自定义对话框边框图案
game.setDialogTextColor(color)

// 场景栈（⭐ 用于暂停菜单/子界面，不会销毁当前游戏世界）
game.pushScene()                // 压入新空场景
game.popScene()                 // 弹回上一个场景

// 游戏结束
game.over(win, effect?)
game.onGameOver(handler: (win: boolean) => void) // ⭐ 拦截 game-over 画面
game.setGameOverMessage(win, "You Won! Score: ${PLAYER}") // ⭐ 支持 ${PLAYER} ${WINNER} 占位符

// 调试
game.debug = true   // 显示碰撞盒
game.stats = true   // 显示性能计数器
```

---

## 5. 场景与摄像机 (Scene)

```typescript
scene.setBackgroundColor(game.Color.Blue)
scene.setBackgroundImage(img)

// 视差背景（内置，不需要 scroller 扩展）⭐
scene.addBackgroundLayer(assets.image`sky`, 10, BackgroundAlignment.Bottom)

// 摄像机
scene.cameraFollowSprite(player)
scene.centerCameraAt(x, y)
scene.cameraShake(4, 500)
scene.cameraProperty(CameraProperty.X)  // ⭐ 获取摄像机世界坐标

// 自定义渲染（⭐ 最底层绘图钩子，可以插入任意 z 层）
scene.createRenderable(z, (target: Image, camera) => {
    target.fillRect(0, 0, 160, 120, game.Color.Black); // target 就是 screen
})
```

---

## 6. 瓦片地图 (Tilemap)

> ⚠️ **禁区**：把内联 `img` 当图块传给 `createTilemap` → 编辑器崩溃。详见 pitfalls 坑5。

```typescript
tiles.setCurrentTilemap(assets.tilemap`level_1`);

// 坐标与定位
let loc = tiles.getTileLocation(col, row);
loc.x / loc.y            // 该格中心的世界像素坐标
loc.getNeighboringLocation(CollisionDirection.Right) // ⭐ 取相邻格
tiles.placeOnTile(sprite, loc)
tiles.placeOnRandomTile(sprite, assets.tile`chest`)
tiles.getRandomTileByType(assets.tile`spawn`) // ⭐ 返回单个随机匹配格

// 查询
tiles.getTilesByType(assets.tile`enemy_spawn`) // 返回所有匹配格数组
tiles.tileAtLocationEquals(loc, assets.tile`spike`)
tiles.tileAtLocationIsWall(loc)  // ⭐

// 精灵-地图检测
player.isHittingTile(CollisionDirection.Bottom) // 落地检测
player.tilemapLocation()         // ⭐ 获取精灵所在格
player.tileKindAt(TileDirection.Left, assets.tile`ice`) // ⭐ 检查相邻格类型

// 动态修改
tiles.setTileAt(loc, assets.tile`transparency16`)
tiles.setWallAt(loc, true/false)

// 地图事件 ⭐
tiles.addEventListener(TileMapEvent.Loaded, (data) => { /* 地图切换后初始化 */ })
```

### 两条可靠路线
**路线 A（推荐）：命名地图**
```typescript
tiles.setTilemap(tilemap`level`) // 编辑器自动创建可视化编辑的空地图
scene.cameraFollowSprite(player)
```

**路线 B：createTilemap + 内置图块**
```typescript
tiles.createTilemap(data, walls,
    [sprites.castle.tileGrass1, sprites.castle.tilePath5],
    TileScale.Sixteen);
```
`TileScale` 可选值：`Four`(4px) / `Eight`(8px) / `Sixteen`(16px) / `ThirtyTwo`(32px)

内置图块库：`sprites.castle.*`、`sprites.dungeon.*`、`sprites.builtin.*`、`sprites.food.*`

---

## 7. 音乐与音效 (Music)

```typescript
music.play(music.melodyPlayable(music.jumpUp), music.PlaybackMode.InBackground)
// 预设音效: pewPew / jumpUp / powerUp / powerDown / baDing / wawawawaa / funeral
music.play(music.stringPlayable("C D E F G ", 120), music.PlaybackMode.LoopingInBackground)
music.stopAllSounds()

// 程序化合成音效 ⭐
let snd = music.createSoundEffect(
    WaveShape.Square,   // Square / Sawtooth / Triangle / Noise
    400, 600,           // 起始/结束频率 Hz
    255, 0,             // 起始/结束音量 (0-255)
    100,                // 时长 ms
    SoundExpressionEffect.None,
    InterpolationCurve.Linear
);
music.play(snd, music.PlaybackMode.InBackground);
```

`Note` 枚举可直接用音符名：`Note.C`、`Note.D`、`Note.C5` 等（默认 4 八度）

---

## 8. 游戏信息 (Info / HUD)

> **HUD 自动渲染**：调用以下 API 后，分数/血条/倒计时自动显示在屏幕角落，无需手写显示代码。

```typescript
// 分数
info.setScore(0); info.changeScoreBy(10); info.score()
info.highScore()  // ⭐ 内置历史最高分（自动从 settings 读取，无需手写）
info.onScore(100, () => { /* 分数到达 100 时触发 */ }) // ⭐

// 生命
info.setLife(3); info.changeLifeBy(-1); info.life()
info.onLifeZero(() => { game.over(false) }) // 覆盖默认 game-over 行为
info.setLifeImage(assets.image`heart`) // ⭐ 自定义血条图标

// 倒计时
info.startCountdown(30)
info.countdown()         // ⭐ 剩余秒数
info.changeCountdownBy(-5) // ⭐ 动态加减时间
info.stopCountdown()     // ⭐
info.onCountdownEnd(() => { game.over(false) })

// HUD 外观
info.showScore(false)     // 隐藏分数
info.setBorderColor(game.Color.White)
info.setFontColor(game.Color.Yellow)
```

### 多人 Info ⭐
```typescript
info.player1.setScore(0); info.player1.score()
info.player2.setLife(3);  info.player2.changeLifeBy(-1)
info.player1.onLifeZero(() => { /* p1 阵亡 */ })
info.winningPlayer()      // 返回得分最高的 PlayerInfo
info.playersWithScores()  // 返回所有有分数的 PlayerInfo[]
```

---

## 9. 持久化存储 (Settings)

数据作用域自动按游戏名隔离，不同游戏不会互相污染。

```typescript
settings.writeNumber(key, value)
settings.readNumber(key)           // 未设置返回 undefined
settings.writeString(key, value)
settings.readString(key)
settings.writeJSON(key, obj)       // ⭐ 直接存对象
settings.readJSON(key)             // ⭐ 直接读对象
settings.writeNumberArray(key, arr)
settings.readNumberArray(key)
settings.exists(key)
settings.remove(key)
settings.list(prefix?)             // ⭐ 列出所有（或带前缀的）key
settings.clear()                   // 清除本游戏所有存档
settings.runNumber()               // ⭐ 本游戏已运行次数（用于新手引导）
```

---

## 10. 碰撞与重叠 (Collision & Overlap)

```typescript
// 精灵 vs 精灵（每帧最多触发一次/对）
sprites.onOverlap(SpriteKind.Player, SpriteKind.Coin, (hero, coin) => { coin.destroy() });

// 精灵 vs 瓦片
scene.onOverlapTile(SpriteKind.Player, assets.tile`lava`, (player, loc) => {
    info.changeLifeBy(-1); scene.cameraShake(3, 250);
});

// 精灵撞墙
scene.onHitWall(SpriteKind.Enemy, (enemy, loc) => { enemy.vx = -enemy.vx; });

// 即时判断 ⭐（不依赖事件，适合条件检测）
player.isHittingTile(CollisionDirection.Bottom) // 是否踩地
player.overlapsWith(other)  // 是否与指定精灵重叠（返回 boolean）
```

---

## 11. 粒子与特效 (Effects)

```typescript
// 精灵粒子
player.startEffect(effects.fire, 1000)
player.startEffect(effects.trail)
effects.clearParticles(player)

// 全屏特效
effects.confetti.startScreenEffect(3000)
effects.fire.startScreenEffect()
effects.fire.endScreenEffect()
// 其他: hearts / smiles / starField / bubbles

// 图像变换特效（applyTo 会修改精灵图像）⭐
effects.dissolve.applyTo(player)
// 其他: melt / slash / splatter

// 自定义粒子源 ⭐（精细控制）
let src = particles.createParticleSource(player, 30) // 每秒 30 个粒子
src.setAcceleration(0, 50)  // 粒子重力
src.setEnabled(false)
src.lifespan = 5000         // 5秒后自动停止
```

---

## 12. 动画 (Animation)

> ❗ 需要对应依赖才能使用。

### 基础帧动画（`"animation": "*"`）
```typescript
animation.runImageAnimation(player, assets.animation`hurt`, 150, false) // 单次
animation.runImageAnimation(player, assets.animation`idle`, 200, true)  // 循环
animation.runMovementAnimation(player, animation.animationPresets(animation.shake), 500)
// 内置路径预设: shake / flyToCenter / bounceRight / bounceLeft / bobbing / easeRight …
animation.stopAnimation(AnimationTypes.All, player) // 停止所有动画
```

### 角色动作状态机（`"characterAnimations": "*"`）⭐ 推荐
```typescript
characterAnimations.loopFrames(player, assets.animation`run_right`, 100,
    characterAnimations.rule(Predicate.MovingRight, Predicate.HittingWallDown))
characterAnimations.loopFrames(player, assets.animation`idle`, 200,
    characterAnimations.rule(Predicate.NotMoving))

// 播放覆盖动画（攻击/受伤）时临时关闭状态机
characterAnimations.setCharacterAnimationsEnabled(player, false)
animation.runImageAnimation(player, assets.animation`attack`, 50, false)
timer.after(250, () => characterAnimations.setCharacterAnimationsEnabled(player, true))
```

`Predicate` 枚举：`Moving/NotMoving`、`MovingLeft/Right/Up/Down`、`FacingLeft/Right`、`HittingWallLeft/Right/Up/Down`

---

## 13. 精灵数据绑定与 FSM

```typescript
// 用 sprite.data 附加任意属性（最简单的方式）⭐
(player.data as any).invincible = false;
(enemy.data as any).state = "chase";

// 或用 sprites 命名空间（兼容 block 环境）
sprites.setDataNumber(enemy, "state", 1)
sprites.readDataNumber(enemy, "state")
sprites.setDataBoolean(enemy, "active", true)

// AI 追随示例
game.onUpdate(() => {
    for (let e of sprites.allOfKind(SpriteKind.Enemy)) {
        if (spriteutils.distanceBetween(e, player) < 80) {
            e.follow(player, 60) // ⭐ 内置平滑追随，turnRate 控制转向惯性
        }
    }
})
```
> ❗ `spriteutils.distanceBetween` 需要 `"spriteutils": "*"` 依赖。

---

## 14. 扩展功能速查（需额外依赖）

| 扩展 | 依赖声明 | 主要 API |
|------|----------|----------|
| timer | `"timer": "*"` | `timer.after(ms, fn)` / `timer.background(fn)` |
| animation | `"animation": "*"` | `animation.runImageAnimation(sprite, frames, interval, loop)` |
| characterAnimations | `"characterAnimations": "*"` | `characterAnimations.loopFrames(sprite, frames, ms, rule)` |
| StatusBars | `"pxt-status-bar": "*"` | `statusbars.create(w, h, kind)` / `bar.attachToSprite(s, 2, 0)` |
| TextSprite | `"textsprite": "*"` | `textsprite.create(text, bg, border)` |
| Story | `"story": "*"` | `story.startCutscene(fn)` / `story.printDialog(...)` |
| spriteutils | `"spriteutils": "*"` | `spriteutils.distanceBetween(a, b)` |
| scroller | `"scroller": "*"` | `scroller.setLayerImage(layer, img)` |
| sprite-scaling | `"sprite-scaling": "*"` | `scaling.scaleToPercent(sprite, 150)` / `scaling.scaleToPixels(sprite, 32)` |

**timer 示例：**
```typescript
timer.after(2000, () => { /* 2秒后执行，不阻塞 */ })
timer.background(() => {
    game.showLongText("Boss incoming!", DialogLayout.Bottom)
    pause(1500)
    let boss = sprites.create(assets.image`boss`, SpriteKind.Enemy)
})
```

**StatusBars 示例：**
```typescript
let hpBar = statusbars.create(20, 4, StatusBarKind.Health)
hpBar.setColor(game.Color.Red, game.Color.Black)
hpBar.max = 100; hpBar.value = 100
hpBar.attachToSprite(player, 2, 0)
```
