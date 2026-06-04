# 站内邮件系统前端布局与交互规划

本文基于 `docs/ui.html` 的 MVP 布局草稿和 `docs/接口/默认模块.openapi.json` 的接口定义整理。目标技术栈为 Vue 3 + Element Plus + Tailwind CSS。

## 1. 规划目标

当前系统是站内邮件系统，不接入 SMTP、POP3、IMAP。前端需要围绕“收发站内邮件、查看 AI 分析、管理个人设置”来组织信息架构。

核心布局沿用现有草稿方向：

- 左侧为全局导航区，固定展示写邮件、邮件文件夹、统计数量。
- 左下角展示当前用户头像和基础信息。
- 点击用户头像弹出用户菜单。
- 点击用户菜单里的“设置”跳转到独立设置页面。
- 右侧为主公共区，承载列表、详情、写邮件、设置等页面。
- 如果当前页面存在筛选模块，筛选模块显示在右侧主公共区上方，横向排列。

默认设计假设：

- 主要用户是在校园或组织内部使用邮件系统的普通用户。
- 界面应偏工作台风格：清晰、克制、密度适中，优先保证查找、阅读、处理邮件的效率。
- MVP 不追求复杂视觉包装，优先保证接口联调、状态反馈和页面结构稳定。

## 2. 总体页面结构

推荐使用认证页和登录后 App Shell 分离：

```text
未登录
└─ AuthPage
   ├─ LoginForm
   └─ RegisterForm

已登录
└─ AppLayout
   ├─ AppSidebar                 左侧全局导航
   ├─ UserProfileEntry            左下角用户入口
   └─ MainArea                    右侧主公共区
      ├─ MainHeader               页面标题、刷新、轻量状态
      ├─ FilterToolbar            列表页筛选区，按需显示
      └─ RouterView               当前业务页面
```

右侧主公共区不再按 `currentView` 字符串切换，建议使用 Vue Router 管理页面和 URL。

## 3. 推荐布局草稿

### 3.1 桌面端布局

```text
┌──────────────────────┬──────────────────────────────────────────────────────┐
│  AppSidebar          │  MainArea                                             │
│                      │  ┌────────────────────────────────────────────────┐  │
│  Mail System         │  │ MainHeader                                     │  │
│                      │  │ 标题 / 当前模块 / 刷新 / 可选状态               │  │
│  [写邮件]            │  └────────────────────────────────────────────────┘  │
│                      │  ┌────────────────────────────────────────────────┐  │
│  文件夹              │  │ FilterToolbar                                  │  │
│  收件箱        12/3  │  │ 搜索  已读状态  发件人  优先级  日期  重置/查询 │  │
│  已发送        8     │  └────────────────────────────────────────────────┘  │
│  已删除        2     │  ┌────────────────────────────────────────────────┐  │
│  垃圾邮箱      1     │  │ PageContent                                    │  │
│                      │  │ 表格 / 详情 / 写邮件 / 设置页                  │  │
│                      │  └────────────────────────────────────────────────┘  │
│  ...                 │                                                        │
│                      │                                                        │
│  ┌────────────────┐  │                                                        │
│  │ 头像 昵称      │  │                                                        │
│  │ username       │  │                                                        │
│  └────────────────┘  │                                                        │
└──────────────────────┴──────────────────────────────────────────────────────┘
```

建议尺寸：

- 左侧栏宽度：`256px`，Tailwind 可用 `w-64`。
- 右侧主区：`flex-1 min-w-0`，避免表格溢出影响布局。
- 顶部标题栏高度：`56px` 或 `64px`。
- 筛选条高度：内容单行时约 `56px`，筛选项过多时允许换行到两行。
- 内容区：`overflow-auto`，只让右侧内容滚动，左侧导航保持稳定。

### 3.2 平板和移动端

MVP 如果主要面向桌面端，可以先保证 `>= 1024px`。如果需要移动端，建议：

- `>= 1024px`：固定左侧栏。
- `768px - 1023px`：左侧栏折叠为图标栏，用户信息只保留头像。
- `< 768px`：左侧栏变为抽屉，筛选项从横向工具条改为可展开筛选面板。

