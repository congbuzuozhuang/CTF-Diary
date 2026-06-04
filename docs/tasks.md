# CTF Diary — 开发任务拆解

> 总览: 11 个阶段，71 个任务，全部完成 ✅

---

## Phase 1: 项目骨架 🏗️

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 1.1 | 初始化 Electron + Vue 3 + Vite 项目 | 可启动的桌面窗口 | ✅ |
| 1.2 | 配置 Tailwind CSS + 全局样式 | 明暗主题基础 | ✅ |
| 1.3 | 搭建 MainLayout（Sidebar + TopBar + RouterView） | 导航框架 | ✅ |
| 1.4 | 配置路由（7 个页面） | 页面可切换 | ✅ |
| 1.5 | 实现 Background.vue 组件 + CSS 覆盖层 | 背景图显示 | ✅ |
| 1.6 | 实现 IPC 通信桥 (preload.ts) | 前后端连通 | ✅ |

## Phase 2: 数据层 💾

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 2.1 | 初始化 SQLite + 建表迁移（含 challenges 表） | 数据库就绪 | ✅ |
| 2.2 | 实现 Settings IPC 模块（读写设置） | 设置持久化 | ✅ |
| 2.3 | 实现文件系统工具模块 | 目录创建/文件操作 | ✅ |
| 2.4 | Pinia stores 基础搭建 | 前端状态管理 | ✅ |

## Phase 3: 设置页面 ⚙️

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 3.1 | Settings 页面 UI | 设置面板 | ✅ |
| 3.2 | 背景图片选择器（预设 + 本地上传） | 换背景功能 | ✅ |
| 3.3 | 主题切换、字体设置、卡片透明度 | 个性化定制 | ✅ |
| 3.4 | 数据管理（统计 + 分项清理 + 重置） | 清理功能 | ✅ |

## Phase 4: 比赛管理 🏆

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 4.1 | CTFtime API 服务（主进程） | 比赛数据获取 | ✅ |
| 4.2 | Competitions 列表页 UI（含进度条+已解决Tab） | 比赛列表展示 | ✅ |
| 4.3 | "参加"功能（创建目录 + 标记状态） | 一键参赛 | ✅ |
| 4.4 | CompetitionDetail 详情页 | 比赛详情 | ✅ |
| 4.5 | 自动创建 pwn/re/notes 子目录 | 附件目录结构 | ✅ |

## Phase 5: 文件管理 + 编辑器 📁

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 5.1 | FileTree 组件（递归目录展示） | 文件树 | ✅ |
| 5.2 | FileManager 页面（多比赛并列卡片） | 文件浏览 | ✅ |
| 5.3 | 附件导入功能（拖拽/选择文件） | 文件导入 | ✅ |
| 5.4 | 文件/目录/比赛单独删除 + 确认弹窗 | 删除功能 | ✅ |
| 5.5 | MdEditor 组件（CodeMirror 6 + 亮暗主题） | MD 编辑器 | ✅ |
| 5.6 | MdPreview 组件（markdown-it + highlight.js） | MD 实时预览 | ✅ |
| 5.7 | CodeViewer 组件（Python 语法高亮） | 代码查看 | ✅ |
| 5.8 | Python 脚本执行功能（主进程 spawn） | 运行 exploit | ✅ |
| 5.9 | 编辑器改版：多标签页 + 文件树侧栏 + 状态栏 | 编辑器现代化 | ✅ |
| 5.10 | 自定义 CodeMirror 亮色主题 | 主题适配 | ✅ |

## Phase 6: 日志打卡 📝

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 6.1 | Calendar 组件（月视图） | 日历控件 | ✅ |
| 6.2 | 打卡按钮 + 状态展示（TopBar 集成） | 每日打卡 | ✅ |
| 6.3 | DayLog 组件（Markdown 写日志） | 日志编辑 | ✅ |
| 6.4 | 连续打卡统计 + Dashboard 首页 | 统计面板 | ✅ |

## Phase 7: 题目追踪系统 🎯 (v1.1)

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 7.1 | DB 迁移：challenges 表 + competitions.solved 列 | 数据模型 | ✅ |
| 7.2 | Challenges IPC 处理器（CRUD + 状态更新） | 后端 API | ✅ |
| 7.3 | Challenges Store（进度计算 + 状态图标） | 前端状态 | ✅ |
| 7.4 | CompetitionDetail 题目列表 + 进度条 | 题目管理 UI | ✅ |
| 7.5 | 题目状态三态切换（⚪ 🟡 🟢 循环） | 状态交互 | ✅ |
| 7.6 | 新建/编辑/删除题目对话框 | 题目 CRUD | ✅ |
| 7.7 | 比赛卡片解决状态视觉区分 | 列表视觉 | ✅ |
| 7.8 | 文件树题目文件夹状态图标 + 文件继承 | 文件状态 | ✅ |

