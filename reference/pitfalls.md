# MakeCode Arcade Pitfalls & postMessage Protocol Reference

本文档总结了在使用和集成 Microsoft MakeCode Arcade 官方编辑器时常见的四个关键坑点及对应的解决方案，并对双向同步时所使用的 `postMessage` 协议字段进行了详细说明。

## 常见坑点 (Common Pitfalls)

### 1. 资源配置文件 `assets.json` 不得为空
* **现象**：当宿主将本地文件推送到 MakeCode 编辑器后，编辑器可能崩溃，显示 "Oops We detected a problem..." 并不断自动刷新。
* **原因**：因为 `assets.json` 作为美术资源（如瓦片图、贴图、精灵）配置文件，如果是一个空文件（0 字节或 1 字节），编辑器内部的 `JSON.parse` 无法解析空字符串，从而抛出未捕获异常导致崩溃。
* **解决**：在初始化和保存时，`assets.json` 的内容必须是合法的 JSON 对象 `"{}"`，不得为空文件。

### 2. `pxt.json` 中的 `files` 数组必须与实际文件一致
* **现象**：修改或同步代码后，编辑器解析警告、代码丢失或无法渲染。
* **原因**：MakeCode 的同步逻辑严格依赖 `files` 声明。`files` 数组里列出的文件必须都真实存在，反之磁盘上要被编辑器读取的文件也必须在 `files` 里声明，否则关联错乱。
* **解决**：纯 TypeScript 工作流（本项目默认）声明 `["main.ts", "README.md", "assets.json"]` 即可，**不要列入 `main.blocks`**（见坑 3）。

### 3. ⚠️ 不要推送空的 `main.blocks` / 不要用 `blocksprj`（真机验证纠正）
* **现象**：编辑器加载成功、文件也同步进去了（README 能显示），**但代码区一片空白，看似一个全新空项目**。
* **原因**：只要项目里存在 `main.blocks` 文件，编辑器就默认打开**积木（Blocks）视图**；而 AI 生成的代码在 `main.ts` 里、`main.blocks` 是空的，于是积木画布空白、`main.ts` 不显示，且 MakeCode **不会**在加载时自动把 TS 反编译成积木。仅改 header 的 `editor` 字段无法纠正——`main.blocks` 的存在会压倒它。
* **解决**：做**纯 TypeScript 项目**——磁盘上**不要 `main.blocks`**、`files` 里也不列它，header 用 `editor: "tsprj"`、`pxt.json` 的 `preferredEditor: "tsprj"`。编辑器即会开在 JavaScript 视图并显示 `main.ts`。
* **教训**：握手成功（编辑器请求 `/api/project`）发生在加载早期，**不等于代码渲染成功**。验证一定要确认编辑器里**真的出现了代码**，否则空白项目会假阳性蒙混过关。`aca check` 已据此加强为两关：握手 + 渲染。

### 4. iframe 加载官方地址时遭遇 404
* **现象**：使用 `https://arcade.makecode.com/index.html?controller=1` 时页面直接返回 404 导致 iframe 挂起白屏。
* **原因**：微软官方在线版会安全过滤或缓存拦截带有 `index.html` 路径的请求。
* **解决**：iframe.src 请求应当使用纯净的根域名路径，即 `https://arcade.makecode.com/?controller=1`（不要带 `index.html`）。

### 5. ⚠️ tilemap 用内联 `img` 当图块 → 编辑器崩溃（实测确认）
* **现象**：`tiles.createTilemap(hex`...`, img`...`, [tileA, tileB], TileScale.Sixteen)` 里把 `tileA/tileB` 写成**内联 `img` 变量**，编辑器加载后崩溃，弹 "Oops, we detected a problem..." 并不断重载。
* **原因**：编辑器的 tilemap 字段编辑器会尝试把 `createTilemap` 反编译成可视化地图控件，它只认**命名图块资源**（`myTiles.xxx` / 内置 `sprites.castle.xxx`），遇到随手写的内联 img 图块就解析崩溃。
* **解决**：地图走两条可靠路线之一（见 arcade-api.md 第 7 节）：
  1. **命名地图** `tiles.setTilemap(tilemap`level`)`——编辑器自动创建空地图，人画好后同步回磁盘；
  2. **内置图块** `createTilemap(..., [sprites.castle.tileGrass1, ...], ...)`——图块用自带图库，不要内联 img。
* **补充**：图块/地图数据最终以 base64 的 F4 图片格式存进 `tilemap.g.jres`，由 `tilemap.g.ts` 声明命名空间——这些是编辑器生成的，AI 不要手写 jres。

### 6. ❌ AI 常见臆造 API —— 这些在 Arcade 里根本不存在