用户已明确“筛选模块显示在右边区域的上方横向排列”，所以桌面端必须坚持横向工具条；移动端可以在同一位置折叠，不改变信息层级。

## 4. 三种布局方案对比

### 方案 A：左侧固定导航 + 右侧页面式内容，推荐

这是当前 `ui.html` 草稿的正式化版本。

优点：

- 最贴合用户提出的“左下角用户、右边主公共区”布局。
- 适合 Vue Router，页面边界清晰。
- 设置页、写邮件页、列表页、详情页都能自然放进右侧区域。
- Element Plus 的表格、表单、分页组件可以直接放入主区。

缺点：

- 邮件详情和列表不是三栏同时展示，来回切换略多。

推荐用于当前阶段。MVP 先稳定页面和接口联调，后续再考虑三栏阅读体验。

### 方案 B：左侧固定导航 + 右侧列表/详情双栏

右侧进一步拆成邮件列表栏和详情阅读栏，类似传统邮箱客户端。

优点：

- 阅读邮件效率更高。
- 列表和详情切换少。

缺点：

- 首版复杂度更高。
- 筛选条、分页、详情操作、AI 分析面板需要共同竞争横向空间。
- 小屏适配成本明显增加。

适合作为 P2 优化，不建议作为第一版。

### 方案 C：顶部导航 + 内容区

把邮件文件夹和设置入口放到顶部导航。

优点：

- 横向空间更大。
- 移动端天然更容易适配。

缺点：

- 不符合当前规划中的左侧导航和左下角用户入口。
- 邮件文件夹统计数字展示不如左侧栏直观。

不推荐。

## 5. 路由规划

建议路由如下：

```text
/login                     登录页
/register                  注册页，可与登录页复用 AuthPage tab

/                           重定向到 /mail/inbox
/mail/inbox                 收件箱列表
/mail/sent                  已发送列表
/mail/trash                 已删除列表
/mail/spam                  垃圾邮箱列表
/mail/compose               写邮件
/mail/:mailId               邮件详情

/settings                   用户设置
/settings/security          修改密码，可选 P2
```

路由守卫：

- 未登录访问受保护页面，跳转 `/login`。
- 已登录访问 `/login` 或 `/register`，跳转 `/mail/inbox`。
- 401 或 token 失效时，清空本地登录态并跳转 `/login`。

列表页筛选参数建议同步到 URL Query，例如：

```text
/mail/inbox?page=1&size=10&keyword=实验&readStatus=UNREAD&priority=HIGH
```

这样刷新页面、复制链接、返回列表时都能保留筛选状态。

## 6. 左侧导航规划

### 6.1 导航内容

左侧导航建议分为三个区域：

```text
顶部品牌区
- Mail System 或系统中文名

主要操作区
- 写邮件

文件夹区
- 收件箱：展示总数和未读数
- 已发送：展示已发送总数
- 已删除：展示已删除总数
- 垃圾邮箱：展示垃圾邮箱总数，可用风险色弱提示

底部用户区
- 头像
- 昵称
- username 或 emailAddress
- 点击头像/用户区弹出菜单
```

### 6.2 用户头像交互

推荐使用 Element Plus：

- `ElAvatar` 展示 `avatarText`。
- `ElDropdown` 设置 `trigger="click"`。
- 点击头像或整个用户区域打开菜单。

菜单项建议：

```text
个人设置      跳转 /settings
修改密码      跳转 /settings/security，P2 可选
退出登录      调用 logout 或直接清理本地 token
```

点击“个人设置”时不在弹层内展示设置内容，而是路由跳转到右侧主公共区的设置页。这符合用户提出的“点击设置跳到另一个页面”。

### 6.3 统计数字

左侧文件夹统计来自：

- `GET /api/mails/statistics`

字段映射：

- `inboxTotal`：收件箱正常邮件总数。
- `inboxUnread`：收件箱未读数量。
- `sentTotal`：已发送数量。
- `trashTotal`：已删除数量。
- `spamTotal`：垃圾邮箱数量。

