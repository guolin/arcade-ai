# MakeCode Arcade Limits & Unsupported JS Features

Microsoft MakeCode Arcade 专为复古的 8-bit 和 16-bit 掌机设计。虽然它支持使用 TypeScript (JavaScript) 编写游戏，但其底层的物理硬件运行环境、编译器和渲染器都引入了许多限制。

## 1. 硬件与显示限制

- **屏幕分辨率 (Screen Resolution)**：
  固定为 **160 x 120 像素**。所有精灵坐标、屏幕尺寸和瓦片大小都是基于该分辨率进行布局。
- **16 色调色板 (16-Color Palette)**：
  底层是 4-bit 颜色深度（Color Depth）。仅支持固定包含 16 种颜色的经典 MS MakeCode Arcade 调色板。
  * 颜色 `0`（在 img 中通常写作 `.`）代表透明色。
  * 精灵图象（Image 字面量）中只能使用这 16 种字符代码（如 `.`, `1`-`9`, `a`-`f`）来代表不同的颜色。

## 2. 内存与精灵数量限制

在运行模拟器或部署在实体 Arcade 硬件（如 PyGamer、PyBadge、Meowbit 等）上时，面临着极度受限的运行资源：
- **精灵数量上限 (Sprite Count)**：
  通常在硬件上不建议同时存在超过 **30-50 个活动的精灵**，否则垃圾回收（Garbage Collection）和每帧碰撞检测会导致帧率骤降。
- **内存限制 (Memory Limit)**：
  微控制器通常仅有 96KB - 512KB 的 RAM。在 TypeScript 中创建大量的动态数组或嵌套深层对象，或者在循环中频繁实例化临时对象，很容易导致内存溢出崩溃。

## 3. 不支持的 JavaScript (TypeScript) 语言特性

MakeCode 拥有自定义的 TypeScript-to-C++ (Static TypeScript) 编译器。它**不包含完整的 JS 运行时环境**（如 V8 或 QuickJS），所以以下特性是不支持或受到极大限制的：

- **Async / Await 和 Promise**：
  MakeCode 底层采用轻量级的绿色线程（Fiber）协同运行。原生的 `async/await` 语法和 `Promise` 对象是**不支持**的。
  * *替代方案*：如果需要延迟，请使用 MakeCode 内置的 `pause(ms)` API 挂起当前协程。
- **内置数据结构限制**：
  不支持 `Map`、`Set` 以及 `WeakMap` / `WeakSet`。
  * *替代方案*：使用普通的对象 `{ [key: string]: val }` 或数组进行简单的 key-value 映射。
- **未实现的 JS API**：
  由于本地无标准的 Web 浏览器环境，任何浏览器和 Node.js 原生的 API（如 `window`, `document`, `fetch`, `console.log` 的完整版，以及任何 DOM 或 Node 内置库）在 Arcade 运行时内均不可用。
- **动态特性限制**：
  - 不支持 `eval()`、`new Function()` 等动态代码执行。
  - 不支持 `Object.defineProperty` 或 `Proxy` 拦截。
