# MakeCode Arcade API Quick Reference

本文档收集了 Microsoft MakeCode Arcade 中的常用高频 APIs，包含精灵、控制器、游戏循环、瓦片图、音乐和游戏信息等模块。

## 1. 精灵 (Sprites)
精灵是游戏中的主体元素（角色、敌人、道具、特效等）。

- **创建精灵**：
  `let player = sprites.create(img`...`, SpriteKind.Player)`
  `let enemy = sprites.create(assets.image`goblin`, SpriteKind.Enemy)` （引用 assets.json 资源）
- **控制精灵在屏幕内**：
  `player.setStayInScreen(true)`
- **设置精灵位置**：
  `player.setPosition(x: number, y: number)`
- **精灵速度/加速度/摩擦**：
  `player.vx = 50` / `player.vy = -20` / `player.ax = 0` / `player.ay = 350`（重力）/ `player.fx = 50`（摩擦）
- **Z 层级**：`player.z = 10`（值大的在前）
- **销毁精灵**：
  `player.destroy(effects.disintegrate, 500)` (支持特效与延迟时间)
- **销毁某类全部精灵**：`sprites.destroyAllSpritesOfKind(SpriteKind.Enemy)`
- **碰撞重叠事件**：
  ```typescript
  sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function(player, enemy) {
      enemy.destroy();
      info.changeLifeBy(-1);
  });
  ```
- **扩展 SpriteKind**（在顶层扩展，不要用字符串）：
  ```typescript
  namespace SpriteKind {
      export const Coin = SpriteKind.create();
      export const Goal = SpriteKind.create();
  }
  ```

## 2. Image 图像 API
直接操作 Image 对象，用于 UI 绘制、动态贴图、克隆翻转等。

```typescript
let canvas = image.create(160, 120);    // 新建空白图像
canvas.fill(9);                          // 填充颜色
canvas.setPixel(10, 20, 2);             // 设置单像素
canvas.getPixel(10, 20);                // 读取像素颜色

let img2 = assets.image`hero`.clone();  // 克隆（不影响原资源）
img2.flipX();                           // 水平翻转（向左走用这个）
img2.flipY();                           // 垂直翻转
img2.replace(7, 2);                     // 颜色替换（染色/换肤技巧）

canvas.drawLine(0, 0, 159, 119, 5);         // 画线
canvas.drawRect(10, 10, 50, 30, 15);        // 空心矩形
canvas.fillRect(10, 10, 50, 30, 4);         // 实心矩形
canvas.drawTransparentImage(assets.image`sword`, 20, 20); // 贴图合成
```

## 3. 控制器 (Controller)
控制玩家输入。

- **用摇杆移动精灵**：
  `controller.moveSprite(player, vx?, vy?)` (默认速度为 100)
  `controller.moveSprite(player, 100, 0)` — 锁 Y 轴（平台跳跃标准写法）
- **按键事件**：
  ```typescript
  controller.A.onEvent(ControllerButtonEvent.Pressed, function() {
      if (player.isHittingTile(CollisionDirection.Bottom)) {
          player.vy = -180; // 跳跃
      }
  });
  ```
- **即时状态检测**：`controller.A.isPressed()`（在 onUpdate 里判断长按）
- **获取当前摇杆倾斜度**：`controller.dx()`, `controller.dy()`

## 4. 游戏控制与循环 (Game)

- **游戏更新循环**（每帧执行）：
  ```typescript
  game.onUpdate(function() { /* 物理逻辑或状态检查 */ });
  ```
- **定时更新循环**（指定毫秒数执行一次）：
  ```typescript
  game.onUpdateInterval(1000, function() {
      let enemy = sprites.create(assets.image`bat`, SpriteKind.Enemy);
  });
  ```
- **游戏结束**：`game.over(win: boolean, effect?)`
- **显示长文本对话框**：`game.showLongText("Hello World!", DialogLayout.Bottom)`

### timer 扩展（延迟与协程）
> ❗ 需要 `"timer": "*"` 依赖。

```typescript
timer.after(2000, function() { /* 2秒后执行，不阻塞 */ });

timer.background(function() {
    game.showLongText("Boss incoming!", DialogLayout.Bottom);
    pause(1000);
    // 阶段式流程，在后台顺序执行
    let boss = sprites.create(assets.image`boss`, SpriteKind.Enemy);
});
```

