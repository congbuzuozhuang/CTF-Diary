# CTF Diary — 技术设计文档

> 版本: v1.4 | 日期: 2026-06-04 | 状态: 已实现

---

## 1. 技术选型

| 层 | 技术 | 理由 |
|---|------|------|
| **桌面框架** | Electron 33 | 跨平台桌面应用 |
| **前端框架** | Vue 3 + Composition API | 组件化开发 |
| **构建工具** | electron-vite 5 | Electron + Vite 集成 |
| **样式** | Tailwind CSS 3 | 原子化 CSS |
| **状态管理** | Pinia | Vue 3 官方推荐 |
| **路由** | Vue Router 4 | SPA 页面切换 |
| **数据库** | better-sqlite3 12 | 同步 API，主进程友好 |
| **Markdown** | markdown-it + highlight.js | 渲染 + 代码高亮 |
| **编辑器** | CodeMirror 6 + @lezer/highlight | Markdown / Python 编辑，主题可切换 |
| **打包/压缩** | archiver 6 | ZIP 压缩导出（必须 v6，v7 是 ESM only） |
| **打包** | electron-builder 25 | NSIS 安装包 |
| **语言** | TypeScript 5 | 类型安全 |

## 2. 项目结构

```
ctf-diary/
├── src/
│   ├── main/                          # Electron 主进程
│   │   ├── index.ts                   # 入口：无边框窗口 + 生命周期 + 启动通知检查
│   │   ├── db/
│   │   │   └── index.ts               # SQLite 初始化 + 迁移 + 默认值
│   │   ├── ipc/                       # IPC 处理器（每个文件一个模块）
│   │   │   ├── app.ts                 # app:getVersion / window:* 控制 / openExternal
│   │   │   ├── challenges.ts          # 题目 CRUD + 状态更新 + compSolved 自动推导
│   │   │   ├── competition.ts         # 比赛 CRUD + CTFtime 拉取 + 手动创建
│   │   │   ├── data.ts                # 数据统计 + 清理（FS+DB 双删）
│   │   │   ├── dialog.ts              # 文件选择 / 图片选择 / 文件夹选择
│   │   │   ├── diary.ts               # 打卡 CRUD + 连续天数统计
│   │   │   ├── files.ts               # 文件读写 + 目录遍历 + 导入 + 创建目录 + 导出(含ZIP)
│   │   │   ├── notifications.ts       # 比赛临近原生通知（启动检查 + 去重）
│   │   │   ├── cves.ts                # CVE CRUD + 目录初始化
│   │   │   ├── docker.ts              # Docker CLI 封装（镜像/容器管理）
│   │   │   ├── python.ts              # Python 版本检测 + 脚本执行
│   │   │   └── settings.ts            # 设置读写（key-value）
│   │   ├── services/
│   │   │   ├── ctftime.ts             # CTFtime API (https.get + JSON)
│   │   │   └── filesystem.ts          # 文件系统操作封装
│   │   └── utils/
│   │       └── paths.ts               # 数据目录 / 比赛目录 / config.json 自定义路径
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
│   │   │   ├── challenges.ts          # 题目 CRUD + 进度计算
│   │   ├── cves.ts                # CVE 状态 + 严重程度/状态辅助
│   │   └── docker.ts              # Docker 可用性 + 镜像列表 + 容器状态 + 状态图标/标签
│   │   │   ├── competitions.ts        # 比赛列表 / CTFtime 拉取 / participate
│   │   │   ├── diary.ts               # 打卡列表 / 统计 / checkIn
│   │   │   ├── editorTabs.ts          # 编辑器多标签页状态
│   │   │   ├── files.ts               # 文件树 / 多比赛文件组
│   │   │   └── settings.ts            # 设置 CRUD + 主题/透明度应用
│   │   ├── types/
│   │   │   ├── index.ts               # TypeScript 类型定义（含 Challenge, AppSettings）
│   │   │   └── electron.d.ts          # window.api 类型声明
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.vue     # Sidebar + TopBar + 内容区（flex column 布局）
│   │   │   │   ├── Sidebar.vue        # 左侧导航（6 项 + 折叠）
│   │   │   │   └── TopBar.vue         # 自定义标题栏（拖拽 + 窗口控制 + 打卡状态）
│   │   │   ├── common/
│   │   │   │   └── Background.vue     # 背景图片层（CSS 变量覆盖层）
│   │   │   ├── editor/
│   │   │   │   ├── MdEditor.vue       # CodeMirror 6（亮/暗主题适配、行号、补全、scroller 填满）
│   │   │   │   ├── MdPreview.vue      # markdown-it 预览（代码高亮 + 表格）
│   │   │   │   ├── CodeViewer.vue     # 只读代码查看器
│   │   │   │   └── cmTheme.ts         # 自定义亮色主题（蓝色光标、灰蓝选中）
│   │   │   └── files/
│   │   │       ├── FileTree.vue       # 递归文件树容器（传递 challengePathMap）
│   │   │       └── FileTreeNode.vue   # 单个树节点（展开/折叠/状态图标）
│   │   ├── views/
│   │   │   ├── Dashboard.vue          # 首页：统计卡片 + 近期比赛 + 快捷入口
│   │   │   ├── Competitions.vue       # 比赛管理：赛事 / 参加 / 已解决 / 已结束 + 手动创建弹窗
│   │   │   ├── CompetitionDetail.vue  # 比赛详情：进度条 + 题目列表 + 附件 + 导出
│   │   │   ├── FileManager.vue        # 文件管理：多比赛展开 + 新建题目 + 导出 + 删除确认
│   │   │   ├── Editor.vue             # 编辑器：多标签页 + 文件树侧栏 + 状态栏
│   │   │   ├── Diary.vue              # 日志打卡：日历 + 日志编辑 + 标签
│   │   │   └── Settings.vue           # 设置：背景/主题/透明度/存储路径/通知/数据管理
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
│   window.api.challenges.create()                  │
│   window.api.files.readDir()                      │
│   window.api.diary.checkIn()                      │
│   window.api.python.runScript()                   │
│   window.api.settings.get() / .set()              │
│   window.api.data.getStats() / .clear*()          │
│   window.api.window.minimize/maximize/close       │
│   window.api.dialog.open*()                       │
│   window.api.notifications.checkNow()             │
│   window.api.config.getCompetitionsDir()          │
│   window.api.export_.competition() / .challenge()  │
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
│                                                    │
│   ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│   │ archiver │  │ Electron │  │ config.json  │   │
│   │ (ZIP)    │  │ Notifi-  │  │ (自定义路径)  │   │
│   │          │  │ cation   │  │              │   │
│   └──────────┘  └──────────┘  └──────────────┘   │
└──────────────────────────────────────────────────┘
```

