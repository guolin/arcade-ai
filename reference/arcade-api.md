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

- **设置/修改分数**：
  `info.setScore(0)`
  `info.changeScoreBy(10)`
- **设置/修改生命值**：
  `info.setLife(3)`
  `info.changeLifeBy(-1)`
- **倒计时**：
  `info.startCountdown(30)` (30秒)
  `info.onCountdownEnd(function() { game.over(false) })`

## 7. Advanced Programmatic Tilemaps (Dynamic Generation)
When generating tilemaps via code (bypassing the visual editor):
- **Buffer Allocation**: Allocate a buffer of size `4 + (cols * rows)` bytes.
  - Byte 0-1: Map width (cols) as 16-bit little-endian integer (`NumberFormat.Int16LE`).
  - Byte 2-3: Map height (rows) as 16-bit little-endian integer (`NumberFormat.Int16LE`).
  - Byte 4+: 1-byte tile index corresponding to your tileset array.
- **Wall Map (Collisions)**: Use an `Image` of size `cols * rows`. Any **non-transparent pixel** marks a solid wall (color `2`/red is just the editor's display convention; any non-zero color works).
- **Instantiation**:
  ```typescript
  const data = Buffer.create(4 + cols * rows);
  data.setNumber(NumberFormat.Int16LE, 0, cols);
  data.setNumber(NumberFormat.Int16LE, 2, rows);
  
  const wallImage = image.create(cols, rows);
  // Set tile index
  data.setUint8(4 + (row * cols) + col, tileIndex);
  // Set solid wall
  wallImage.setPixel(col, row, 2);
  
  const myTilemap = tiles.createTilemap(data, wallImage, [tileAir, tileBrick, tileSpike], TileScale.Sixteen);
  tiles.setCurrentTilemap(myTilemap);
  ```

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

