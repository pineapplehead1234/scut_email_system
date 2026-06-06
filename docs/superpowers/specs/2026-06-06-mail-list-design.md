# 邮件列表页一期 UI 与接口规格

## 目标

实现统一的邮件列表页，覆盖四个文件夹：

- `/mail/inbox`：收件箱
- `/mail/sent`：已发送
- `/mail/trash`：已删除
- `/mail/spam`：垃圾邮箱

本阶段只做列表页闭环：真实接口请求、筛选、分页、加载状态、空状态、错误状态、行点击进入详情。邮件详情页、回复邮件、富文本正文渲染暂缓，等待详情接口和回复关系字段确认后再设计实现。

## 范围

本阶段包含：

- 根据路由切换列表类型。
- 调用对应列表接口。
- 将筛选条件和分页同步到 URL Query。
- 展示邮件列表表格。
- 支持查看、删除、恢复等列表操作。
- 处理加载、空列表、筛选无结果、接口失败状态。
- 补齐列表页相关类型和测试。

本阶段不包含：

- 邮件详情页真实渲染。
- 回复邮件入口与 `replyToMailId`。
- 富文本正文编辑或渲染。
- 侧边栏统计接口改造。
- 移动端抽屉导航。

## 页面结构

列表页采用工作台式表格布局：

```text
筛选工具条
列表标题区
邮件表格
分页栏
```

筛选工具条位于右侧主内容区顶部。列表标题区显示当前文件夹名称、文件夹说明、当前筛选结果数量。邮件表格承载主要信息。分页栏位于表格下方，显示总数、页码和每页条数。

## 路由与接口映射

```text
/mail/inbox  -> GET /api/mails/inbox
/mail/sent   -> GET /api/mails/sent
/mail/trash  -> GET /api/mails/trash
/mail/spam   -> GET /api/mails/spam
```

四个路由共用 `MailListPage.vue`。页面从 `route.meta.folder` 读取当前文件夹类型，然后调用：

```ts
mailApi.list(folder, params)
```

返回数据使用：

```ts
type MailPageData = {
  page: number
  size: number
  total: number
  totalPages: number
  records: MailListItemVO[]
}
```

## 查询参数

前端 `MailQueryParams` 需要覆盖四类列表的查询字段：

```ts
type MailQueryParams = {
  page?: number
  size?: number
  keyword?: string
  readStatus?: 'ALL' | 'READ' | 'UNREAD'
  senderUsername?: string
  recipientUsername?: string
  priority?: Priority
  spamLevel?: SpamLevel
  riskLevel?: RiskLevel
  startTime?: string
  endTime?: string
}
```

当前代码里的 `MailQueryParams` 只有 `read?: boolean` 等少数字段，需要改为以上结构。列表页使用 `readStatus`，不继续使用 `read`。

## 筛选工具条

筛选工具条按文件夹显示不同控件。

收件箱：

```text
关键词 | 已读状态 | 发件人 | 优先级 | 日期范围 | 查询 | 重置
```

参数：

- `keyword`
- `readStatus`
- `senderUsername`
- `priority`
- `startTime`
- `endTime`

已发送：

```text
关键词 | 收件人 | 日期范围 | 查询 | 重置
```

参数：

- `keyword`
- `recipientUsername`
- `startTime`
- `endTime`

已删除：

```text
关键词 | 日期范围 | 查询 | 重置
```

参数：

- `keyword`
- `startTime`
- `endTime`

垃圾邮箱：

```text
关键词 | 垃圾等级 | 风险等级 | 日期范围 | 查询 | 重置
```

参数：

- `keyword`
- `spamLevel`
- `riskLevel`
- `startTime`
- `endTime`

交互规则：

- 点击“查询”后更新 URL Query，并将 `page` 重置为 `1`。
- 在关键词输入框按 Enter 等同点击“查询”。
- 点击“重置”后清空当前文件夹筛选条件，只保留 `page=1&size=10`。
- 切换文件夹时，清理不属于目标文件夹的筛选字段。
- 日期范围转换为 `startTime` 和 `endTime` 后写入 Query。

## URL Query 规则

筛选和分页状态必须同步到 URL：

```text
/mail/inbox?page=1&size=10&keyword=实验&readStatus=UNREAD
```

默认值：

- `page = 1`
- `size = 10`

URL 中不存在 `page` 或 `size` 时，页面内部使用默认值，并在下一次查询、分页变化或重置时写回 URL。

无效值处理：

- `page` 小于 1 时按 1 处理。
- `size` 不在允许范围时按 10 处理。
- 枚举值不合法时忽略该筛选字段。

建议允许的分页大小：

```text
10 / 20 / 50
```

## 表格结构

统一列：

```text
状态 | 联系人 | 主题 | 标签 | 时间 | 操作
```

状态列：

- 收件箱未读邮件显示蓝色未读点。
- `analysisStatus = PENDING` 显示分析中标记。
- `analysisStatus = FAILED` 显示分析失败标记。
- 高风险邮件显示风险提示图标或红色标签。