## Phase 8: 打磨 + 发布 🚀

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 8.1 | 无边框窗口 + 自定义标题栏 | 现代化窗口 | ✅ |
| 8.2 | 窗口控制按钮（最小化/最大化/关闭） | 窗口管理 | ✅ |
| 8.3 | 背景覆盖层改为 CSS 变量（亮暗自适应） | 视觉修复 | ✅ |
| 8.4 | 数据清理 FS + DB 双删 | 清理完善 | ✅ |
| 8.5 | 文件管理新建题目按钮 + 对话框 | 快捷创建 | ✅ |
| 8.6 | NSIS 安装包打包 | 标准安装程序 | ✅ |
| 8.7 | 编辑器高度填满修复（MainLayout flex column） | 编辑器体验 | ✅ |
| 8.8 | 文档更新（v1.1） | spec/design/tasks | ✅ |

## Phase 9: 通知 + 导出 + 自定义路径 🔔 (v1.2)

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 9.1 | notifications.ts IPC 模块（启动检查 + 去重） | 通知系统后端 | ✅ |
| 9.2 | Electron Notification 原生弹窗 | 系统通知 | ✅ |
| 9.3 | 设置页面通知开关 + 提前天数选择 | 通知配置 UI | ✅ |
| 9.4 | 导出 IPC 处理器（比赛/题目 ZIP + 文件夹） | 导出后端 | ✅ |
| 9.5 | FileManager 导出按钮 | 比赛导出入口 | ✅ |
| 9.6 | CompetitionDetail 比赛/题目导出按钮 | 题目导出入口 | ✅ |
| 9.7 | archiver 6 集成 + 递归复制 | ZIP 打包 | ✅ |
| 9.8 | 自定义比赛文件存储路径（config.json） | 路径配置 | ✅ |
| 9.9 | Settings 文件夹选择器 + 恢复默认 | 路径配置 UI | ✅ |
| 9.10 | dialog:openDirectory 对话框 | 目录选择 | ✅ |
| 9.11 | 文档更新至 v1.2 | 文档 | ✅ |

## Phase 10: 手动创建比赛 ✨ (v1.3)

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 10.1 | competitions:create IPC 处理器（含自动状态判定） | 后端 API | ✅ |
| 10.2 | preload API 桥接 + Store create action | 前端状态 | ✅ |
| 10.3 | Competitions 页面「创建比赛」按钮 + 模态弹窗 | UI 入口 | ✅ |
| 10.4 | 快捷日期预设（明天/本周末/下周/下个月） | 便利性 | ✅ |
| 10.5 | 自动填充结束时间 + 自动聚焦 + Enter 提交 | 便利性 | ✅ |
| 10.6 | 文档更新至 v1.3 | 文档 | ✅ |

## Phase 11: CVE 复现 + Docker 🐛🐳 (v1.4)

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 11.1 | DB 迁移：cves 表 + paths 扩展（getCvesDir/getCveDir） | 数据模型 | ✅ |
| 11.2 | CVE IPC 处理器（getList/getById/create/update/delete/updateStatus） | 后端 API | ✅ |
| 11.3 | CVE 文件系统服务（setupCveDirs/removeCveDirs + 模板文件生成） | 文件管理 | ✅ |
| 11.4 | Docker IPC 处理器（checkAvailable/listImages/import/run/stop/logs/link） | Docker 后端 | ✅ |
| 11.5 | Preload API 桥接 + TypeScript 类型定义（Cve/DockerImageInfo/RunContainerOptions） | 前后端连通 | ✅ |
| 11.6 | CvesStore + DockerStore（状态管理 + computed 视图 + 严重程度/状态辅助） | 前端状态 | ✅ |
| 11.7 | Sidebar 导航项 + /cves 和 /cves/:id 路由 | 导航入口 | ✅ |
| 11.8 | Cves.vue — CVE 列表页（搜索 + 状态筛选 + 创建弹窗 + 严重程度色标 + Docker 指示器） | CVE 管理界面 | ✅ |
| 11.9 | CveDetail.vue — 概览 Tab（信息卡片 + 内嵌 notes.md/writeup.md 编辑） | CVE 详情 | ✅ |
| 11.10 | CveDetail.vue — 文件管理 Tab（文件树 + 内嵌编辑/预览 + 导入） | 文件管理 | ✅ |
| 11.11 | CveDetail.vue — Docker 环境 Tab（镜像关联 + 后台/临时运行 + 端口映射 + 日志查看） | Docker 管理 | ✅ |
| 11.12 | FileManager.vue 编辑模式增强（预览 ↔ 编辑切换 + 内嵌 MdEditor） | 编辑器便捷化 | ✅ |
| 11.13 | 文档更新至 v1.4 (spec/design/tasks/README) | 文档 | ✅ |
| 11.14 | 打包验证（npm run package） | 安装包 | ✅ |

---

## 依赖关系

```
Phase 1 (骨架) ──→ Phase 2 (数据层) ──→ Phase 3 (设置)
                      │                        │
                      └────→ Phase 4 (比赛) ──→ Phase 5 (文件/编辑器)
                      │         │
                      │         └────→ Phase 7 (题目系统)
                      │
                      └────→ Phase 6 (日志打卡)
                                               │
                                   Phase 8 (打磨发布) ←────────┘
                                               │
                                   Phase 9 (通知+导出+路径) ←──┘
                                               │
                                   Phase 10 (手动创建比赛) ←──┘
                                               │
                                   Phase 11 (CVE 复现 + Docker) ←──┘
```

**实际顺序**: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11
