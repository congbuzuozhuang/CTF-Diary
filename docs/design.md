# CTF Diary — 技术设计文档

> 版本: v1.0 | 日期: 2026-06-02 | 状态: 已完成

---

## 1. 技术选型

| 层 | 技术 | 理由 |
|---|------|------|
| **桌面框架** | Electron 33 | 跨平台桌面应用 |
| **前端框架** | Vue 3 + Composition API | 组件化开发 |
| **构建工具** | electron-vite 2 | Electron + Vite 集成 |
| **样式** | Tailwind CSS 3 | 原子化 CSS |
| **状态管理** | Pinia | Vue 3 官方推荐 |
| **路由** | Vue Router 4 | SPA 页面切换 |
| **数据库** | better-sqlite3 12 | 同步 API，主进程友好 |
| **Markdown** | markdown-it + highlight.js | 渲染 + 代码高亮 |
| **编辑器** | CodeMirror 6 | Markdown / Python 编辑 |
| **打包** | electron-builder 25 | NSIS 安装包 |
| **语言** | TypeScript 5 | 类型安全 |

## 2. 项目结构

```
ctf-diary/
├── src/
│   ├── main/                          # Electron 主进程
│   │   ├── index.ts                   # 入口：窗口管理 + 生命周期
│   │   ├── db/
│   │   │   └── index.ts               # SQLite 初始化 + 迁移 + 默认值
│   │   ├── ipc/                       # IPC 处理器（每个文件一个模块）
│   │   │   ├── app.ts                 # app:getVersion / app:openExternal
│   │   │   ├── competition.ts         # 比赛 CRUD + CTFtime 拉取
│   │   │   ├── data.ts                # 数据统计 + 清理（v1.0 新增）
│   │   │   ├── dialog.ts              # 文件选择 / 图片选择 对话框
│   │   │   ├── diary.ts               # 打卡 CRUD + 连续天数统计
│   │   │   ├── files.ts               # 文件读写 + 目录遍历 + 导入
│   │   │   ├── python.ts              # Python 版本检测 + 脚本执行
│   │   │   └── settings.ts            # 设置读写（key-value）
│   │   ├── services/
│   │   │   ├── ctftime.ts             # CTFtime API (https.get + JSON)
│   │   │   └── filesystem.ts          # 文件系统操作封装
│   │   └── utils/
│   │       └── paths.ts               # 数据目录 / 比赛目录 / 背景图路径
│   │
│   ├── preload/
│   │   └── index.ts                   # contextBridge API（类型安全）
│   │
│   ├── renderer/                      # Vue 前端（electron-vite 渲染进程）
│   │   ├── main.ts                    # Vue 入口：createApp → mount
│   │   ├── App.vue                    # 根组件：Background + MainLayout + RouterView
│   │   ├── router/
│   │   │   └── index.ts               # 路由表（7 个路由）
│   │   ├── stores/
│   │   │   ├── competitions.ts        # 比赛列表 / CTFtime 拉取 / participate
│   │   │   ├── diary.ts               # 打卡列表 / 统计 / checkIn
│   │   │   ├── files.ts               # 文件树 / 读写
│   │   │   └── settings.ts            # 设置 CRUD + 主题/透明度应用
│   │   ├── types/
│   │   │   ├── index.ts               # TypeScript 类型定义
│   │   │   └── electron.d.ts          # window.api 类型声明
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.vue     # Sidebar + TopBar + 内容区
│   │   │   │   ├── Sidebar.vue        # 左侧导航（6 项 + 折叠）
│   │   │   │   └── TopBar.vue         # 顶部栏（标题 + 打卡状态）
│   │   │   ├── common/
│   │   │   │   └── Background.vue     # 背景图片层
│   │   │   ├── editor/
│   │   │   │   ├── MdEditor.vue       # CodeMirror 6 Markdown/Python 编辑器
│   │   │   │   ├── MdPreview.vue      # markdown-it 预览
│   │   │   │   └── CodeViewer.vue     # 只读代码查看器（Python 高亮）
│   │   │   └── files/
│   │   │       ├── FileTree.vue       # 递归文件树容器
│   │   │       └── FileTreeNode.vue   # 单个树节点（展开/折叠/图标）
│   │   ├── views/
│   │   │   ├── Dashboard.vue          # 首页：统计卡片 + 近期比赛 + 快捷入口
│   │   │   ├── Competitions.vue       # 比赛管理：CTFtime / 参加 / 已结束
│   │   │   ├── CompetitionDetail.vue  # 比赛详情：元信息 + 文件 + 笔记
│   │   │   ├── FileManager.vue        # 文件管理：树 + 预览 + 拖拽导入
│   │   │   ├── Editor.vue             # 编辑器：Markdown/Python 编辑 + 运行
│   │   │   ├── Diary.vue              # 日志打卡：日历 + 日志编辑 + 标签
│   │   │   └── Settings.vue           # 设置：背景/主题/透明度/数据管理
│   │   └── assets/
│   │       └── styles/
│   │           └── main.css           # 全局样式 + CSS 变量 + 组件类
│
├── index.html                         # HTML 入口（class="light"）
├── electron.vite.config.ts            # electron-vite 构建配置
├── tailwind.config.ts                 # Tailwind CSS 配置
├── postcss.config.mjs                 # PostCSS 配置
├── package.json                       # 依赖 + electron-builder 打包配置
├── tsconfig.json                      # TypeScript 根配置（solution 模式）
├── tsconfig.node.json                 # 主进程 + preload 的 TS 配置
├── tsconfig.web.json                  # 渲染进程的 TS 配置
├── env.d.ts                           # Vite 环境变量类型
├── test-electron.js                   # Electron 启动测试脚本
└── docs/                              # 文档
    ├── spec.md                        # 功能规格说明书
    ├── design.md                      # 技术设计文档（本文件）
    └── tasks.md                       # 开发任务拆解
```

