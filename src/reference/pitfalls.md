# MakeCode Arcade Pitfalls & postMessage Protocol Reference

本文档总结了在使用和集成 Microsoft MakeCode Arcade 官方编辑器时常见的四个关键坑点及对应的解决方案，并对双向同步时所使用的 `postMessage` 协议字段进行了详细说明。

## 常见坑点 (Common Pitfalls)

### 1. 资源配置文件 `assets.json` 不得为空
* **现象**：当宿主将本地文件推送到 MakeCode 编辑器后，编辑器可能崩溃，显示 "Oops We detected a problem..." 并不断自动刷新。
* **原因**：因为 `assets.json` 作为美术资源（如瓦片图、贴图、精灵）配置文件，如果是一个空文件（0 字节或 1 字节），编辑器内部的 `JSON.parse` 无法解析空字符串，从而抛出未捕获异常导致崩溃。
* **解决**：在初始化和保存时，`assets.json` 的内容必须是合法的 JSON 对象 `"{}"`，不得为空文件。

### 2. `pxt.json` 中的 `files` 数组未声明必需文件
* **现象**：修改或同步代码后，积木编辑器或代码视图发生解析警告、代码丢失或无法渲染。
* **原因**：MakeCode 的编译器和同步逻辑严格依赖依赖树声明。如果本地项目的 `pxt.json` 中的 `files` 数组没有显式声明所有关联的文件，编辑器将无法正确关联并读取它们。
* **解决**：在 `pxt.json` 的 `files` 数组中，必须包含 `"README.md"`, `"main.ts"`, `"main.blocks"`, `"assets.json"` 这几个必需文件。

### 3. 编辑器类型标记错误导致积木加载异常
* **现象**：积木（Blocks）无法正常加载，显示初始化错误或退化成纯代码项目。
* **原因**：在宿主向编辑器发起同步握手推送项目头信息（header）时，如果将项目类型错误标记为纯 TypeScript 格式（例如 `editor: "tsprj"`），会导致编辑器忽略 `main.blocks` 中的积木信息。
* **解决**：将推送给编辑器的 header 里的 `editor` 属性明确设置为 `"blocksprj"`（Blocks项目），以便积木与 TypeScript 代码可以双向正常翻译和加载。

### 4. iframe 加载官方地址时遭遇 404
* **现象**：使用 `https://arcade.makecode.com/index.html?controller=1` 时页面直接返回 404 导致 iframe 挂起白屏。
* **原因**：微软官方在线版会安全过滤或缓存拦截带有 `index.html` 路径的请求。
* **解决**：iframe.src 请求应当使用纯净的根域名路径，即 `https://arcade.makecode.com/?controller=1`（不要带 `index.html`）。

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
- **宿主响应**：宿主收到后，读取本地文件列表并回复。回复消息也需要包含相同的 `type: "pxthost"` 和 `action: "workspacesync"`，同时附带 `projects` 数组，指定 `header`（包括 `editor: "blocksprj"` 等字段）和 `text`（包含文件名与文件内容的键值对）。

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
