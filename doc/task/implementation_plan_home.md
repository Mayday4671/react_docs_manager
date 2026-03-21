# 首页功能增强实现计划

本计划旨在升级首页（`Home.tsx`），增加直观的数据图表（AntV）和便捷的操作入口，提升用户体验。

## 拟議变更

### 首页组件 (Home Page)

#### [MODIFY] [Home.tsx](file:///e:/My_Project/Web/my-first-react-app/src/pages/Home.tsx)

- **快捷入口 (Quick Access)**:
  - 在顶部增加一组卡片图标，支持快速跳转到常用功能（如：实时预览、用户数据、文件上传等）。
  - 使用 Ant Design 的 `Grid` 和 `Card` 实现响应式布局。
- **数据图表 (Data Visualization)**:
  - 引入 `@ant-design/plots`。
  - **柱状图 (Column Chart)**: 展示近七日视频访问量或系统流量。
  - **饼图 (Pie Chart)**: 展示设备状态分布（在线、离线、告警）。
- **动效与样式**:
  - 为快捷入口卡片添加悬浮放大动效。
  - 统一使用主题色（`token.colorPrimary`）作为图表的基础色调。

## 验证计划

### 自动化验证

- 启动 `npm run dev` 确保没有构建错误。

### 手动验证

1. 打开首页，检查 4 个快捷入口卡片是否对齐且带有悬浮效果。
2. 验证柱状图和饼图是否正确渲染并显示 Mock 数据。
3. 切换系统主题（如：主题色从蓝色改为绿色），验证图表主色调是否随之更新。