联系人列：

- 收件箱显示 `sender`。
- 已发送显示 `recipient`。
- 已删除优先显示发件人；后续如果后端补充当前用户角色，可显示对方。
- 垃圾邮箱显示 `sender`。

联系人展示内容：

```text
头像文字 avatarText
昵称 nickname
用户名 username
```

主题列：

- 第一行显示 `subject`。
- 第二行显示 `snippet`。
- 未读邮件主题加粗。
- 主题和摘要都单行截断。

标签列：

- 优先级：`priorityLabel`
- 风险等级：`riskLabel`
- 垃圾等级：`spamLevelLabel`，仅垃圾邮箱重点显示
- AI 状态：分析中、已分析、分析失败

时间列：

- 默认显示 `sentAt`。
- 已删除列表额外显示 `deletedAt`。

操作列：

- 查看
- 删除
- 恢复

## 操作规则

查看：

- 所有列表显示。
- 点击跳转 `/mail/:mailId`。
- 表格行点击也进入详情。
- 点击操作按钮时不得触发行点击。

删除：

- 收件箱显示。
- 垃圾邮箱显示。
- 已发送不显示，因为当前接口说明不支持发件人删除已发送邮件。
- 成功后刷新当前列表。

恢复：

- 仅已删除列表显示。
- 成功后刷新当前列表。

删除和恢复失败时：

- 保留当前列表数据。
- 显示错误提示。
- 对应按钮退出 loading 状态。

## 标签视觉规则

优先级：

```text
HIGH    红色
MEDIUM  琥珀色
LOW     蓝灰色
```

风险等级：

```text
SAFE    绿色
LOW     蓝色
MEDIUM  琥珀色
HIGH    红色
```

垃圾等级：

```text
NONE    灰色
LOW     蓝色
MEDIUM  琥珀色
HIGH    红色
```

AI 状态：

```text
PENDING  分析中
SUCCESS  已分析
FAILED   分析失败
```

表格应保持工作台风格，避免大面积装饰。控件使用 Element Plus，局部布局和间距使用 Tailwind。

## 状态设计

加载中：

- 首次加载显示表格骨架屏。
- 切换筛选或分页时表格进入 loading。

空列表：

- 当前文件夹没有任何邮件时显示文件夹空状态。
- 示例文案：`收件箱暂无邮件`、`已发送暂无记录`。

筛选无结果：

- 有筛选条件但 `records` 为空时显示无结果状态。
- 提供“重置筛选”按钮。

接口失败：

- 显示错误提示区。
- 提供“重新加载”按钮。
- 不自动清空 URL Query。

## 组件拆分

建议新增：

```text
src/components/mail/MailFilterToolbar.vue
src/components/mail/MailTable.vue
src/components/mail/MailStatusTags.vue
```

修改：

```text
src/pages/mail/MailListPage.vue
src/api/type.ts
```

职责：

- `MailListPage.vue`：读取路由和 Query，组装请求参数，管理加载、错误、分页和列表数据。
- `MailFilterToolbar.vue`：按文件夹显示筛选控件，提交筛选值和重置事件。
- `MailTable.vue`：展示邮件表格，抛出查看、删除、恢复事件。
- `MailStatusTags.vue`：统一渲染优先级、风险、垃圾等级和 AI 状态标签。

## 数据流

```text
用户进入 /mail/inbox
-> MailListPage 从 route.meta.folder 得到 inbox
-> 从 route.query 解析 page/size/filter
-> 调用 mailApi.list('inbox', params)
-> 渲染 MailTable
```

查询：

```text
用户修改筛选并点击查询
-> MailFilterToolbar emit search
-> MailListPage 写入 route.query
-> watch route.query 触发重新请求
```

分页：

```text
用户切换页码或每页条数
-> MailListPage 更新 route.query
-> 重新请求
```

删除或恢复：

```text
用户点击行操作
-> 调用对应 API
-> 成功后刷新当前列表
-> 失败时显示错误提示
```

## 测试范围

新增或扩展列表页测试，覆盖：

- `/mail/inbox` 调用 `mailApi.list('inbox', params)`。
- `/mail/sent` 调用 `mailApi.list('sent', params)`。
- 查询会将 `page` 重置为 `1`。
- 重置会清空当前文件夹筛选项。
- 分页变化会更新 Query 并重新请求。
- 空 `records` 显示空状态。
- 接口失败显示错误状态和重新加载入口。
- 点击行跳转 `/mail/:mailId`。
- 操作按钮点击不触发行跳转。

## 验收标准

- 四个文件夹都能请求真实接口。
- 查询参数与 OpenAPI 文档一致。
- URL Query 能表达当前筛选和分页状态。
- 空、加载、错误状态可见且文案明确。
- 表格信息密度适合桌面工作台使用。
- `npm test` 通过。
- `npm run build` 通过。