> **注意**：编译产出在 `out/` 目录，打包产物在 `release/` 目录，均不提交到版本控制。

## 3. 数据流

```
┌──────────────────────────────────────────────────┐
│                    Renderer (Vue 3)               │
│                                                    │
│   Components ←→ Pinia Stores ←→ window.api.*      │
└──────────────────────┬───────────────────────────┘
                       │  contextBridge
                       │  ipcRenderer.invoke()
┌──────────────────────┴───────────────────────────┐
│                 Preload (src/preload/index.ts)      │
│   window.api.competitions.getList()               │
│   window.api.files.readDir()                      │
│   window.api.diary.checkIn()                      │
│   window.api.python.runScript()                   │
│   window.api.settings.get() / .set()              │
│   window.api.data.getStats() / .clear*()          │
└──────────────────────┬───────────────────────────┘
                       │  ipcMain.handle()
┌──────────────────────┴───────────────────────────┐
│               Main Process (Node.js)               │
│                                                    │
│   IPC Handlers ──→ Services ──→ DB / FS / Shell   │
│                                                    │
│   ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│   │ SQLite   │  │   File   │  │ Python       │   │
│   │ (better- │  │  System  │  │ child_process│   │
│   │ sqlite3) │  │  (fs)    │  │ .spawn()     │   │
│   └──────────┘  └──────────┘  └──────────────┘   │
└──────────────────────────────────────────────────┘
```

关键设计决策：
- **同步 SQLite**：`better-sqlite3` 提供同步 API，比异步 `sqlite3` 更适合 Electron 主进程
- **WAL 模式**：`journal_mode = WAL` 允许并发读写，不会阻塞渲染进程
- **contextBridge**：渲染进程不直接访问 Node.js API，所有系统调用通过 `ipcRenderer.invoke()` 经 preload 转发
- **包内文件排除**：`package.json` 的 `build.files` 只包含 `out/**/*`，`node_modules/better-sqlite3` 由 electron-builder 自动包含

## 4. 路由设计

| 路径 | 页面组件 | 说明 |
|------|---------|------|
| `/` | Dashboard | 首页：统计卡片 + 近期比赛 + 快捷入口 |
| `/competitions` | Competitions | 比赛管理：CTFtime 列表 / 我的比赛 / 已结束 |
| `/competitions/:id` | CompetitionDetail | 比赛详情：元信息 + 文件 + 笔记 |
| `/files` | FileManager | 文件管理：按比赛分组的文件树 + 预览 |
| `/editor/:type/:id?` | Editor | 编辑器：type=markdown|python，可传入文件路径 |
| `/diary` | Diary | 日志打卡：日历 + Markdown 编辑 + 标签/心情 |
| `/settings` | Settings | 设置：背景/主题/透明度/数据管理 |

## 5. 数据库设计

```sql
-- 比赛表
CREATE TABLE competitions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ctftime_id  INTEGER,           -- CTFtime API ID（唯一索引）
  name        TEXT NOT NULL,
  start_date  TEXT,               -- ISO 8601
  end_date    TEXT,
  url         TEXT,
  format      TEXT,               -- Jeopardy / Attack-Defense / Mixed
  weight      REAL,
  status      TEXT DEFAULT 'upcoming',  -- upcoming/running/participating/finished
  directory   TEXT,               -- 本地目录路径
  notes       TEXT,
  created_at  TEXT DEFAULT (datetime('now', 'localtime'))
);
CREATE UNIQUE INDEX idx_competitions_ctftime_id ON competitions(ctftime_id);

-- 打卡表
CREATE TABLE checkins (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT UNIQUE NOT NULL,   -- YYYY-MM-DD
  content     TEXT,                   -- Markdown 格式日志
  tags        TEXT DEFAULT '[]',      -- JSON 数组
  mood        TEXT DEFAULT '',        -- emoji
  created_at  TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 文件标签表
CREATE TABLE file_tags (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path       TEXT NOT NULL,
  tag             TEXT NOT NULL,
  competition_id  INTEGER REFERENCES competitions(id) ON DELETE CASCADE
);

-- 设置表（key-value）
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- 默认值: theme='light', font_size='16', language='zh', background_image='', card_opacity='0.85'
```