## 5. 瓦片地图 (Tilemap)
用于绘制游戏背景和关卡障碍。

> ⚠️ **禁区**：`tiles.createTilemap(hex`...`, img`...`, [内联 img tile], ...)` —— **把内联 `img` 当图块会让官方编辑器崩溃**（Oops 重载循环）。详见 pitfalls 坑5。

### 基础用法
```typescript
tiles.setCurrentTilemap(assets.tilemap`level_1`); // 加载关卡

// 坐标定位
let loc: tiles.Location = tiles.getTileLocation(col, row);
tiles.placeOnTile(player, loc);                   // 精灵放到某瓦片
tiles.placeOnRandomTile(coin, assets.tile`chest`); // 随机某类瓦片
```

### 精灵-地图物理检测
```typescript
player.isHittingTile(CollisionDirection.Bottom) // 落地检测
player.isHittingTile(CollisionDirection.Left)   // 贴墙检测

let curLoc = tiles.locationOfSprite(player);
tiles.tileAtLocationEquals(curLoc, assets.tile`spike`) // 踩到某种瓦片
```

### 动态修改地图
```typescript
tiles.setTileAt(loc, assets.tile`transparency16`); // 消除某格瓦片
tiles.setWallAt(loc, true/false);                  // 动态开关墙壁阻挡
```

### 按瓦片类型批量生成（关卡设计常用）
```typescript
for (let loc of tiles.getTilesByType(assets.tile`enemy_spawn`)) {
    let m = sprites.create(assets.image`goblin`, SpriteKind.Enemy);
    tiles.placeOnTile(m, loc);
    tiles.setTileAt(loc, assets.tile`transparency16`); // 清除生成点标记
}
```

### 两条可靠路线
**路线 A（推荐）：命名地图**
```typescript
tiles.setTilemap(tilemap`level`)     // 不存在时编辑器自动创建可编辑空地图
scene.cameraFollowSprite(mySprite)
```

**路线 B：createTilemap + 内置图块**
```typescript
const tm = tiles.createTilemap(
    data, walls,
    [sprites.castle.tileGrass1, sprites.castle.tilePath5],  // 内置图块，非内联 img
    TileScale.Sixteen);
tiles.setCurrentTilemap(tm);
```

### 内置图库
- `sprites.castle.*` — `tileGrass1`、`tilePath5`、`rock0`、`houseBlue` …
- `sprites.dungeon.*`、`sprites.builtin.*`、`sprites.food.*`、`sprites.vehicle.*`
- **确切名字以编辑器 Gallery 为准**，别凭记忆臆造。

## 6. 音乐与音效 (Music)
- **播放内置音效**：
  `music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.InBackground)`
- **常用预设音效**：`music.pewPew`、`music.jumpUp`、`music.powerUp`、`music.powerDown`
- **播放乐谱**：
  ```typescript
  music.play(music.stringPlayable("C D E F G ", 120), music.PlaybackMode.LoopingInBackground);
  ```
- **停止所有声音**：`music.stopAllSounds()`

### 程序化音效合成 (music.createSoundEffect)
无需外部音频文件：
```typescript
let jumpSnd = music.createSoundEffect(
    WaveShape.Square,  // Square / Sawtooth / Triangle / Noise
    400, 600,          // 起始/结束频率 (Hz)
    255, 0,            // 起始/结束音量 (0-255)
    100,               // 时长 (ms)
    SoundExpressionEffect.None,
    InterpolationCurve.Linear
);
music.play(jumpSnd, music.PlaybackMode.InBackground);
// 爆炸音: WaveShape.Noise, 3000→10Hz, 255→0, 400ms, InterpolationCurve.Curve
```

## 7. 游戏信息 (Info)
> **重要**：以下 API 调用后，Arcade HUD 会**自动在屏幕角落渲染分数、心形血条、倒计时**，无需写任何显示代码。

- **分数**：`info.setScore(0)` / `info.changeScoreBy(10)` / `info.score()`（函数，不是属性）
- **生命值**：`info.setLife(3)` / `info.changeLifeBy(-1)` / `info.life()`（函数）
- **倒计时**：`info.startCountdown(30)` / `info.onCountdownEnd(fn)` / `info.onLifeZero(fn)`

### 持久化存储 (settings)
```typescript
const best = settings.readNumber("highScore") || 0;
if (info.score() > best) settings.writeNumber("highScore", info.score());
```
`settings.exists(key)` / `settings.remove(key)` / `settings.writeString` / `settings.readString`