刷新时机：

- 登录成功后。
- 进入 AppLayout 后。
- 发送邮件成功后。
- 删除、恢复、标记已读、进入详情自动已读后。
- 手动点击刷新按钮时。

## 7. 右侧主公共区规划

### 7.1 MainHeader

MainHeader 保持简洁，建议包含：

- 当前页面标题：收件箱、已发送、已删除、垃圾邮箱、写邮件、邮件详情、设置。
- 可选副标题：当前筛选结果数量或说明。
- 右侧轻量操作：刷新、返回列表、写邮件快捷按钮等。

不建议把大量筛选项放进 Header。筛选应该单独放在 Header 下方的 `FilterToolbar`。

### 7.2 FilterToolbar

只有列表页显示：

- 收件箱
- 已发送
- 已删除
- 垃圾邮箱

不显示于：

- 写邮件页
- 邮件详情页
- 设置页
- 登录注册页

桌面端布局：

```text
┌──────────────────────────────────────────────────────────────┐
│ 搜索框 │ 状态选择 │ 用户输入 │ 优先级/风险 │ 日期范围 │ 查询 重置 │
└──────────────────────────────────────────────────────────────┘
```

实现建议：

- 使用 `ElInput` 作为关键词搜索。
- 使用 `ElSelect` 或 `ElSegmented` 表示枚举筛选。
- 使用 `ElDatePicker type="daterange"` 表示时间范围。
- 使用 `ElButton` 执行查询和重置。
- Tailwind 负责 `flex flex-wrap items-center gap-3`。

筛选触发策略：

- 点击“查询”后请求接口，避免输入过程频繁请求。
- 按 Enter 可触发查询。
- “重置”清空当前页面所有筛选项，保留 `page=1&size=10`。
- 改变筛选条件后页码回到 1。

### 7.3 列表内容区

列表页使用 `ElTable` + `ElPagination`。

统一字段来自 `MailListItemVO`：

- `mailId`
- `subject`
- `snippet`
- `sender`
- `recipient`
- `sentAt`
- `read`
- `priority`
- `priorityLabel`
- `spam`
- `spamLevel`
- `riskLevel`
- `riskLabel`
- `analysisStatus`
- `riskReason`
- `deletedAt`
- `spamLevelLabel`

表格通用列建议：

```text
状态        未读点、分析状态、风险/垃圾状态
发件人/收件人 根据列表类型切换
主题        主题 + snippet
优先级      priorityLabel
风险        riskLabel，垃圾邮箱页更突出
时间        sentAt，已删除页可补充 deletedAt
操作        查看、删除、恢复等
```

收件箱：

- 未读邮件使用更明显字体重量和浅色背景。
- 支持已读状态、发件人、优先级、时间范围筛选。
- 高风险或垃圾邮件不应出现在普通收件箱，按接口说明由后端过滤。

已发送：

- `read` 对发件人可能为 `null`，不要强行展示已读状态。
- 支持收件人、关键词、时间范围筛选。
- 当前接口说明“不支持发件人删除已发送邮件”，所以已发送列表不展示删除主操作。

已删除：

- 展示 `deletedAt`。
- 如实现 P2 恢复接口，展示“恢复”操作。

垃圾邮箱：

- 重点展示 `spamLevelLabel`、`riskLabel`、`riskReason`。
- 支持 `spamLevel` 和 `riskLevel` 筛选。
- 删除操作应和收件箱一致，删除后进入已删除列表。

### 7.4 分页

分页数据来自 `MailPageData`：

- `page`
- `size`
- `total`
- `totalPages`
- `records`

需要注意：当前 `ui.html` 原型使用的是 `items`，正式接口使用 `records`。前端 API adapter 应在一处完成字段适配，业务组件不要混用 `items` 和 `records`。

## 8. 主要页面规划

### 8.1 登录注册页

对应接口：

- `POST /api/auth/login`
- `POST /api/auth/register`

登录字段：

- `username`
- `password`

注册字段：

- `username`
- `password`
- `nickname`

