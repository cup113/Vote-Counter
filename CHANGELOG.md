# Changelog

本项目的所有重要变更都记录在此文件。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [3.1.0] - 2026-10-06

### Added

- 引入 Lucide 图标（`@lucide/svelte`），新增 `src/lib/icons.ts` 作为界面图标的唯一入口，界面上的 emoji 全部替换为标准图标
- 控制栏拆成模块化单元：步长（−/数值/+ 复合控件）、废票、顺序、模式、运行状态，每格带微标签，窄屏时整组换行
- `src/routes/layout.css` 新增 `@theme` 设计令牌（分隔线、面板、墨色、强调色、3px 直角、等宽字体），顶部票数改为读数面板
- 候选人卡片新增领先者标识与等宽排名角标；日志区、页脚、弹窗统一为细线面板风格
- 适配 `prefers-reduced-motion`

### Changed

- 排序由「循环切换」改为三段直选（`aria-pressed`），`sortMode` 语义与排序结果不变
- 步长限制为 1–999 的整数（此前可为 0、负数或小数，会导致加票失效、减票反向）
- 弹窗无障碍结构修正：`role="dialog"` 移到面板本身并补 `tabindex="-1"`，遮罩改 `role="presentation"`，`autofocus` 改为聚焦动作
- 页面语言标记改为 `zh-CN`，`theme-color` 与新底色一致

### Fixed

- 修复既有的 `pnpm lint` 失败：`Map`/`Set` 改用 `SvelteMap`/`SvelteSet`、3 处 `{#each}` 补 key、`+layout.ts` 统一 LF、`+layout.svelte` 格式
- `.gitignore`/`.prettierignore` 忽略包存储与构建产物（`.pnpm-store`、`.svelte-kit`、`build`）

## [3.0.0] - 2026-02-10

### Changed

- 从原生 JS/jQuery 全量迁移到 Svelte 5 + TypeScript + Tailwind CSS，移除 `Lib/`、`dist/` 旧实现

### Added

- 接入 Umami 访问统计