> 没有内置排行榜 UI，多人排行需自己用 sprite/text 实现。

## 8. 碰撞与重叠 (Collision & Overlap)

```typescript
// 精灵 vs 精灵
sprites.onOverlap(SpriteKind.Player, SpriteKind.Coin, function(hero, coin) {
    coin.destroy();
    info.changeScoreBy(10);
});

// 精灵 vs 瓦片
scene.onOverlapTile(SpriteKind.Player, assets.tile`lava`, function(player, loc) {
    info.changeLifeBy(-1);
    scene.cameraShake(3, 250);
});

// 精灵撞墙（敌人反弹）
scene.onHitWall(SpriteKind.Enemy, function(enemy, loc) {
    enemy.vx = -enemy.vx;
});
```

## 9. 动画 (Animation)
> ❗ 需要对应依赖才能使用。

### 基础帧动画（`"animation": "*"`）
```typescript
animation.runImageAnimation(player, assets.animation`player_hurt`, 150, false); // 单次播放
```

### 角色动作状态机（`"characterAnimations": "*"`）推荐
```typescript
// 跑步（向右、踩地）
characterAnimations.loopFrames(player, assets.animation`hero_run_right`, 100,
    characterAnimations.rule(Predicate.MovingRight, Predicate.HittingWallDown));

// 待机（面左、未移动）
characterAnimations.loopFrames(player, assets.animation`hero_idle_left`, 200,
    characterAnimations.rule(Predicate.FacingLeft, Predicate.NotMoving));

// 播放攻击动画时临时关闭状态机，结束后恢复
characterAnimations.setCharacterAnimationsEnabled(player, false);
animation.runImageAnimation(player, assets.animation`hero_attack`, 50, false);
timer.after(250, () => characterAnimations.setCharacterAnimationsEnabled(player, true));
```

**Predicate 常用枚举**：`Moving/NotMoving`、`MovingLeft/Right/Up/Down`、`FacingLeft/Right`、`HittingWallLeft/Right/Up/Down`

## 10. 摄像机与场景特效

```typescript
scene.cameraFollowSprite(player);  // 镜头追随
scene.cameraShake(4, 500);          // 震屏 500ms

// 精灵粒子特效
player.startEffect(effects.fire, 1000); // 触发 1秒 火焰粒子
effects.clearParticles(player);          // 停掉粒子

// 背景视差（"scroller": "*"）
scroller.setLayerImage(scroller.BackgroundLayer.Layer0, assets.image`sky_bg`);
scroller.setLayerImage(scroller.BackgroundLayer.Layer1, assets.image`mountain_bg`);
```

## 11. 扩展功能速查

### StatusBars 血条（`"pxt-status-bar": "*"`）
```typescript
let hpBar = statusbars.create(20, 4, StatusBarKind.Health);
hpBar.setColor(2, 15); hpBar.max = 100; hpBar.value = 100;
hpBar.attachToSprite(player, 2, 0);
```

### TextSprite 文字精灵（`"textsprite": "*"`）
```typescript
let label = textsprite.create("Lvl 1", 0, 1);
label.setOutline(1, 15);
label.setPosition(20, 10);
```

### Story 过场对话（`"story": "*"`）
```typescript
story.startCutscene(function() {
    story.printDialog("Dragon is here!", 80, 80, 120, 40, 15, 2, story.TextSpeed.Normal);
});
```

## 12. 精灵数据绑定与 FSM

精灵附加自定义数据，实现敌人 AI 状态机：
```typescript
namespace EntityState { export const Idle = 0; export const Chase = 1; }

sprites.onCreated(SpriteKind.Enemy, function(enemy) {
    sprites.setDataNumber(enemy, "state", EntityState.Idle);
});

game.onUpdate(function() {
    for (let enemy of sprites.allOfKind(SpriteKind.Enemy)) {
        let state = sprites.readDataNumber(enemy, "state");
        if (state === EntityState.Idle) {
            if (spriteutils.distanceBetween(enemy, player) < 80)
                sprites.setDataNumber(enemy, "state", EntityState.Chase);
        } else if (state === EntityState.Chase) {
            enemy.follow(player, 60);
        }
    }
});
```
> ❗ `spriteutils.distanceBetween` 需要 `"spriteutils": "*"` 依赖。