OpenAPI 当前注册请求没有 `email` 字段，而 `ui.html` 原型里有备用邮箱输入。正式实现前需要确认是否删除该输入，或后端是否补充字段。按接口优先原则，MVP 建议删除注册页备用邮箱字段。

登录成功后：

1. 保存 token。
2. 保存登录接口返回的基础用户信息。
3. 请求 `GET /api/users/me` 补齐 `emailAddress` 和 `avatarText`。
4. 请求 `GET /api/mails/statistics`。
5. 跳转 `/mail/inbox`。

### 8.2 邮件列表页

四类列表共用一个 `MailListPage`，根据路由类型切换：

- 标题
- 接口地址
- 筛选字段
- 表格列
- 行操作

接口映射：

```text
/mail/inbox  -> GET /api/mails/inbox
/mail/sent   -> GET /api/mails/sent
/mail/trash  -> GET /api/mails/trash
/mail/spam   -> GET /api/mails/spam
```

点击表格行进入：

```text
/mail/:mailId
```

返回列表时优先回到来源列表，并保留 URL Query。

### 8.3 写邮件页

对应接口：

- `POST /api/mails`

字段：

- `recipientUsername`
- `subject`
- `content: RichTextNode[]`
- `attachmentFileId?: string`

当前版本只支持单收件人，不支持 CC、BCC、多收件人。附件能力采用最小版：一封邮件最多一个附件；正文可以包含多张内嵌图片，图片节点通过 `RichTextNode.image.resourceId` 引用上传接口返回的 `fileId`。

编辑器建议分两阶段：

P0：

- 使用普通 textarea 或 Element Plus `ElInput type="textarea"`。
- 提交前把文本转换为 `RichTextNode[]`。
- 每个段落转换为 `type: "paragraph"`，文本节点放入 `children`。
- 附件上传先使用 `AttachmentUploader`，上传成功后保存 `attachmentFileId`，发送邮件时带上该字段。

示例转换：

```json
[
  {
    "type": "paragraph",
    "children": [
      {
        "type": "text",
        "text": "第一段内容"
      }
    ]
  }
]
```

P2：

- 如需要真正富文本，考虑接入 Tiptap。
- 仍然统一通过 adapter 输出接口需要的 `RichTextNode[]`，避免页面直接依赖后端格式。
- 内嵌图片可在富文本编辑器阶段接入上传按钮；上传成功后插入 `{ type: "image", resourceId: fileId }` 节点。

发送成功后：

- 清空草稿。
- 刷新统计数字。
- 跳转 `/mail/sent` 或保留在写邮件页显示“继续写”。MVP 推荐跳转已发送。

### 8.4 邮件详情页

对应接口：

- `GET /api/mails/{mailId}`
- `DELETE /api/mails/{mailId}`
- `PATCH /api/mails/{mailId}/read`
- `PATCH /api/mails/{mailId}/restore`，P2 可选
- `POST /api/mails/{mailId}/analysis/retry`，P2 可选

详情页区域建议：

```text
顶部操作区
- 返回
- 删除
- 标记已读，只有收件人且未读时展示
- 恢复，只有已删除列表来源且接口已实现时展示
- 重新分析，P2 可选

邮件头信息
- subject
- sender
- recipient
- sentAt
- read / currentUserRole

正文区
- 渲染 RichTextNode[]

附件区
- attachment 不为 null 时展示附件卡片和下载按钮

AI 分析区
- summary
- spamLevelLabel / spamReason
- riskLabel / riskReason
- priorityLabel / priorityReason
- replySuggestions
```

AI 分析区建议放在正文右侧或正文下方：

- 桌面端可以右侧窄栏展示。
- 空间不足时放在正文下方。
- `analysisStatus` 为 `PENDING` 时展示分析中。
- `FAILED` 时展示失败状态和可选重试按钮。
- `DISABLED` 时展示“AI 分析未开启”的低干扰提示。

附件和内嵌图片：

- `attachment` 使用 `AttachmentCard` 展示文件名、大小、类型和下载动作。
- `content` 中的 `image.resourceId` 通过 `filesApi.downloadFile` 拉取 Blob 后渲染为本地 URL。
- 因为下载接口需要 Bearer Token，MVP 不直接把 `/api/files/{fileId}/download` 放进 `<img src>`。
- 图片加载失败时显示占位，不影响其他正文节点。

