# MakeCode Arcade API Quick Reference

本文档收集了 Microsoft MakeCode Arcade 中的常用高频 APIs，包含精灵、控制器、游戏循环、瓦片图、音乐和游戏信息等模块。

## 1. 精灵 (Sprites)
精灵是游戏中的主体元素（角色、敌人、道具、特效等）。

- **创建精灵**：
  `let player = sprites.create(img`...`, SpriteKind.Player)`
- **控制精灵在屏幕内**：
  `player.setStayInScreen(true)`
- **设置精灵位置**：
  `player.setPosition(x: number, y: number)`
- **精灵速度**：
  `player.vx = 50` (X轴速度)
  `player.vy = -20` (Y轴速度)
- **销毁精灵**：
  `player.destroy(effects.disintegrate, 500)` (支持特效与延迟时间)
- **碰撞重叠事件**：
  ```typescript
  sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function(player, enemy) {
      enemy.destroy();
      info.changeLifeBy(-1);
  });
  ```

## 2. 控制器 (Controller)
控制玩家输入。

- **用摇杆移动精灵**：
  `controller.moveSprite(player, vx?, vy?)` (默认速度为 100)
- **按键事件**：
  ```typescript
  controller.A.onEvent(ControllerButtonEvent.Pressed, function() {
      // 射击子弹
      let projectile = sprites.createProjectileFromSprite(img`...`, player, 200, 0);
  });
  ```
- **获取当前摇杆倾斜度**：
  `controller.dx()`, `controller.dy()`

## 3. 游戏控制与循环 (Game)
控制游戏全局流和定时执行。

- **游戏更新循环**（每帧执行）：
  ```typescript
  game.onUpdate(function() {
      // 每帧执行的物理逻辑或状态检查
  });
  ```
- **定时更新循环**（指定毫秒数执行一次）：
  ```typescript
  game.onUpdateInterval(1000, function() {
      // 每秒生成一个敌人
      let enemy = sprites.create(img`...`, SpriteKind.Enemy);
  });
  ```
- **游戏结束**：
  `game.over(win: boolean, effect?: effect)`
- **显示长文本对话框**：
  `game.showLongText("Hello World!", DialogLayout.Bottom)`

## 4. 瓦片地图 (Tilemap)
用于绘制游戏背景和关卡障碍。

- **设置当前瓦片地图**：
  `tiles.setCurrentTilemap(tilemap`level1`)`
- **将精灵移入特定瓦片**：
  `tiles.placeOnRandomTile(sprite, assets.tile`transparency1`)`
- **碰撞瓦片判定**：
  ```typescript
  scene.onOverlapTile(SpriteKind.Player, assets.tile`lava`, function(sprite, location) {
      info.changeLifeBy(-1);
  });
  ```

## 5. 音乐与音效 (Music)
- **播放内置音效**：
  `music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.UntilDone)`
- **播放乐谱简谱**：
  `music.playMelody("C5 B A G F E D C ", 120)`
- **常用预设音效**：
  `music.pewPew`, `music.jumpUp`, `music.powerUp`, `music.powerDown`

## 6. 游戏信息 (Info)
处理分数、生命值和计时器。

> **重要**：以下 API 调用后，Arcade HUD 会**自动在屏幕角落渲染分数、心形血条、倒计时**，无需写任何显示代码。不要用 `game.showLongText` 或自定义 sprite 手搓 UI——那是重复造轮子。

- **设置/修改分数**：
  `info.setScore(0)`
  `info.changeScoreBy(10)`
- **设置/修改生命值**：
  `info.setLife(3)`
  `info.changeLifeBy(-1)`
- **倒计时**：
  `info.startCountdown(30)` (30秒)
  `info.onCountdownEnd(function() { game.over(false) })`

## 6b. 持久化存储与历史最高分 (Settings)
MakeCode Arcade 提供 `settings` 命名空间，数据持久化到设备 flash（浏览器模拟器对应 localStorage）。