关键设计决策：
- **同步 SQLite**：`better-sqlite3` 提供同步 API，比异步 `sqlite3` 更适合 Electron 主进程
- **WAL 模式**：`journal_mode = WAL` 允许并发读写，不会阻塞渲染进程
- **contextBridge**：渲染进程不直接访问 Node.js API，所有系统调用通过 `ipcRenderer.invoke()` 经 preload 转发
- **无边框窗口**：`frame: false, titleBarStyle: 'hidden'`，自定义窗口控件通过 IPC 控制
- **编辑器主题**：通过 Vue `:key` 绑定强制重建 CodeMirror 实例来切换亮/暗主题
- **编辑器填满**：MainLayout 使用 `flex flex-col` 布局，slot 容器设 `flex-1 min-h-0`，确保 `h-full` 能正确解析

## 4. 路由设计

| 路径 | 页面组件 | 说明 |
|------|---------|------|
| `/` | Dashboard | 首页：统计卡片 + 近期比赛 + 快捷入口 |
| `/competitions` | Competitions | 比赛管理：CTFtime 列表 / 我的比赛 / 已结束 / 已解决 |
| `/competitions/:id` | CompetitionDetail | 比赛详情：进度条 + 题目列表 + 附件 + 导出 + 笔记 |
| `/files` | FileManager | 文件管理：按比赛分组文件树 + 题目状态图标 + 导出 |
| `/editor/:type/:id?` | Editor | 编辑器：类型=markdown\|file\|notes，支持多标签页 |
| `/diary` | Diary | 日志打卡：日历 + Markdown 编辑 + 标签/心情 |
| `/settings` | Settings | 设置：背景/主题/透明度/存储路径/通知/数据管理 |

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
  solved      INTEGER DEFAULT 0,       -- 题目全部解决后自动设为 1
  directory   TEXT,               -- 本地目录路径
  notes       TEXT,
  created_at  TEXT DEFAULT (datetime('now', 'localtime'))
);
CREATE UNIQUE INDEX idx_competitions_ctftime_id ON competitions(ctftime_id);