接口说明提到：收件人查看详情时，如果邮件原本未读，后端会自动标记为已读。前端进入详情后应刷新当前邮件状态和侧边栏统计。

### 8.5 设置页

对应接口：

- `GET /api/users/settings`
- `PUT /api/users/settings`
- `PUT /api/users/password`，P2 可选
- `GET /api/users/me`

设置页从头像菜单进入，路由为 `/settings`。

页面结构建议：

```text
设置页
├─ 账号信息
│  ├─ 头像 avatarText
│  ├─ username
│  ├─ nickname
│  └─ emailAddress
│
├─ AI 功能开关
│  ├─ aiEnabled
│  ├─ autoReplyEnabled
│  └─ prioritySortEnabled
│
├─ 模型配置
│  ├─ provider
│  ├─ baseUrl
│  ├─ modelName
│  ├─ apiKey / maskedApiKey
│  ├─ timeoutMs
│  ├─ maxTokens
│  └─ temperature
│
└─ 安全设置，P2
   └─ 修改密码
```

API Key 交互需要明确：

- 后端不会返回完整 API Key。
- 有已保存 Key 时显示 `maskedApiKey`。
- API Key 输入框留空表示不修改旧 Key。
- 提供“清空 Key”按钮时，提交 `apiKey: ""`。
- 首次配置模型时，`provider`、`baseUrl`、`modelName`、`apiKey` 需要完整填写。

设置保存策略：

- 开关类可以即时保存，也可以统一“保存设置”。
- MVP 推荐统一“保存设置”，减少接口调用和状态分叉。
- 保存成功后刷新 settings store。

## 9. 筛选模块详细规划

### 9.1 收件箱筛选

接口参数：

- `page`
- `size`
- `keyword`
- `readStatus: ALL | READ | UNREAD`
- `senderUsername`
- `priority: LOW | MEDIUM | HIGH`
- `startTime`
- `endTime`

横向布局：

```text
关键词搜索 | 已读状态 | 发件人 | 优先级 | 日期范围 | 查询 | 重置
```

### 9.2 已发送筛选

接口参数：

- `page`
- `size`
- `keyword`
- `recipientUsername`
- `startTime`
- `endTime`

横向布局：

```text
关键词搜索 | 收件人 | 日期范围 | 查询 | 重置
```

### 9.3 已删除筛选

接口参数：

- `page`
- `size`
- `keyword`
- `startTime`
- `endTime`

横向布局：

```text
关键词搜索 | 日期范围 | 查询 | 重置
```

### 9.4 垃圾邮箱筛选

接口参数：

- `page`
- `size`
- `keyword`
- `spamLevel: NONE | LOW | MEDIUM | HIGH`
- `riskLevel: SAFE | LOW | MEDIUM | HIGH`
- `startTime`
- `endTime`

横向布局：

```text
关键词搜索 | 垃圾等级 | 风险等级 | 日期范围 | 查询 | 重置
```

## 10. 组件拆分建议

建议目录：

```text
src/
├─ api/
│  ├─ http.ts
│  ├─ auth.ts
│  ├─ user.ts
│  ├─ settings.ts
│  ├─ mail.ts
│  └─ files.ts
│
├─ layouts/
│  └─ AppLayout.vue
│
├─ components/
│  ├─ app/
│  │  ├─ AppSidebar.vue
│  │  ├─ MainHeader.vue
│  │  └─ UserMenu.vue
│  ├─ mail/
│  │  ├─ MailFilterToolbar.vue
│  │  ├─ MailTable.vue
│  │  ├─ MailStatusTag.vue
│  │  ├─ MailAnalysisPanel.vue
│  │  ├─ AttachmentUploader.vue
│  │  ├─ AttachmentCard.vue
│  │  ├─ ComposeEditor.vue
│  │  └─ RichTextRenderer.vue
│  └─ common/
│     ├─ EmptyState.vue
│     └─ PageLoading.vue
│
├─ pages/
│  ├─ auth/
│  │  └─ AuthPage.vue
│  ├─ mail/
│  │  ├─ MailListPage.vue
│  │  ├─ ComposePage.vue
│  │  └─ MailDetailPage.vue
│  └─ settings/
│     ├─ SettingsPage.vue
│     └─ SecurityPage.vue
│
├─ stores/
│  ├─ auth.ts
│  ├─ user.ts
│  ├─ mail.ts
│  └─ settings.ts
│
├─ router/
│  └─ index.ts
│
└─ utils/
   ├─ richText.ts
   ├─ date.ts
   └─ enumLabels.ts
```

