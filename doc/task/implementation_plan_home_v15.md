# 首页布局最终修正计划 (V15)

彻底解决图表遮挡、列表截断以及意外出现的滚动条问题。

## 拟議变更

### 1. 视口骨架锁定

- **主容器**: 强制设置 `height: calc(100vh - 64px - 48px)` (减去 Layout 头部和 Breadcrumb)。
- **布局分层**:
  - 快捷入口: `flex-shrink: 0` (固定高度)。
  - 中部图表: `flex: 1; min-height: 0;`。
  - 底部列表: `flex: 1; min-height: 0;`。

### 2. 精准动态条目计算

- **监听 Body 区域**: 使用 `useRef` 绑定在 Card 的 `styles.body` 对应容器上。
- **算法校准**:
  - `有效空间 = 容器高度 - 上下 Padding(24px)`。
  - `条目高度 = 50px` (42px 内容 + 8px 间距)。
  - `count = Math.floor(有效空间 / 50)`。
- **物理截断**: 强制 `overflow: hidden`，绝不允许滚动条干扰。

### 3. 图表渲染修复

- 为图表外层 Div 设置 `position: relative; flex: 1; min-height: 0;`，确保 AntV Charts 能够正确识别父级尺寸。

## 验证计划

1. **零滚动条校验**: 确保 Dashboard 任何情况下无滚动。
2. **条数动态同步**: 拉伸窗口时，条目数能平滑增减且无截断。