-- 题目表 (v1.1)
CREATE TABLE challenges (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  competition_id  INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,           -- 题目名称，如 "baby-bof"
  category        TEXT DEFAULT '',         -- pwn / re / web / crypto / misc
  status          TEXT DEFAULT 'unsolved', -- unsolved / attempting / solved
  directory       TEXT,                    -- 题目文件夹路径
  notes           TEXT,
  created_at      TEXT DEFAULT (datetime('now', 'localtime'))
);

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
-- 默认值: theme='light', font_size='16', language='zh', background_image='',
--         card_opacity='0.85', notify_enabled='true', notify_before_days='3'
```

## 6. 数据目录结构

```
{userData}/                              # 开发模式: {project}/data/  生产模式: %APPDATA%/ctf-diary/
├── ctf-diary.db                         # SQLite 数据库文件
├── config.json                          # 自定义路径配置（可选）
├── backgrounds/                         # 用户上传的自定义背景图
│   └── custom_<timestamp>.jpg
└── competitions/                        # 比赛文件（可通过 config.json 重定向）
    └── {competition_id}/                # 每场比赛一个目录
        ├── pwn/                         # PWN 分类
        │   ├── baby-bof/                # 题目文件夹（Challenge）
        │   │   ├── exploit.py
        │   │   └── notes.md
        │   └── heap-master/             # 另一个题目文件夹
        ├── re/                          # RE 分类
        │   └── crackme/
        └── notes/                       # 通用笔记
            └── summary.md
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
  --card-bg-rgb: 255, 255, 255;
  --card-opacity: 0.85;
  --card-bg: rgba(var(--card-bg-rgb), var(--card-opacity));
  --card-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
  --bg-overlay: rgba(255, 255, 255, 0.7);
}

:root.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --bg-overlay: rgba(15, 23, 42, 0.8);
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

### 7.4 CodeMirror 主题

编辑器使用两套主题跟随 app 明暗切换：

| 模式 | 主题 | 来源 |
|------|------|------|
| 亮色 | 自定义亮色主题 | [cmTheme.ts](../src/components/editor/cmTheme.ts) |
| 暗色 | oneDark | `@codemirror/theme-one-dark` |

切换时通过 Vue `:key` 绑定强制重建 EditorView 实例。

### 7.5 编辑器高度填满

MainLayout 使用 `flex flex-col` 布局方案：
- `<main>` 设 `display: flex; flex-direction: column; overflow: hidden`
- slot 容器设 `flex-1 min-h-0 overflow-y-auto`
- 编辑器设 `h-full`，由于父级有确定高度，可正确解析
- CodeMirror `.cm-scroller` 设 `height: 100% !important` 确保内部填充

## 8. CTFtime 集成

- **API**: `https://ctftime.org/api/v1/events/?limit=100`
- **调用方式**: 主进程 `https.get()`（渲染进程不能跨域请求）
- **数据持久化**: `ON CONFLICT(ctftime_id) DO UPDATE` upsert 策略
- **状态推断**: 根据 `start`/`finish` 时间自动标记 `upcoming`/`running`/`finished`
- **事务保护**: 批量写入使用 `db.transaction()`

### 8.1 手动创建比赛

并非所有 CTF 比赛都在 CTFtime 上，用户可通过「创建比赛」按钮手动添加：

**创建流程**：
1. 点击「创建比赛」按钮 → 弹出模态对话框
2. 填写比赛名称、选择格式、设置起止时间
3. 可选择「直接参加」自动创建本地目录
4. 提交 → 后端插入 DB → 前端列表即时刷新

**便捷功能**：
- **日期快捷预设**：明天 / 本周末 / 下周 / 下个月 — 一键填充开始时间
- **结束时间自动推算**：修改开始时间 → 自动设为 +48h（CTF 常见时长，可手动修改）
- **自动聚焦**：弹窗打开时光标自动定位到名称输入框
- **Enter 快捷提交**：在名称输入框按 Enter 直接创建
- **创建后跳转**：勾选「直接参加」→ 自动跳转到比赛详情页

**IPC 接口**：
```
competitions:create(data) → Competition
  data: {
    name: string             // 必填
    start_date: string       // 必填，ISO 8601
    end_date: string         // 必填，ISO 8601
    format?: string          // 默认 'Jeopardy'
    url?: string
    weight?: number
    auto_participate?: boolean  // 默认 true，自动创建目录
  }
```

**状态判定**（后端自动计算）：
- `auto_participate = true` → `status = 'participating'`
- 否则根据当前时间与起止日期比较 → `upcoming` / `running` / `finished`

