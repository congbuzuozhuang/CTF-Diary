# CTF Diary

CTF 选手桌面端日常工具 — 集比赛管理、题目追踪、文件管理、CVE 复现、Docker 环境、日志打卡、代码编辑于一体。

![Platform](https://img.shields.io/badge/platform-Windows-blue)
![Electron](https://img.shields.io/badge/electron-33-47848f)
![Vue](https://img.shields.io/badge/vue-3-4fc08d)
![TypeScript](https://img.shields.io/badge/typescript-5-3178c6)
![License](https://img.shields.io/badge/license-MIT-green)

## 功能概览

| 模块 | 功能 |
|------|------|
| 🏆 **比赛管理** | CTFtime 拉取 + 手动创建、快捷日期预设、一键参加、进度追踪 |
| 🐛 **CVE 复现** | CVE 管理、内嵌 Markdown 编辑、Docker 环境管理、文件树编辑 |
| 🎯 **题目追踪** | 按分类创建题目、三态切换（未解/尝试中/已解）、进度条 |
| 📁 **文件管理** | 多比赛文件树、拖拽导入、题目状态图标、**导出 ZIP** |
| ✏️ **编辑器** | 多标签页、Markdown/Python、实时预览、一键运行 |
| 📝 **日志打卡** | 日历视图、Markdown 日志、连续打卡统计 |
| 🔔 **比赛通知** | 系统原生弹窗提醒比赛临近、可配置提前天数 |
| ⚙️ **个性化** | 自定义背景、明暗主题、卡片透明度、自定义存储路径 |

## 技术栈

- **桌面框架**: Electron 33
- **前端**: Vue 3 + Pinia + Vue Router + Tailwind CSS
- **语言**: TypeScript
- **数据库**: better-sqlite3 (WAL 模式)
- **编辑器**: CodeMirror 6
- **Markdown**: markdown-it + highlight.js
- **打包**: electron-builder (NSIS)

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9
- Windows 10+（目前仅支持 Windows）

### 开发

```bash
# 安装依赖
npm install

# 启动开发模式（HMR）
npm run dev

# 编译
npm run build

# 打包 NSIS 安装程序
npm run package
```

### 安装使用

前往 [Releases 页面](https://github.com/congbuzuozhuang/CTF-Diary/releases) 下载最新版 `CTF-Diary-Setup-x.x.x.exe`，双击安装。

## 项目结构

```
ctf-diary/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.ts       # 入口（窗口创建 + 生命周期）
│   │   ├── db/            # SQLite 数据库初始化
│   │   ├── ipc/           # IPC 处理器
│   │   │   ├── challenges.ts    # 题目 CRUD
│   │   │   ├── competition.ts   # 比赛管理
│   │   │   ├── files.ts         # 文件 + 导出
│   │   │   ├── notifications.ts # 比赛通知
│   │   │   └── ...
│   │   ├── services/      # 业务服务
│   │   └── utils/         # 工具函数
│   ├── preload/           # contextBridge API
│   └── renderer/          # Vue 前端
│       ├── views/         # 7 个页面
│       ├── components/    # UI 组件
│       ├── stores/        # Pinia 状态管理
│       └── types/         # TypeScript 类型
├── docs/                  # 文档
│   ├── spec.md            # 功能规格说明
│   ├── design.md          # 技术设计文档
│   └── tasks.md           # 开发任务拆解
└── package.json
```

## 文档

- [功能规格说明书](docs/spec.md)
- [技术设计文档](docs/design.md)
- [开发任务拆解](docs/tasks.md)

## 许可

MIT License