状态管理建议使用 Pinia：

- `authStore`：token、登录、注册、退出、认证状态。
- `userStore`：当前用户信息。
- `mailStore`：统计数字、列表查询、详情查询。
- `settingsStore`：设置读取和保存。

如果项目希望更轻，MVP 也可以先不用 Pinia，但 AppLayout、侧边栏统计、用户菜单、多个邮件页共享状态较多，使用 Pinia 会更清晰。

## 11. API 适配规划

### 11.1 HTTP Client

统一封装：

- `baseURL = /api`
- 请求头自动加 `Authorization: Bearer <token>`
- 统一处理业务响应 `code/message/data`
- 401 或 token 无效统一跳转登录
- 错误提示通过 `ElMessage` 展示

### 11.2 列表适配

接口返回分页字段为：

- `records`
- `page`
- `size`
- `total`
- `totalPages`

前端列表组件内部可以统一命名为：

```ts
type MailPage = {
  records: MailListItem[]
  page: number
  size: number
  total: number
  totalPages: number
}
```

不要继续沿用 `ui.html` 中的 `mailList.items`，除非在 adapter 中显式转换。

### 11.3 富文本适配

需要两个工具函数：

- `plainTextToRichText(text: string): RichTextNode[]`
- `richTextToPlainText(nodes: RichTextNode[]): string`
- `collectInlineImageFileIds(nodes: RichTextNode[]): string[]`

P0 可以先只支持 paragraph/text/link 的基础编辑。渲染侧需要支持 `image` 节点：`resourceId` 等于文件上传接口返回的 `fileId`，前端通过下载接口携带 token 获取 Blob，再转成本地 URL。

### 11.4 文件适配

文件接口统一放在 `src/api/files.ts`：

- `uploadFile(file: File): Promise<{ fileId: string }>`
- `downloadFile(fileId: string): Promise<Blob>`
- `getFileBlobUrl(fileId: string): Promise<string>`
- `revokeFileBlobUrl(url: string): void`

发送邮件时：

- 附件先上传，得到 `attachmentFileId`。
- 正文内嵌图片先上传，富文本节点写入 `{ type: "image", resourceId: fileId }`。
- 提交邮件时后端统一校验并绑定附件和正文图片。

详情页渲染时：

- 附件下载按钮调用 `downloadFile` 后触发浏览器下载。
- 正文图片调用 `getFileBlobUrl` 后绑定到 `<img>`。

## 12. Element Plus 与 Tailwind 分工

Element Plus 负责复杂组件和交互一致性：

- `ElForm`
- `ElInput`
- `ElButton`
- `ElTable`
- `ElPagination`
- `ElSelect`
- `ElDatePicker`
- `ElDropdown`
- `ElAvatar`
- `ElTag`
- `ElMessage`
- `ElPopconfirm`
- `ElSwitch`
- `ElUpload`

Tailwind 负责布局和局部间距：

- 页面壳层：`h-screen flex overflow-hidden`
- 左侧栏：`w-64 shrink-0`
- 主区：`flex-1 min-w-0 flex flex-col`
- 工具条：`flex flex-wrap items-center gap-3`
- 内容区：`flex-1 overflow-auto`

建议不要大量重写 Element Plus 内部样式。主题色、圆角、字号通过 CSS 变量和少量全局主题覆盖处理。

## 13. 视觉规范建议

整体风格：