手动创建的比赛 `ctftime_id` 为 `NULL`，与 CTFtime 来源的比赛区分。

## 9. 题目系统 (Challenge System)

### 9.1 状态流转

```
unsolved ──→ attempting ──→ solved ──→ unsolved
   ⚪            🟡            🟢
```

### 9.2 视觉编码

| 位置 | 解决 | 尝试中 | 未解决 |
|------|------|--------|--------|
| 比赛卡片左边缘 | 绿色 | — | — |
| 比赛卡片徽章 | ✅ 已解决 | 🔶 X/Y | — |
| 进度条 | 绿色满 | 黄色部分 | — |
| 题目文件夹图标 | 绿点 | 黄点 | 灰点 |
| 题目名字 | 绿色 | 黄色 | 默认色 |
| 子文件继承 | 绿色 | 黄色 | 默认色 |

### 9.3 自动推导

- 全部题目 solved → `competitions.solved = 1`
- 有题目但非全 solved → `competitions.solved = 0`
- 无题目 → `competitions.solved = 0`（手动创建题目是前提）

## 10. 通知系统 (Notification System)

### 10.1 触发时机

- 应用启动后 3 秒，主进程执行 `checkNotifications()`
- 扫描所有 `status = 'participating'` 的比赛
- 用户可通过设置页面手动触发 `checkNow()`

### 10.2 通知类型

| 条件 | 标题 | 内容 |
|------|------|------|
| 比赛在未来 N 天内开始 | 📅 比赛即将开始 | 「XXX」将在 N 天后开始 (M/D ~ M/D) |
| 比赛今天开始 | 📅 比赛即将开始 | 「XXX」今天开始！ |
| 比赛已开始且未结束 | 🚩 比赛正在进行 | 「XXX」已经开始，截止 M/D |

### 10.3 去重机制

- 每个比赛+日期在 settings 表中存储标记 `notified_soon_{id}_{date}` 或 `notified_running_{id}_{date}`
- 同一次 session 内不重复弹出（`notify_session_soon_{id}` 标记）
- 使用 `force=true` 可绕过去重（手动检查时）

### 10.4 设置项

| 键 | 默认值 | 说明 |
|----|--------|------|
| `notify_enabled` | `true` | 是否启用通知 |
| `notify_before_days` | `3` | 提前天数（1/2/3/5/7） |

## 11. 导出系统 (Export System)

### 11.1 导出途径

- **比赛级别**：FileManager 比赛卡片标题栏导出按钮、CompetitionDetail 头部导出按钮
- **题目级别**：CompetitionDetail 每个题目行 hover 可见导出按钮

### 11.2 导出方式

| 方式 | 实现 | 触发 |
|------|------|------|
| ZIP 压缩包 | `archiver` 库，defalte 算法 | 弹出保存对话框，默认 .zip |
| 文件夹复制 | `fs` 递归复制 | 弹出目录选择对话框 |

### 11.3 IPC 接口

```
export:competition(compId, compName, asZip) → { success, dest? }
export:challenge(challengeDir, challengeName, asZip) → { success, dest? }
```

## 12. 自定义存储路径

### 12.1 配置方式

- 设置页面 → 「比赛文件存储路径」→ 选择文件夹 / 恢复默认
- 配置保存在 `{dataDir}/config.json`：
```json
{
  "competitionsDir": "D:\\CTF\\competitions"
}
```
- `paths.ts` 读取该文件，`getCompetitionsDir()` 优先返回自定义路径
- 修改后新参加的比赛创建在新路径，已有比赛不受影响

## 13. 打包配置

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
- **files** — 只包含 `out/**/*`，dependencies 由 electron-builder 自动包含
- **NSIS** — 标准安装程序，可选安装路径

## 14. 开发命令

```bash
npm run dev          # 开发模式（HMR）
npm run build        # 编译（electron-vite build）
npm run package      # 编译 + 打包 NSIS 安装包
npm run postinstall  # 重新编译原生模块（better-sqlite3）
```

## 15. 常见问题

### Q: 修改 .ts 源码后编译没变化？
A: 检查 `src/` 下是否有残留的 `.js` 文件（某次 tsc 编译产物），Vite 会优先使用 `.js`。

### Q: 打包后提示找不到 better-sqlite3？
A: 确保 `asar: false`，且 `build.files` 没有 `!node_modules/**/*` 排除规则。

