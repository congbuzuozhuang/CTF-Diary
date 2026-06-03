# CTF Diary

CTF 选手日常桌面工具 — 比赛管理、附件整理、日志打卡、笔记编辑。

## 技术栈

Electron 33 + Vue 3 + TypeScript + Tailwind CSS + SQLite

## 快速启动

```bash
npm install
npm run dev          # 开发模式
npm run build        # 仅编译
npm run package      # 编译 + 打包安装包 → release/
```

## 项目结构

```
src/
├── main/            # Electron 主进程
│   ├── index.ts     # 入口 + 窗口管理
│   ├── db/          # SQLite 初始化 + 迁移
│   ├── ipc/         # IPC 处理器（8 个模块）
│   ├── services/    # CTFtime API + 文件系统
│   └── utils/       # 路径工具
├── preload/         # contextBridge API
├── renderer/        # Vue 前端
│   ├── views/       # 7 个页面
│   ├── stores/      # 4 个 Pinia store
│   ├── components/  # 布局 / 编辑器 / 文件树
│   ├── router/      # Vue Router 配置
│   ├── types/       # TS 类型定义
│   └── assets/      # CSS（主题 + 组件类）
```

## 页面

| 页面 | 路径 | 功能 |
|------|------|------|
| 仪表盘 | `/` | 打卡统计、连续天数、近期比赛、快捷入口 |
| 比赛管理 | `/competitions` | CTFtime 赛事拉取、参加、分类浏览 |
| 比赛详情 | `/competitions/:id` | 元信息、PWN/RE/笔记文件 |
| 文件管理 | `/files` | 文件树浏览、拖拽导入、文件预览 |
| 编辑器 | `/editor/:type` | Markdown/Python 编辑、Python 运行 |
| 日志打卡 | `/diary` | 日历打卡、Markdown 日志、标签/心情 |
| 设置 | `/settings` | 背景、主题、卡片透明度、数据管理 |

## IPC 通道

| 命名空间 | 通道 | 方向 |
|---------|------|------|
| `settings` | get/set/getAll | renderer → main |
| `competitions` | getList/getFromCtftime/participate/getDetail | renderer → main |
| `files` | readDir/readFile/writeFile/deleteFile/importFile/getCompetitionDir | renderer → main |
| `diary` | checkIn/getCheckins/getDayLog/getStats | renderer → main |
| `python` | checkPython/runScript | renderer → main |
| `data` | getStats/clear* | renderer → main |
| `dialog` | openImage/openFile/removeBackground | renderer → main |
| `app` | getVersion/openExternal | renderer → main |

## 数据库

SQLite（better-sqlite3，同步 API，WAL 模式）

4 张表：`competitions` / `checkins` / `file_tags` / `settings`

数据目录：开发模式 `data/`，生产模式 `%APPDATA%/ctf-diary/`

## 打包

NSIS 安装包：`release/CTF-Diary-Setup-1.0.0.exe`

关键配置：
- `asar: false` — better-sqlite3 原生模块需要真实路径
- `build.files` — 只包含 `out/**/*`
- dependencies（better-sqlite3 等）由 electron-builder 自动包含

## 注意事项

- 修改 `.ts` 源文件后确保 `src/` 下没有残留 `.js` 文件，否则 Vite 优先读取 `.js`
- 首次启动安装版约 2-3 秒（Electron + SQLite 初始化）
- 开发模式下需桌面环境（不能 headless 运行）

## 文档

- [功能规格说明书](docs/spec.md)
- [技术设计文档](docs/design.md)
- [开发任务拆解](docs/tasks.md)
