# TodoWork - 习惯追踪器

简体中文说明

## 项目简介
这是一个基于 Vue 3 + Pinia + Supabase 的轻量级习惯追踪器（Habits Tracker）。支持创建习惯、记录每天是否完成、以及统计与 streak（连续天数）展示。

## 技术栈
- Vue 3 (script setup)
- Pinia（状态管理）
- Supabase（Postgres + Auth + Realtime）
- Vite / Vue Router

## 快速开始
1. 克隆仓库
   - git clone <your-repo-url>

2. 安装依赖
   - npm install 或 yarn

3. 配置环境变量（项目根目录创建 `.env` 或按你当前配置）
   - VITE_SUPABASE_URL=your_supabase_url
   - VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   （代码中可能通过 `@/supabase` 引入，请确保该模块使用上面变量初始化 Supabase 客户端）

4. 运行
   - npm run dev
   - npm run build / npm run preview

## 数据库表（参考）
建议在 Supabase 中创建以下简化结构：

- habits
  - id (uuid, PK)
  - user_id (uuid, FK -> auth.users)
  - name (text)
  - frequency (text)
  - created_at (timestamp)

- habit_logs
  - id (uuid, PK)
  - habit_id (uuid, FK -> habits.id)
  - log_date (date or text 'YYYY-MM-DD')
  - is_completed (boolean)

确保在读取时按 user_id 过滤 habits，并按 habit_id 查询对应的 habit_logs（避免在某些环境下直接使用嵌套关联 select 出现不稳定或权限问题）。

## 常见问题与排查（基于你目前遇到的问题）
- Stats 页面显示“还没有可用的习惯数据”
  - 排查：确认用户已登录并且 `user.id` 正确传递给后端查询（Pinia 返回的 user 可能是响应式 Proxy，需要用 `toRaw(authStore.user)` 或取 `authStore.user.id`）。
  - 建议：先用两步查询（先查 habits，再用 habit id 列表查 habit_logs）来合并数据，避免关联 select 偶发返回 error/null。

- 点击“已完成”后 UI 翻转或未刷新
  - 原因：乐观更新 + 后续重新拉取数据可能覆盖本地状态；或关联查询失败导致回退查询没有日志字段。
  - 建议：在 toggle 成功后调用稳定的 fetch（例如 `fetchHabitsAndLogs` 的两步实现）来重新同步当天日志。

- Pinia 中 user 是 Proxy
  - 解决：在传给 Supabase 的 eq() 时使用 `toRaw(authStore.user).id` 或直接 `authStore.user?.id`；必要时打印日志确认 id 值。

## 调试技巧
- 在浏览器 console 打印 store 内 user、habits、logs 查询返回（已在代码中增加若干 console.log）。
- 检查 Supabase 控制台的 Row Level Security(RLS) 与 Policy，确保当前用户有权访问 habits 与 habit_logs。
- 如果关联 select 报错，尝试拆分查询并合并结果。

## 贡献
欢迎提交 issue、PR，描述清晰重现步骤或控制台日志有助于快速定位问题。

## 许可证
MIT（或你当前项目使用的许可证）