## 6. 数据目录结构

```
{userData}/                              # 开发模式: {project}/data/  生产模式: %APPDATA%/ctf-diary/
├── ctf-diary.db                         # SQLite 数据库文件
├── backgrounds/                         # 用户上传的自定义背景图
│   └── custom_<timestamp>.jpg
└── competitions/                        # 比赛文件
    └── {competition_id}/                # 每场比赛一个目录
        ├── pwn/                         # PWN 题目附件
        ├── re/                          # RE 题目附件
        └── notes/                       # 笔记文件
```

## 7. CSS 主题系统

### 7.1 CSS 变量（定义在 `src/assets/styles/main.css`）

主题使用 CSS 自定义属性实现，默认浅色模式，通过 `<html class="dark">` 切换到暗色：

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #e2e8f0;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --border-color: #e2e8f0;
  --border-hover: #cbd5e1;
  --accent: #3b82f6;
  --accent-hover: #2563eb;

  /* 卡片透明度系统 */
  --card-bg-rgb: 255, 255, 255;
  --card-opacity: 0.85;
  --card-bg: rgba(var(--card-bg-rgb), var(--card-opacity));
  --card-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
}

:root.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  /* ... 暗色覆盖 ... */
}
```

### 7.2 组件类

| 类名 | 用途 | 特性 |
|------|------|------|
| `.card` | 卡片容器 | 毛玻璃背景、圆角、阴影、主题自适应 |
| `.btn-primary` | 主要按钮 | 蓝色背景、白色文字、按下缩放 |
| `.btn-secondary` | 次要按钮 | 主题自适应背景/文字 |
| `.btn-ghost` | 幽灵按钮 | 仅 hover 时显示背景 |
| `.input` | 输入框 | 主题自适应背景/边框/focus ring |

### 7.3 卡片透明度

通过 JS 设置 `document.documentElement.style.setProperty('--card-opacity', value)` 实现。
`--card-bg` 通过 `rgba(var(--card-bg-rgb), var(--card-opacity))` 自动重新计算。
滑块范围 40% ~ 100%，默认 85%，实时生效。

## 8. CTFtime 集成

- **API**: `https://ctftime.org/api/v1/events/?limit=100`
- **调用方式**: 主进程 `https.get()`（渲染进程不能跨域请求）
- **数据持久化**: `ON CONFLICT(ctftime_id) DO UPDATE` upsert 策略
- **状态推断**: 根据 `start`/`finish` 时间自动标记 `upcoming`/`running`/`finished`
- **事务保护**: 批量写入使用 `db.transaction()`

## 9. 打包配置

```json
{
  "build": {
    "appId": "com.ctf.diary",
    "productName": "CTF Diary",
    "directories": { "output": "release" },
    "files": ["out/**/*"],
    "win": { "target": [{ "target": "nsis", "arch": ["x64"] }] },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "artifactName": "CTF-Diary-Setup-${version}.${ext}"
    },
    "asar": false
  }
}
```

- **asar: false** — 必须，因为 `better-sqlite3` 是原生模块，需要真实文件路径
- **files** — 只包含 `out/**/*`，dependencies（better-sqlite3, markdown-it, highlight.js）由 electron-builder 自动包含
- **NSIS** — 标准安装程序，可选安装路径

## 10. 开发命令

```bash
npm run dev          # 开发模式（HMR）
npm run build        # 编译（electron-vite build）
npm run package      # 编译 + 打包 NSIS 安装包
npm run postinstall  # 重新编译原生模块（better-sqlite3）
```

## 11. 常见问题

### Q: 修改 .ts 源码后编译没变化？
A: 检查 `src/` 下是否有残留的 `.js` 文件（某次 tsc 编译产物），Vite 会优先使用 `.js`。

### Q: 打包后提示找不到 better-sqlite3？
A: 确保 `asar: false`，且 `build.files` 没有 `!node_modules/**/*` 排除规则。

### Q: 启动慢？
A: NSIS 安装版比 portable 版启动快（无需每次解压）。首次启动需加载 Electron + SQLite，正常约 2-3 秒。