```typescript
// 历史最高分示例
const best = settings.readNumber("highScore") || 0;
if (info.score() > best) {
    settings.writeNumber("highScore", info.score());
}
```

- `settings.writeNumber(key, value)` / `settings.readNumber(key)`
- `settings.writeString(key, value)` / `settings.readString(key)`
- `settings.exists(key)` / `settings.remove(key)`

> **没有内置排行榜 UI**：`settings` 只是 key-value 存储，多名玩家排行榜需要自己用 sprite/text 实现显示逻辑。

## 7. 地图 Tilemap（两条可靠路线，外加一个会崩的禁区）

> ⚠️ **禁区**：`tiles.createTilemap(hex`...`, img`...`, [内联 img tile], ...)` —— **把内联 `img` 当图块会让官方编辑器崩溃**（Oops 重载循环）。编辑器的 tilemap 解析器只接受“命名图块资源”，不接受随手写的内联 img。已实测确认。详见 pitfalls 坑5。

### 路线 A（推荐，AI + 人协作）：命名地图 `tilemap`level``
AI 在代码里引用一个命名地图；编辑器首次打开会**自动创建一张可编辑的空地图**，人在网页地图编辑器里画好后，自动同步回磁盘（`tilemap.g.ts` / `tilemap.g.jres`）并随游戏运行、可反复改。
```typescript
tiles.setTilemap(tilemap`level`)     // level 不存在时编辑器会自动创建
scene.cameraFollowSprite(mySprite)
```

### 路线 B（纯代码，用内置图块）：`createTilemap` + **内置 tile**
图块用 MakeCode 自带的图库（真资源，不会崩），而不是内联 img：
```typescript
const data = Buffer.create(4 + cols * rows);
data.setNumber(NumberFormat.Int16LE, 0, cols);   // 宽
data.setNumber(NumberFormat.Int16LE, 2, rows);   // 高
data.setUint8(4 + row * cols + col, tileIndex);  // 每格图块索引（0 起，指向下面数组）
const walls = image.create(cols, rows);          // 墙体层：非透明像素=墙
const tm = tiles.createTilemap(
    data, walls,
    [sprites.castle.tileGrass1, sprites.castle.tilePath5],  // 内置图块，非内联 img
    TileScale.Sixteen);
tiles.setCurrentTilemap(tm);
```

### 内置图库（直接按名引用，无需手画/手写 jres）
- `sprites.castle.*` —— 草地/路/石头/房子等：`tileGrass1`、`tileGrass2`、`tileDarkGrass2`、`tilePath5`、`rock0`、`houseBlue` …
- 还有 `sprites.dungeon.*`、`sprites.builtin.*`、`sprites.food.*`、`sprites.vehicle.*` 等多个图库。
- **确切名字以编辑器里的图库(image gallery)为准**——打开精灵/地图编辑器点“Gallery”即可浏览全部，别凭记忆臆造名字。

## 8. Looping Background Music & Custom Melodies
- **Play Custom Notes Looping**: Use `music.stringPlayable` and `music.PlaybackMode.LoopingInBackground`.
  ```typescript
  music.play(
      music.stringPlayable("E G A G C5 B A G ", 120),
      music.PlaybackMode.LoopingInBackground
  );
  ```
- **Stop All Sounds**: `music.stopAllSounds()`

## 9. Collisions & Overlap Events
- **Scene Wall Collision Event**: Triggered when a sprite hits a tilemap wall:
  ```typescript
  scene.onHitWall(SpriteKind.Enemy, function(enemy: Sprite, location: tiles.Location) {
      enemy.vx = -enemy.vx; // Bounce back
  });
  ```
- **Sprite Overlap Event**:
  ```typescript
  sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function(player: Sprite, enemy: Sprite) {
      // Logic here
  });
  ```
- **Tile Overlap Event**:
  ```typescript
  scene.onOverlapTile(SpriteKind.Player, tileSpike, function(player: Sprite, location: tiles.Location) {
      // Logic here (e.g. respawn player)
  });
  ```