### Q: 开发模式无法启动（Electron 33 require 异常）？
A: 这是已知 bug (electron/electron#49034)。`require('electron')` 在 dev 模式下解析到 npm 包而非内置模块。使用 `npm run package` 打包后运行即可。

### Q: 编辑器在暗色模式下没有变化？
A: CodeMirror 使用 `:key` 绑定强制重建实例。确保 `isDark` computed 正确响应主题变化。

### Q: 编辑器只显示一行？
A: MainLayout 已改为 flex column 布局，确保 slot 容器有确定高度。如果仍有问题，检查 `.cm-scroller` 的 `height: 100%` 是否生效。

### Q: archiver 报 ERR_REQUIRE_ESM？
A: archiver v7+ 是 ESM-only，必须使用 v6.x（CommonJS）。已固定在 package.json 中。

## 16. CVE 复现管理 (v1.4)

### 数据模型

新表 `cves`：

| 列 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | 主键 |
| cve_number | TEXT NOT NULL | CVE 编号 |
| title | TEXT | 漏洞标题 |
| severity | TEXT | 严重程度 |
| cvss_score | REAL | CVSS 评分 |
| description | TEXT | 漏洞描述 |
| status | TEXT | pending/reproducing/completed |
| directory | TEXT | 本地文件目录 |
| docker_image | TEXT | 关联 Docker 镜像 |
| docker_container | TEXT | 容器名/ID |
| notes | TEXT | Markdown 笔记 |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

### IPC 模块

`src/main/ipc/cves.ts` — registerCvesHandlers()
- `cves:getList` — 获取所有 CVE，按 updated_at 降序
- `cves:getById` — 获取单个 CVE
- `cves:create` — 创建 CVE + 自动创建目录和模板文件
- `cves:update` — 更新 CVE 字段（动态 SET 子句）
- `cves:delete` — 删除 CVE + 清文件
- `cves:updateStatus` — 快速状态更新

### 文件结构

```
<dataDir>/cves/<id>/
├── notes.md         # 自动创建模板
├── writeup.md       # 自动创建模板
├── exploits/        # exp 脚本
├── poc/              # PoC 文件
└── attachments/     # 附件
```

### Store

`useCvesStore` — 管理 CVE 列表、当前 CVE、按状态筛选的 computed 视图、严重程度/状态辅助函数。

## 17. Docker 集成 (v1.4)

### 技术方案

通过 `child_process.spawn` / `execSync` 调用 Docker CLI。所有 Docker 操作都在 `src/main/ipc/docker.ts` 中实现。

### IPC 模块

`registerDockerHandlers()`:
- `docker:checkAvailable` — `docker --version`
- `docker:listImages` — `docker images --format '{{json .}}'`
- `docker:importImage` — `docker load -i <file>`（异步 2 分钟超时）
- `docker:runContainer` — `docker run -d ...` 带端口映射/环境变量
- `docker:runTempContainer` — `docker run --rm ...` 临时容器
- `docker:stopContainer` / `docker:removeContainer`
- `docker:getContainerStatus` — `docker inspect`
- `docker:getContainerLogs` — `docker logs --tail`
- `docker:linkImageToCve` — 更新 cves 表 docker_image 字段

### Store

`useDockerStore` — 管理 Docker 可用性、镜像列表、容器状态缓存、临时/后台容器运行。

### 错误处理

- Docker 未安装：提示安装
- Docker daemon 未运行：提示启动 Docker Desktop
- 端口冲突：捕获错误信息展示给用户
- 命令超时：2 分钟超时保护（镜像加载）

## 18. 编辑器嵌入化改进 (v1.4)

### 设计原则

复用 MdEditor 组件（CodeMirror 6 封装），通过 v-model 绑定在各页面中内嵌使用。保留独立 Editor.vue 页面用于多标签复杂编辑场景。

### 嵌入位置

1. **CveDetail.vue 概览 Tab** — 内嵌编辑 notes.md + writeup.md（两个独立的 MdEditor 实例）
2. **CveDetail.vue 文件 Tab** — 文件树 + 内嵌编辑/预览（编辑 ↔ 预览切换）
3. **FileManager.vue** — 右侧预览区增加编辑模式切换按钮

### 技术细节

- 复用 `files:readFile` / `files:writeFile` 现有 IPC 通道
- 脏状态追踪：比较 `editableContent` 与原始 `fileContent`
- 自动识别语言：根据文件扩展名设置 CodeMirror 语言模式