AI 容易凭感觉写出听起来合理但 Arcade 没有的 API，导致红色报错。**遇到报错先对照这张表，再查 arcade-api.md。**

| AI 写的（❌ 不存在） | 正确写法 | 备注 |
|---|---|---|
| `sprite.flipX = true` | `sprite.setFlag(SpriteFlag.FlipX, true)` | 翻转用 flag，不是属性赋值 |
| `sprite.flipY = true` | `sprite.setFlag(SpriteFlag.FlipY, true)` | 同上 |
| `sprite.flip(true)` | `sprite.setFlag(SpriteFlag.FlipX, true)` | 无 flip() 方法 |
| `effects.xxx.createParticlesAt(x, y)` | `effects.xxx.startScreenAnimation(200)` | 全屏特效，无 createParticlesAt |
| `sprite.collidesWith(other)` | `sprite.overlapsWith(other)` 或 `sprites.onOverlap(KindA, KindB, fn)` | 方法名是 overlapsWith，不是 collidesWith；持续碰撞用事件 |
| `sprite.angle = 90` | Arcade 不支持精灵旋转 | 屏幕太小，无旋转 API |
| `sprite.scale = 2` | `sprite.setScale(2, ScaleAnchor.Center)` | 缩放用 setScale() |
| `scene.addSprite(s)` | `sprites.create(img, kind)` 已自动加入场景 | 无需手动 addSprite |
| `music.playSound("...")` | `music.play(music.melodyPlayable(music.baDing), ...)` | 无字符串音效名，用内置常量 |
| `music.playMelody("C D E", 120)` | `music.play(music.stringPlayable("C D E", 120), ...)` | playMelody 已废弃 |
| `info.lives` | `info.life()` | 是函数调用不是属性 |
| `info.score` | `info.score()` | 同上 |
| `game.setBackgroundColor(c)` | `scene.setBackgroundColor(c)` | 在 scene 不在 game |
| `tiles.setTilemap(...)` | `tiles.setCurrentTilemap(...)` | 函数名不同 |
| `timer.setTimeout(fn, ms)` | `timer.after(ms, fn)` | 参数顺序且需要 timer 依赖 |
| `controller.isPressed("A")` | `controller.A.isPressed()` | 用对象属性不用字符串 |
| `sprites.randomTile(tile)` | `tiles.placeOnRandomTile(sprite, tile)` | 在 tiles 命名空间 |
| `sprite.onCreate(fn)` | `sprites.onCreated(kind, fn)` | 全局事件，不是精灵方法 |
| `story.dialog(text)` | `story.printDialog(text, x, y, w, h, ...)` | 需要完整参数 |

| `scene.backgroundColor(9)` | `scene.setBackgroundColor(9)` 或 `scene.setBackgroundColor(game.Color.LightBlue)` | 用 game.Color 枚举避免魔法数字 |

**通用原则**：Arcade TypeScript API 和浏览器 JS / Node.js / Phaser 都不一样，**不要凭经验猜**。写前先查 `reference/arcade-api.md`；写完看 `.aca-status` 确认编译结果。

---

## postMessage 协议字段参考

在宿主与嵌入的 MakeCode iframe 通信中，所有的消息都是通过 HTML5 的 `postMessage` 协议进行的，通常使用 `type: "pxthost"` 来标识由宿主环境与编辑器之间的 workspace 级交互。

### 1. `workspacesync` (同步请求)
当编辑器 iframe 初始化加载完成后，它会向宿主发送一个 `action: "workspacesync"` 的消息，向宿主请求本地代码文件。
- **消息发送方**：编辑器 iframe -> 宿主 window
- **格式**：
  ```json
  {
    "type": "pxthost",
    "action": "workspacesync"
  }
  ```
- **宿主响应**：宿主收到后，读取本地文件列表并回复。回复消息也需要包含相同的 `type: "pxthost"` 和 `action: "workspacesync"`，同时附带 `projects` 数组，指定 `header`（其中 `editor: "tsprj"`，见坑 3）和 `text`（包含文件名与文件内容的键值对）。

### 2. `workspacesave` (保存请求)
当用户在编辑器中拖拽积木或编辑代码发生改变时，编辑器会触发自动保存，并向宿主发送一个 `action: "workspacesave"` 的消息。
- **消息发送方**：编辑器 iframe -> 宿主 window
- **格式**：
  ```json
  {
    "type": "pxthost",
    "action": "workspacesave",
    "project": {
      "header": { ... },
      "text": {
        "main.ts": "...",
        "assets.json": "...",
        "pxt.json": "..."
      }
    }
  }
  ```
- **宿主处理**：宿主接收到此消息后，解析出其中的 `project.text`，并将其中的文件写回本地磁盘，随后宿主通过暂停监听文件变化来避免写盘引发的回声现象（watcher echo）。