- 工作台风格，避免营销页式大面积装饰。
- 背景使用浅灰，主内容白色或近白色。
- 左侧栏可使用深色或浅色两种方向。沿用原型时可以用深色侧栏，但要提高可读性。
- 邮件列表密度适中，行高建议 `52px - 64px`。

颜色建议：

- 主色：蓝色系，用于主操作和当前导航。
- 成功：绿色，用于安全状态。
- 警告：琥珀色，用于中风险、待处理。
- 危险：红色，用于高风险、垃圾、删除。
- 中性色：用于正文、边框、背景。

优先级和风险标签：

```text
HIGH    红色或橙红
MEDIUM  琥珀色
LOW     蓝色或灰蓝

SAFE    绿色
LOW     蓝色
MEDIUM  琥珀色
HIGH    红色
```

## 14. 与现有 ui.html 的差异

正式实现时需要调整：

- 原型使用 CDN + 单文件 Vue，正式项目应拆分为 Vue 3 工程结构。
- 原型用 `currentView` 控制页面，正式应改为 Vue Router。
- 原型只覆盖收件箱、已发送、写邮件、详情，正式应补齐已删除、垃圾邮箱、设置页。
- 原型正文是字符串，正式接口要求 `RichTextNode[]`。
- 原型列表字段为 `items`、`id`、`sendTime`，正式接口为 `records`、`mailId`、`sentAt`。
- 原型中 `currentView.ref`、`authMode.ref` 不符合 Vue `ref` 用法，正式代码应使用 `.value` 或模板自动解包。
- 原型把 `PATCH /read` 当作 post 模拟，正式应使用 PATCH 且请求体为 `{ "read": true }`。
- 原型注册表单包含备用邮箱字段，但 OpenAPI 的 `RegisterRequest` 不包含该字段。

## 15. 开发阶段划分

### P0：基础邮件闭环

- 登录、注册、退出。
- AppLayout、左侧导航、用户头像菜单。
- 收件箱、已发送列表。
- 写邮件。
- 邮件详情。
- 删除邮件。
- 标记已读。
- 基础统计数字。
- 基础富文本转换。

### P1：完整列表和设置

- 已删除列表。
- 垃圾邮箱列表。
- 横向筛选工具条。
- 文件上传和下载接口适配。
- 写邮件单附件上传。
- 邮件详情附件卡片和下载。
- 正文内嵌图片渲染。
- 用户设置页。
- AI 开关和模型配置。
- 邮件详情 AI 分析面板。
- 更完整的错误和空状态。

### P2：增强功能

- 恢复已删除邮件。
- 修改密码。
- 重新分析邮件。
- 真正富文本编辑器。
- 移动端抽屉导航。
- 右侧列表/详情双栏阅读模式。

## 16. 待确认 UI 点

以下点建议在实现前确认：

1. 系统名称是否继续使用 `Mail System`，还是改成中文品牌名。
2. 左侧栏使用深色风格还是浅色风格。
3. 邮件详情页首版采用“独立详情页”，还是直接做“列表 + 详情双栏”。
4. 写邮件成功后跳转已发送，还是停留当前页继续写。
5. 注册页是否保留备用邮箱字段。当前接口没有该字段。
6. AI 分析面板默认展开还是折叠。
7. 设置页是否只包含 AI 设置，还是同时展示账号信息和安全设置。
8. 筛选条件是否必须同步到 URL Query。推荐同步。
9. MVP 是否必须适配移动端。若不要求，先以桌面端为主。
10. 富文本是否只做纯文本兼容，还是首版就接入 Tiptap 等富文本编辑器。

## 17. 推荐结论

首版建议采用“方案 A：左侧固定导航 + 右侧页面式内容”。

该方案最贴合现有布局草稿和当前需求：左下角用户入口明确、设置页能独立跳转、筛选模块能稳定放在右侧主区上方，且与 Vue Router、Element Plus、Tailwind 的组合方式最自然。

实现优先级建议先完成 P0 邮件闭环，再补齐 P1 筛选、垃圾邮箱、已删除和设置页。这样能尽早完成接口联调，同时保留后续升级为三栏邮箱体验的空间。
