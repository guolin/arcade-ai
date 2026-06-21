# MakeCode Arcade 游戏开发核心 API 指南 & 最佳实践

> **面向 AI 开发者的官方核心 API 开发手册** — 涵盖地图、贴图、关卡、声音、图像和动画的详细用法，提供最官方、最规范的纯 TypeScript 示例，帮助你设计高质量、无技术债、绝对不臆造 API 的 Arcade 游戏。

---

## 目录

1. [项目结构与文件规范](#1-项目结构与文件规范)
2. [精灵系统 (Sprites)](#2-精灵系统-sprites)
3. [图像操作 API (Image 核心类)](#3-图像操作-api-image-核心类)
4. [物理与运动 (Physics)](#4-物理与运动-physics)
5. [控制器输入 (Controller)](#5-控制器输入-controller)
6. [贴图与美术资产 (Assets & JRes)](#6-贴图与美术资产-assets--jres)
7. [瓦片地图系统 (Tilemap 与独立碰撞)](#7-瓦片地图系统-tilemap-与独立碰撞)
8. [关卡设计与持久化 (Level Design & settings)](#8-关卡设计与持久化-level-design--settings)
9. [碰撞与重叠事件 (Collision & Overlap)](#9-碰撞与重叠事件-collision--overlap)
10. [游戏循环与定时器 (Loops & Timer)](#10-游戏循环与定时器-loops--timer)
11. [音效合成与调制 (Sound & Music)](#11-音效合成与调制-sound--music)
12. [动画状态机与帧动画 (Animation)](#12-动画状态机与帧动画-animation)
13. [游戏信息显示 (Info)](#13-游戏信息显示-info)
14. [状态条扩展 (StatusBars)](#14-状态条扩展-statusbars)
15. [文字精灵 (TextSprite)](#15-文字精灵-textsprite)
16. [剧情/过场对话 (Story)](#16-剧情过场对话-story)
17. [场景摄像机与屏幕特效](#17-场景摄像机与屏幕特效)
18. [高级游戏设计模式 (FSM, Parry, Line-of-sight)](#18-高级游戏设计模式-fsm-parry-line-of-sight)
19. [硬约束与平台禁区](#19-硬约束与平台禁区)
20. [常见 AI 臆造 API 对照速查表](#20-常见-ai-臆造-api-对照速查表)
21. [附录：89款真实游戏 API 静态词频与热度排行榜](#21-附录89款真实游戏-api-静态词频与热度排行榜)

---

## 1. 项目结构与文件规范

### 纯 TypeScript 标准布局
MakeCode Arcade 项目必须保持以下文件结构。AI 只允许编写并修改 `game/main.ts`。

```
game/
├── main.ts          ← 全部游戏逻辑与 API 调用
├── pxt.json         ← 项目配置文件（声明依赖、编译项、代码入口）
├── assets.json      ← 美术/声音资源清单（必须是合法 JSON）
├── README.md        ← 项目介绍
├── images.g.ts      ← 美术贴图自动生成文件，不要手动改动！
├── images.g.jres    ← 美术贴图源文件，不要手动改动！
├── tilemap.g.ts     ← 地图生成文件，不要手动改动！
└── tilemap.g.jres   ← 地图源文件，不要手动改动！
```

### 关键配置 `pxt.json`
- `preferredEditor` 必须设为 `"tsprj"`，绝对不能是 `"blocksprj"`。
- `files` 列表中只能声明 `main.ts`、`README.md`、`assets.json`。**绝对不能包含 `main.blocks`**，否则会使编辑器切换到空白积木界面。

---

## 2. 精灵系统 (Sprites)

### 创建精灵
```typescript
// 使用内联图像 img 字面量（. 代表透明）
let hero = sprites.create(img`
    . . . 2 2 . . .
    . . 2 2 2 2 . .
    . 2 d 2 2 d 2 .
    . 2 2 2 2 2 2 .
    . . 2 f f 2 . .
`, SpriteKind.Player);

// 从 assets.json 定义的美术资产创建
let enemy = sprites.create(assets.image`goblin`, SpriteKind.Enemy);
```

### 动态扩充 SpriteKind
在顶层 `namespace SpriteKind` 中扩展：
```typescript
namespace SpriteKind {
    export const Coin = SpriteKind.create();
    export const Goal = SpriteKind.create();
    export const Parry = SpriteKind.create();
    export const ShockWave = SpriteKind.create();
    export const Trap = SpriteKind.create();
}
```

---

## 3. 图像操作 API (Image 核心类)

在 MakeCode Arcade 中，图像操作极其灵活。通过操作 `Image` 类的像素与渲染方法，可以实现 UI 绘制、克隆贴图、动态遮罩等效果。

### 核心 Image API 用法
```typescript
// 1. 动态创建空白图像
let canvas = image.create(160, 120); // (宽, 高)

// 2. 图像填充颜色
canvas.fill(9); // 将整张图填充为浅蓝色 (9)

// 3. 像素级操作：获取与设置
let color = canvas.getPixel(10, 20); // 获取坐标(10, 20)的调色板索引 (0-15)
canvas.setPixel(10, 20, 2);          // 将(10, 20)设置为红色 (2)

// 4. 克隆与水平/垂直翻转
let playerImg = assets.image`hero`;
let facingLeftImg = playerImg.clone();
facingLeftImg.flipX(); // 水平翻转贴图（常用于实现向左移动）
let flippedYImg = playerImg.clone();
flippedYImg.flipY();   // 垂直翻转贴图

// ⚠️【AI避坑警示】：
// 微软 MakeCode Arcade 的 Sprite 物理精灵类及其 SpriteFlag 标志，均【不存在】任何 FlipX 或 FlipY 属性/枚举！
// 严禁生成 `sprite.flipX = true` 或 `sprite.setFlag(SpriteFlag.FlipX, true)`，否则会编译报错：
// 「Property 'FlipX' does not exist on type 'typeof SpriteFlag'」
// 正确做法：
// 1. 如果需要翻转精灵图像，必须在其绑定的 `Image` 实例上进行翻转：`sprite.image.flipX()`
// 2. 如果要保留原始素材，可以通过克隆修改并重新赋给精灵：
//    let flipped = sprite.image.clone();
//    flipped.flipX();
//    sprite.setImage(flipped);

// 5. 颜色替换 (Color Swap) — 极为实用的皮肤/染色技术
let enemyRed = assets.image`goblin`.clone();
enemyRed.replace(7, 2); // 将贴图中所有绿色 (7) 替换为红色 (2)

// 6. 绘图 API (线条、矩形与透明绘制)
canvas.drawLine(0, 0, 159, 119, 5);      // 绘制黄色线段 (5)
canvas.drawRect(10, 10, 50, 30, 15);      // 绘制黑色空心矩形 (15)
canvas.fillRect(10, 10, 50, 30, 4);       // 绘制橙色实心矩形 (4)

// 7. 贴图合成 (绘制另一张透明图像)
// 参数: (源图像, x, y)
canvas.drawTransparentImage(assets.image`sword`, 20, 20);
```

---

## 4. 物理与运动 (Physics)

### 常用运动属性
```typescript
sprite.x = 80;            // 精灵中心 X 坐标
sprite.y = 60;            // 精灵中心 Y 坐标
sprite.vx = 100;          // X 轴速度 (像素/秒)
sprite.vy = 0;            // Y 轴速度
sprite.ax = 0;            // X 轴加速度
sprite.ay = 350;          // Y 轴加速度（重力物理的关键：通常在 250-500 之间）
sprite.fx = 50;           // X 轴摩擦力（松开方向键后平滑减速）
sprite.z = 10;            // Z-Index 层级（值越大越在前方绘制，解决前后遮挡）
```

---

## 5. 控制器输入 (Controller)

### 精灵轴向移动
```typescript
controller.moveSprite(player);            // 默认八方向移动（速度 100）
controller.moveSprite(player, 100, 0);    // 锁定 Y 轴，只允许 X 轴移动（平台跳跃的标准写法）
```

### 动作按键与检测
```typescript
// 单次按下事件 (Pressed)
controller.A.onEvent(ControllerButtonEvent.Pressed, function() {
    if (player.isHittingTile(CollisionDirection.Bottom)) {
        player.vy = -180; // 向上跳跃
    }
});

// 长按重复触发事件 (Repeated) — 实现疾跑/蓄力
controller.up.onEvent(ControllerButtonEvent.Repeated, function() {
    controller.moveSprite(player, 180, 180); // 长按方向键加速
});

// 状态检测（常用于 onUpdate 中判断跳跃高度增幅）
if (controller.A.isPressed()) {
    player.vy = -300; // 按住 A 键，向上给更大推力
}
```

---

## 6. 贴图与美术资产 (Assets & JRes)

在纯 TypeScript 模式中，美术资源通过 `assets` 命名空间安全引用，避免在大文件中内联大量十六进制字符串。

### 美术资源声明与引用
```typescript
// 1. 引用大图/精灵贴图
let heroImg: Image = assets.image`hero`;

// 2. 引用地图瓦片贴图
let grassTile: Image = assets.tile`grass`;

// 3. 引用帧动画数组 (Image[])
let walkAnim: Image[] = assets.animation`hero_walk`;

// 4. 引用预制地图 data (tiles.TilemapData)
let firstMap: tiles.TilemapData = assets.tilemap`level_1`;
```

### 资源文件的编辑规则
- 绝对不要在 `images.g.ts`、`images.g.jres`、`tilemap.g.ts`、`tilemap.g.jres` 中手写任何代码。这些文件是由 MakeCode 编译器从 `assets.json` 自动生成的。
- 若要在 AI 环境中创建新资源，可以直接在 `main.ts` 中使用 `img\`...\`` 或在 `assets.json` 中按规范增添配置。

---

## 7. 瓦片地图系统 (Tilemap 与独立碰撞)

MakeCode Arcade 的地图系统是典型的瓦片地图，单格瓦片固定为 **16x16 像素**（`TileScale.Sixteen`）或 **8x8 像素**（`TileScale.Eight`）。

### 1. 加载地图
```typescript
// 加载关卡
tiles.setCurrentTilemap(assets.tilemap`level_1`);
```

### 2. 坐标转换与定位
- 像素坐标 $(X, Y)$ 转瓦片列行 $(Col, Row)$：`col = x >> 4`，`row = y >> 4`。
- 瓦片列行转像素坐标：`x = (col << 4) + 8`（加 8 表示中心对齐）。
```typescript
// 获取指定行列的瓦片位置
let loc: tiles.Location = tiles.getTileLocation(col, row);

// 将精灵定位在特定瓦片上
tiles.placeOnTile(player, loc);

// 将精灵放置在地图上任意随机匹配的特定贴图瓦片上
tiles.placeOnRandomTile(coin, assets.tile`chest`);
```

### 3. 地图动态修改 API
```typescript
// 动态修改某个位置的贴图（将它改为空白透明贴图）
tiles.setTileAt(loc, assets.tile`transparency16`);

// 动态开关某个瓦片的墙壁阻挡性
tiles.setWallAt(loc, true);  // 开启阻挡，玩家无法穿过
tiles.setWallAt(loc, false); // 允许穿过
```

### 4. 精灵-地图物理检测
```typescript
// 判断精灵的哪个方位正在接触墙壁
if (player.isHittingTile(CollisionDirection.Bottom)) {
    // 踩在地上
}
if (player.isHittingTile(CollisionDirection.Left) || player.isHittingTile(CollisionDirection.Right)) {
    // 贴墙，用于墙跳或攀爬
}

// 检查当前格是否是某种瓦片
let currentTile = tiles.locationOfSprite(player);
if (tiles.tileAtLocationEquals(currentTile, assets.tile`spike`)) {
    // 踩到尖刺
}
```

### 5. 独立碰撞 Tilemap (利用 spriteTileMaps)
在格斗或需要独立视野的复杂游戏（如 Zenith Smash）中，若需要不同精灵感知不同的墙壁（如平台抓边只对特定角色生效），可为精灵关联克隆的专属 Tilemap。
> ❗ 需要依赖 `"spriteTileMaps": "*"` 扩展库。
```typescript
// 获取精灵的独立碰撞层
let currentMap = spriteTileMaps.getTileMapForSprite(player);
let clonedMap = tileUtil.cloneMap(currentMap); // 克隆当前地图

// 对 clonedMap 进行定制修改（例如把悬崖边缘的碰撞关掉，便于此角色攀爬）
let ledgeLoc = tiles.getTileLocation(10, 5);
tileUtil.setWallAt(clonedMap, ledgeLoc, false);

// 绑定回该精灵，这会让此精灵走独立阻挡逻辑，不影响其他精灵
spriteTileMaps.setTileMapForSprite(player, clonedMap);
```

---

## 8. 关卡设计与持久化 (Level Design & settings)

### 多关卡流转设计 (字典模式)
```typescript
interface LevelData {
    map: tiles.TilemapData;
    timeLimit: number;
    bg: number;
}

let levels: LevelData[] = [
    { map: assets.tilemap`level1`, timeLimit: 60, bg: 9 },
    { map: assets.tilemap`level2`, timeLimit: 45, bg: 15 },
    { map: assets.tilemap`boss_arena`, timeLimit: 120, bg: 12 }
];

let currentLevelIndex = 0;

function startLevel(index: number) {
    let lvl = levels[index];
    tiles.setCurrentTilemap(lvl.map);
    scene.setBackgroundColor(lvl.bg);
    info.startCountdown(lvl.timeLimit);
    
    // 清理上一关残余精灵
    sprites.destroyAllSpritesOfKind(SpriteKind.Enemy);
    
    // 根据生成点生成本关怪物
    for (let loc of tiles.getTilesByType(assets.tile`enemy_spawn`)) {
        let monster = sprites.create(assets.image`goblin`, SpriteKind.Enemy);
        tiles.placeOnTile(monster, loc);
        tiles.setTileAt(loc, assets.tile`transparency16`);
    }
}
```

### 数据持久化 (使用 blockSettings 存档)
```typescript
// 1. 关卡记录写入
blockSettings.writeNumber("LevelIndex", currentLevelIndex);
blockSettings.writeNumber("HighScore", info.score());

// 2. 读取存档
if (blockSettings.exists("LevelIndex")) {
    currentLevelIndex = blockSettings.readNumber("LevelIndex");
}

// 3. 清理存档 (用于重开/新游戏)
blockSettings.clear();
```

---

## 9. 碰撞与重叠事件 (Collision & Overlap)

### 1. 精灵与精灵重叠
```typescript
// 参数: (Kind1, Kind2, 回调函数)
sprites.onOverlap(SpriteKind.Player, SpriteKind.Coin, function(hero, coin) {
    coin.destroy(); // 拾取销毁
    info.changeScoreBy(10);
    music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.InBackground);
});
```

### 2. 精灵与瓦片重叠
```typescript
// 踩到熔岩瓦片
scene.onOverlapTile(SpriteKind.Player, assets.tile`lava`, function(player, loc) {
    info.changeLifeBy(-1);
    scene.cameraShake(3, 250);
});
```

### 3. 碰撞阻挡 (onHitWall)
```typescript
// 敌人撞到墙自动反向
scene.onHitWall(SpriteKind.Enemy, function(enemy, loc) {
    enemy.vx = -enemy.vx;
});
```

---

## 10. 游戏循环与定时器 (Loops & Timer)

### 主循环
```typescript
// 每一帧都会执行
game.onUpdate(function() {
    // 每一帧同步状态条位置，或更新摄像机
});
```

### 定时循环
```typescript
// 每过 1 秒执行一次，用于生成怪物
game.onUpdateInterval(1000, function() {
    let bat = sprites.create(assets.image`bat`, SpriteKind.Enemy);
    bat.setPosition(160, randint(0, 120));
    bat.vx = -50;
});
```

### 异步与延迟执行 (timer 扩展)
> ❗ 必须添加 `"timer": "*"` 依赖。
```typescript
// 1. 延迟一段时间执行 (不阻塞主线程)
timer.after(2000, function() {
    player.setKind(SpriteKind.Player); // 2秒后无敌状态结束
});

// 2. 协程模式：在后台并发执行一段顺序行为 (使用 pause 等待)
timer.background(function() {
    // 阶段1：提示
    game.showLongText("WARNING: Boss Approaching!", DialogLayout.Bottom);
    pause(1000);
    // 阶段2：Boss 登场
    let boss = sprites.create(assets.image`boss`, SpriteKind.Enemy);
    boss.setPosition(80, 20);
    scene.cameraShake(4, 1500);
});
```

---

## 11. 音效合成与调制 (Sound & Music)

AI 开发游戏必须了解如何编写和调制声音，不得臆造 API。

### 1. 内置乐音序列
```typescript
// 播放一串简谱音序，参数: (简谱, BPM)
music.play(
    music.stringPlayable("C D E F G A B C5 ", 120),
    music.PlaybackMode.InBackground
);
```

### 2. 内置快速音效
```typescript
music.play(music.melodyPlayable(music.jumpUp), music.PlaybackMode.InBackground);
```

### 3. 程序化音效合成器 (music.createSoundEffect)
无需外部音频文件即可实现高质音效：
```typescript
// 1. 生成跳跃音效
let jumpSnd = music.createSoundEffect(
    WaveShape.Square,                // 波形: Square / Sawtooth / Triangle / Noise
    400,                             // 起始频率 (Hz)
    600,                             // 结束频率 (Hz)
    255,                             // 起始音量 (0-255)
    0,                               // 结束音量 (0-255)
    100,                             // 音效时长 (ms)
    SoundExpressionEffect.None,     // 效果: None / Warble / Vibrato / Tremolo
    InterpolationCurve.Linear       // 差值曲线: Linear / Curve / Logarithmic
);
music.play(jumpSnd, music.PlaybackMode.InBackground);

// 2. 生成爆炸音效 (使用 Noise 噪音波形)
let explosionSnd = music.createSoundEffect(WaveShape.Noise, 3000, 10, 255, 0, 400, SoundExpressionEffect.None, InterpolationCurve.Curve);
```

### 4. 高级低频震荡音效调制 (Sound 实例)
对乐音进行音色频率调制，创造复杂的科幻/金属感音色：
```typescript
let complexSound = sound.create();
// 添加基础声波段: (音效实例, 波形, 时长ms, 起始频, 终点频, 起始音量, 终点音量)
sound.addPart(complexSound, sound.Waveform.Cycle48, 600, 120, 900, 15, 15);

// 调制：附加低频振荡器 (LFO), 产生周期性颤音
sound.applyFrequencyModulation(
    complexSound,
    sound.createLFO(sound.LFOWaveform.Square, 10), // 10Hz 方波 LFO
    sound.semitoneScaleFactor(5)                  // 频率振幅
);
sound.play(complexSound, false);
```

---

## 12. 动画状态机与帧动画 (Animation)

动画在 Arcade 中有两种实现途径：基本帧动画（`animation`）、角色动作状态机（`characterAnimations`）。

### 1. 基础帧动画 (animation)
> ❗ 需要 `"animation": "*"` 依赖。
```typescript
// 播放单次 Hurt 帧动画
animation.runImageAnimation(
    player,
    assets.animation`player_hurt`, // 贴图数组
    150,                           // 帧间隔 (ms)
    false                          // 是否循环
);
```

### 2. 角色动作状态机 (characterAnimations)
> ❗ 需要 `"characterAnimations": "*"` 依赖。
这是处理角色移动、站立、上下跳跃、攀爬等方向和物理状态关联动画的**官方最佳实践**。

```typescript
// 1. 设置跑步（向右、站在地上）的循环动画
characterAnimations.loopFrames(
    player,
    assets.animation`hero_run_right`,
    100,
    characterAnimations.rule(Predicate.MovingRight, Predicate.HittingWallDown)
);

// 2. 设置跑步（向左、站在地上）的循环动画
characterAnimations.loopFrames(
    player,
    assets.animation`hero_run_left`,
    100,
    characterAnimations.rule(Predicate.MovingLeft, Predicate.HittingWallDown)
);

// 3. 设置跳跃上升动画
characterAnimations.loopFrames(
    player,
    assets.animation`hero_jump_up`,
    150,
    characterAnimations.rule(Predicate.MovingUp)
);

// 4. 设置待机（面向左、未移动）的循环动画
characterAnimations.loopFrames(
    player,
    assets.animation`hero_idle_left`,
    200,
    characterAnimations.rule(Predicate.FacingLeft, Predicate.NotMoving)
);

// 5. 关键状态覆盖：攻击或受伤时，必须临时“关闭”状态机动画，播放完毕后再恢复
characterAnimations.setCharacterAnimationsEnabled(player, false); // 临时关闭
animation.runImageAnimation(player, assets.animation`hero_attack`, 50, false);
timer.after(250, function() {
    characterAnimations.setCharacterAnimationsEnabled(player, true);  // 恢复状态机动画
});
```

### 附表：`Predicate` 规则判断状态枚举
可作为 `characterAnimations.rule(...)` 的参数传入：
- `Predicate.Moving` / `Predicate.NotMoving`
- `Predicate.MovingLeft` / `Predicate.MovingRight`
- `Predicate.MovingUp` / `Predicate.MovingDown`
- `Predicate.FacingLeft` / `Predicate.FacingRight`
- `Predicate.HittingWallLeft` / `Predicate.HittingWallRight`
- `Predicate.HittingWallUp` / `Predicate.HittingWallDown` (注：HittingWallDown 相当于 HittingTileDown 即站在地上)

---

## 13. 游戏信息显示 (Info)

```typescript
info.setScore(0);
info.changeScoreBy(50);
let score = info.score();

info.setLife(3);
info.changeLifeBy(-1);

// 自定义生命归零行为
info.onLifeZero(function() {
    // 播放阵亡音效并转入结算流程
    game.over(false);
});
```

---

## 14. 状态条扩展 (StatusBars)

> ❗ 需要 `"pxt-status-bar": "*"` 依赖。
```typescript
let hpBar = statusbars.create(20, 4, StatusBarKind.Health);
hpBar.setColor(2, 15); // (红色前景色, 透明背景色)
hpBar.max = 100;
hpBar.value = 100;

// 附着在角色上方跟随移动
hpBar.attachToSprite(player, 2, 0);
hpBar.positionDirection(CollisionDirection.Top);
```

---

## 15. 文字精灵 (TextSprite)

> ❗ 需要 `"textsprite": "*"` 依赖。
```typescript
let label = textsprite.create("Lvl 1", 0, 1);
label.setOutline(1, 15);
label.setPosition(20, 10);
```

---

## 16. 剧情/过场对话 (Story)

> ❗ 需要 `"story": "*"` 依赖。
```typescript
story.startCutscene(function() {
    story.printDialog("Hero! The dragon is here!", 80, 80, 120, 40, 15, 2, story.TextSpeed.Normal);
    story.printDialog("Prepare to fight!", 80, 80, 120, 40, 15, 2, story.TextSpeed.Fast);
});
```

---

## 17. 场景摄像机与屏幕特效

```typescript
scene.cameraFollowSprite(player); // 镜头追随玩家
scene.cameraShake(4, 500);         // 强力震屏 500ms（受伤/爆炸反馈）

// 背景视差滚动 (scroller 扩展)
scroller.setLayerImage(scroller.BackgroundLayer.Layer0, assets.image`sky_bg`);
scroller.setLayerImage(scroller.BackgroundLayer.Layer1, assets.image`mountain_bg`);

// 精灵粒子特效
player.startEffect(effects.fire, 1000); // 身后触发 1秒 火焰粒子
effects.clearParticles(player);          // 强制停掉粒子
```

---

## 18. 高级游戏设计模式 (FSM, Parry, Line-of-sight)

### FSM（有限状态机）对象数据绑定
```typescript
namespace EntityState {
    export const Idle = 0;
    export const Chase = 1;
    export const Attack = 2;
}

sprites.onCreated(SpriteKind.Enemy, function(enemy) {
    sprites.setDataNumber(enemy, "state", EntityState.Idle);
});

game.onUpdate(function() {
    for (let enemy of sprites.allOfKind(SpriteKind.Enemy)) {
        let state = sprites.readDataNumber(enemy, "state");
        if (state === EntityState.Idle) {
            // 距离检测
            if (spriteutils.distanceBetween(enemy, player) < 80) {
                sprites.setDataNumber(enemy, "state", EntityState.Chase);
            }
        } else if (state === EntityState.Chase) {
            enemy.follow(player, 60);
        }
    }
});
```

---

## 19. 硬约束与平台禁区

### 屏幕与颜色
- **分辨率固定为 160x120 像素**。扩展分辨率（如 320x240）只能由特定硬件支持，默认编译务必保证 160x120。
- **调色板固定 16 色**，颜色 `0`（在 img 中表现为 `.`）被指定为透明。

### 性能红线
- 避免在 `game.onUpdate` 内高频执行 `sprites.allOfKind` 或 `sprites.create`，会导致帧率断崖下跌。
- 硬件内存限制：禁止大型循环引用和过深的递归。

---

## 20. 常见 AI 臆造 API 对照速查表

| ❌ AI 臆造 API (严禁使用) | ✅ 正确规范 API | 模块与功能 |
| :--- | :--- | :--- |
| `sprite.flipX = true` 或 `sprite.setFlag(SpriteFlag.FlipX, true)` | `sprite.image.flipX()` (或通过 `let f = sprite.image.clone(); f.flipX(); sprite.setImage(f)` 避免直接修改源图) | 精灵水平翻转 (⚠️警告: `SpriteFlag` 命名空间中不含有 `FlipX` 或 `FlipY`，强行使用会引发编译报错: `Property 'FlipX' does not exist on type 'typeof SpriteFlag'`) |
| `sprite.angle = 90` | 🚫 MakeCode 硬件不支持精灵物理旋转 | 精灵旋转 |
| `game.setBackgroundColor(...)` | `scene.setBackgroundColor(...)` | 设置背景色 |
| `tiles.setTilemap(...)` | `tiles.setCurrentTilemap(...)` | 加载瓦片地图 |
| `timer.setTimeout(fn, ms)` | `timer.after(ms, fn)` | 延迟执行回调 |
| `controller.isPressed("A")` | `controller.A.isPressed()` | 按键即时状态 |
| `music.playMelody("C D E", 120)`| `music.play(music.stringPlayable(...))` | 播放背景音序 |
| `sprites.randomTile(type)` | `tiles.placeOnRandomTile(sprite, type)` | 精灵随机瓦片定位 |
| `sprite.onCreate(...)` | `sprites.onCreated(kind, fn)` | 精灵生命周期监听 |
| `story.dialog(text)` | `story.printDialog(...)` | 剧情打字机气泡 |

---

## 21. 附录：89款真实游戏 API 静态词频与热度排行榜

为了给 AI 开发提供最可靠的“权重参考”，我们对本地 `playground` 中下载克隆的 **89款真实 TypeScript 游戏源码** 进行了全量 API 静态扫描，统计出高频调用排行。

### 命名空间频次排行
在 MakeCode 的各大核心库中，精灵、地图、场景和音效是使用频次最高的核心：
* `sprites`      : 1335 次
* `tiles`        : 934 次
* `scene`        : 675 次
* `music`        : 451 次
* `timer`        : 291 次
* `animation`    : 212 次
* `info`         : 171 次
* `story`        : 101 次
* `statusbars`   : 92 次
* `controller`   : 91 次
* `textsprite`   : 49 次

### 核心 API 函数调用 TOP 25 排行

| 排名 | 核心 API 接口 | 累计调用频次 (89款游戏静态扫描) | 适用场景与关键度说明 |
| :--- | :--- | :--- | :--- |
| 1 | `sprites.create` | 598 | 基础中的基础，所有精灵的唯一实例化通路。 |
| 2 | `timer.after` | 192 | 延迟事件最常用，AI 务必防范其在 `onUpdate` 触发中引发内存泄漏。 |
| 3 | `tiles.setTileAt` | 188 | 动态修改地图核心（如破坏障碍物、清除金币标记）。 |
| 4 | `tiles.getTileLocation` | 181 | 地图瓦片定位，精细网格操作的开始。 |
| 5 | `sprites.onOverlap` | 166 | 物理重叠判定的主力（如伤害、碰撞、射弹击中）。 |
| 6 | `tiles.placeOnTile` | 150 | 将精灵放置在网格中心，防止错位对齐。 |
| 7 | `animation.runImageAnimation` | 150 | 播放玩家/敌人帧动画的最普遍手段。 |
| 8 | `sprites.destroy` | 147 | 清理实体、释放内存必不可少的接口。 |
| 9 | `scene.setTile` | 140 | 给地图瓦片绑定静态贴图和物理阻挡。 |
| 10 | `music.play` | 136 | 音效播放和简谱音序的主力函数。 |
| 11 | `sprites.allOfKind` | 91 | 扫描同类精灵，AI 需注意避免高频全量遍历。 |
| 12 | `tiles.getTilesByType` | 89 | 扫描地图生成点（Spawn Points），关卡初始化的首选。 |
| 13 | `timer.background` | 84 | 用于运行非阻塞的协程或过场剧情流。 |
| 14 | `music.createSoundEffect` | 84 | 程序化合成科幻音效，不占包体，AI 应优先使用。 |
| 15 | `sprites.createProjectileFromSprite` | 82 | 制造子弹、射弹物体的首选快捷函数。 |
| 16 | `scene.setBackgroundColor` | 79 | 场景换关时的背景颜色渲染。 |
| 17 | `statusbars.getStatusBarAttachedTo` | 68 | 获取附加在怪兽或玩家头顶的血条。 |
| 18 | `controller.moveSprite` | 67 | 绑定键盘，极速开始角色的方向物理控制。 |
| 19 | `info.changeScoreBy` | 66 | 改变得分，与游戏胜利和 HUD 动态关联。 |
| 20 | `story.queueStoryPart` | 66 | 组织多段长文本对话框的队列。 |
| 21 | `sprites.readDataNumber` | 53 | 实体附加属性读取，ECS 式的组件解耦技术。 |
| 22 | `scene.onOverlapTile` | 53 | 检测玩家或敌人是否踩到了尖刺、熔岩或传送门。 |
| 23 | `textsprite.create` | 49 | 渲染固定的 UI 文字或得分看板。 |
| 24 | `tiles.setWallAt` | 49 | 动态开启或关闭某些地图瓦片的物理碰撞墙。 |
| 25 | `music.createSong` | 49 | 构造复杂的复音音轨和背景音乐。 |
