# Mail List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-ready mail list workflow for inbox, sent, trash, and spam folders with real API data, URL-synced filters, pagination, loading, empty, error, and row-operation states.

**Architecture:** Keep `MailListPage.vue` as the route container and move focused responsibilities into small units: a query utility for URL/API parameter translation, `MailFilterToolbar.vue` for folder-specific filters, `MailTable.vue` for table display and row actions, and `MailStatusTags.vue` for reusable status labels. This keeps router/query logic testable without mounting the whole page and prevents the table/filter controls from owning API state.

**Tech Stack:** Vue 3, TypeScript, Vue Router, Element Plus, Tailwind CSS, Vitest, Vue Test Utils.

---

## File Structure

Create:

- `frontend/src/pages/mail/mail-list-query.ts`  
  Owns URL Query parsing, default list state, folder-specific query cleanup, and conversion to `MailQueryParams`.

- `frontend/src/components/mail/MailStatusTags.vue`  
  Renders priority, risk, spam level, and AI analysis tags for one list item.

- `frontend/src/components/mail/MailFilterToolbar.vue`  
  Renders folder-specific filter controls and emits search/reset actions.

- `frontend/src/components/mail/MailTable.vue`  
  Renders the mail list table, loading/empty/error states, pagination, and row actions.

- `frontend/tests/mail-list-query.test.ts`  
  Unit tests for query parsing and API parameter conversion.

- `frontend/tests/mail-status-tags.test.ts`  
  Component tests for list status tag rendering.

- `frontend/tests/mail-filter-toolbar.test.ts`  
  Component tests for folder-specific filters and search/reset emits.

- `frontend/tests/mail-table.test.ts`  
  Component tests for rows, empty/error states, and action emits.

- `frontend/tests/mail-list-page.test.ts`  
  Integration-style tests for route folder mapping, URL Query behavior, API calls, and navigation.

Modify:

- `frontend/src/api/type.ts`  
  Replace the incomplete `read?: boolean` query type with the OpenAPI-aligned query fields.

- `frontend/src/pages/mail/MailListPage.vue`  
  Replace static mock markup with real API state and the new components.

Reference documents:

- `docs/superpowers/specs/2026-06-06-mail-list-design.md`
- `docs/接口/默认模块.openapi.json`

---

### Task 1: Query Types And URL Helpers

**Files:**
- Modify: `frontend/src/api/type.ts`
- Create: `frontend/src/pages/mail/mail-list-query.ts`
- Test: `frontend/tests/mail-list-query.test.ts`

- [ ] **Step 1: Write the failing query helper tests**

Create `frontend/tests/mail-list-query.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import type { MailFolder } from '../src/api/type'
import {
  buildMailListQuery,
  getDefaultMailListState,
  hasActiveMailListFilters,
  parseMailListQuery,
  toMailQueryParams,
} from '../src/pages/mail/mail-list-query'

describe('mail list query helpers', () => {
  it('parses inbox query values and drops invalid enum values', () => {
    const state = parseMailListQuery('inbox', {
      page: '0',
      size: '999',
      keyword: '实验',
      readStatus: 'UNREAD',
      priority: 'INVALID',
      senderUsername: 'zhangsan',
    })

    expect(state).toMatchObject({
      page: 1,
      size: 10,
      filters: {
        keyword: '实验',
        readStatus: 'UNREAD',
        senderUsername: 'zhangsan',
        priority: undefined,
      },
    })
  })

  it('converts sent folder filters to API params', () => {
    const state = parseMailListQuery('sent', {
      page: '2',
      size: '20',
      keyword: '资料',
      recipientUsername: 'lisi',
      senderUsername: 'ignored',
      startTime: '2026-06-01 00:00:00',
      endTime: '2026-06-06 23:59:59',
    })

    expect(toMailQueryParams('sent', state)).toEqual({
      page: 2,
      size: 20,
      keyword: '资料',
      recipientUsername: 'lisi',
      startTime: '2026-06-01 00:00:00',
      endTime: '2026-06-06 23:59:59',
    })
  })

  it('builds spam query with only spam-supported filters', () => {
    const state = parseMailListQuery('spam', {
      page: '3',
      size: '50',
      keyword: '风险',
      spamLevel: 'HIGH',
      riskLevel: 'MEDIUM',
      readStatus: 'READ',
    })

    expect(buildMailListQuery('spam', state)).toEqual({
      page: '3',
      size: '50',
      keyword: '风险',
      spamLevel: 'HIGH',
      riskLevel: 'MEDIUM',
    })
  })

  it('detects active filters per folder', () => {
    const inbox = parseMailListQuery('inbox', {
      page: '1',
      size: '10',
      readStatus: 'ALL',
    })
    const trash = parseMailListQuery('trash', {
      page: '1',
      size: '10',
      keyword: '已删除',
    })

    expect(hasActiveMailListFilters('inbox', inbox)).toBe(false)
    expect(hasActiveMailListFilters('trash', trash)).toBe(true)
  })

  it('creates default state for every folder', () => {
    const folders: MailFolder[] = ['inbox', 'sent', 'trash', 'spam']

    for (const folder of folders) {
      expect(getDefaultMailListState(folder)).toMatchObject({
        page: 1,
        size: 10,
        filters: {
          keyword: '',
          startTime: '',
          endTime: '',
        },
      })
    }
  })
})
```

- [ ] **Step 2: Run the query helper test to verify it fails**

Run from `frontend`:

```powershell
npm.cmd test -- tests/mail-list-query.test.ts
```

Expected: FAIL because `../src/pages/mail/mail-list-query` does not exist.

- [ ] **Step 3: Update API query types**

In `frontend/src/api/type.ts`, replace the existing `MailQueryParams` definition:

```ts
export type MailQueryParams = {
  page?: number
  size?: number
  keyword?: string
  read?: boolean
  startTime?: string
  endTime?: string
}
```

with:

```ts
export type ReadStatus = 'ALL' | 'READ' | 'UNREAD'

export type MailQueryParams = {
  page?: number
  size?: number
  keyword?: string
  readStatus?: ReadStatus
  senderUsername?: string
  recipientUsername?: string
  priority?: Priority
  spamLevel?: SpamLevel
  riskLevel?: RiskLevel
  startTime?: string
  endTime?: string
}
```

- [ ] **Step 4: Implement the query helper**

Create `frontend/src/pages/mail/mail-list-query.ts`:

```ts
import type { LocationQuery, LocationQueryRaw } from 'vue-router'

import type {
  MailFolder,
  MailQueryParams,
  Priority,
  ReadStatus,
  RiskLevel,
  SpamLevel,
} from '../../api/type'

const PAGE_SIZES = [10, 20, 50] as const
const READ_STATUSES: ReadStatus[] = ['ALL', 'READ', 'UNREAD']
const PRIORITIES: Priority[] = ['HIGH', 'MEDIUM', 'LOW']
const SPAM_LEVELS: SpamLevel[] = ['NONE', 'LOW', 'MEDIUM', 'HIGH']
const RISK_LEVELS: RiskLevel[] = ['SAFE', 'LOW', 'MEDIUM', 'HIGH']

export type MailListFilters = {
  keyword: string
  readStatus?: ReadStatus
  senderUsername: string
  recipientUsername: string
  priority?: Priority
  spamLevel?: SpamLevel
  riskLevel?: RiskLevel
  startTime: string
  endTime: string
}

export type MailListState = {
  page: number
  size: number
  filters: MailListFilters
}

function firstValue(value: LocationQuery[string]) {
  if (Array.isArray(value)) {
    return value[0] || ''
  }

  return value || ''
}

function normalizedString(value: LocationQuery[string]) {
  return String(firstValue(value)).trim()
}

function positiveInt(value: LocationQuery[string], fallback: number) {
  const parsed = Number.parseInt(String(firstValue(value)), 10)

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed
  }

  return fallback
}

function pageSize(value: LocationQuery[string]) {
  const parsed = positiveInt(value, 10)

  return PAGE_SIZES.includes(parsed as (typeof PAGE_SIZES)[number]) ? parsed : 10
}

function enumValue<T extends string>(value: LocationQuery[string], allowed: T[]) {
  const text = normalizedString(value)

  return allowed.includes(text as T) ? (text as T) : undefined
}

export function getDefaultMailListState(_folder: MailFolder): MailListState {
  return {
    page: 1,
    size: 10,
    filters: {
      keyword: '',
      readStatus: undefined,
      senderUsername: '',
      recipientUsername: '',
      priority: undefined,
      spamLevel: undefined,
      riskLevel: undefined,
      startTime: '',
      endTime: '',
    },
  }
}

export function parseMailListQuery(folder: MailFolder, query: LocationQuery): MailListState {
  const state = getDefaultMailListState(folder)

  state.page = positiveInt(query.page, 1)
  state.size = pageSize(query.size)
  state.filters.keyword = normalizedString(query.keyword)
  state.filters.startTime = normalizedString(query.startTime)
  state.filters.endTime = normalizedString(query.endTime)

  if (folder === 'inbox') {
    state.filters.readStatus = enumValue(query.readStatus, READ_STATUSES)
    state.filters.senderUsername = normalizedString(query.senderUsername)
    state.filters.priority = enumValue(query.priority, PRIORITIES)
  }

  if (folder === 'sent') {
    state.filters.recipientUsername = normalizedString(query.recipientUsername)
  }

  if (folder === 'spam') {
    state.filters.spamLevel = enumValue(query.spamLevel, SPAM_LEVELS)
    state.filters.riskLevel = enumValue(query.riskLevel, RISK_LEVELS)
  }

  return state
}

function put(query: LocationQueryRaw, key: string, value: string | number | undefined) {
  if (value !== undefined && value !== '') {
    query[key] = String(value)
  }
}

export function buildMailListQuery(folder: MailFolder, state: MailListState): LocationQueryRaw {
  const query: LocationQueryRaw = {
    page: String(state.page),
    size: String(state.size),
  }

  put(query, 'keyword', state.filters.keyword)
  put(query, 'startTime', state.filters.startTime)
  put(query, 'endTime', state.filters.endTime)

  if (folder === 'inbox') {
    if (state.filters.readStatus && state.filters.readStatus !== 'ALL') {
      put(query, 'readStatus', state.filters.readStatus)
    }
    put(query, 'senderUsername', state.filters.senderUsername)
    put(query, 'priority', state.filters.priority)
  }

  if (folder === 'sent') {
    put(query, 'recipientUsername', state.filters.recipientUsername)
  }

  if (folder === 'spam') {
    put(query, 'spamLevel', state.filters.spamLevel)
    put(query, 'riskLevel', state.filters.riskLevel)
  }

  return query
}

export function toMailQueryParams(folder: MailFolder, state: MailListState): MailQueryParams {
  const params: MailQueryParams = {
    page: state.page,
    size: state.size,
  }

  const query = buildMailListQuery(folder, state)

  for (const key of Object.keys(query)) {
    if (key === 'page' || key === 'size') {
      continue
    }

    const value = query[key]
    if (typeof value === 'string') {
      ;(params as Record<string, unknown>)[key] = value
    }
  }

  return params
}

export function hasActiveMailListFilters(folder: MailFolder, state: MailListState) {
  const params = toMailQueryParams(folder, {
    ...state,
    page: 1,
    size: 10,
  })

  return Object.keys(params).some((key) => key !== 'page' && key !== 'size')
}
```

- [ ] **Step 5: Run the query helper test to verify it passes**

Run from `frontend`:

```powershell
npm.cmd test -- tests/mail-list-query.test.ts
```

Expected: PASS for `mail-list-query.test.ts`.

- [ ] **Step 6: Commit query helpers**

Run from repo root:

```powershell
git add frontend/src/api/type.ts frontend/src/pages/mail/mail-list-query.ts frontend/tests/mail-list-query.test.ts
git commit -m "feat: add mail list query helpers"
```

---

### Task 2: Status Tag Component

**Files:**
- Create: `frontend/src/components/mail/MailStatusTags.vue`
- Test: `frontend/tests/mail-status-tags.test.ts`

- [ ] **Step 1: Write the failing status tag tests**

Create `frontend/tests/mail-status-tags.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, it } from 'vitest'

import MailStatusTags from '../src/components/mail/MailStatusTags.vue'
import type { MailListItemVO } from '../src/api/type'

const user = {
  username: 'zhangsan',
  nickname: '张三',
  emailAddress: 'zhangsan@mail.com',
  avatarText: '张',
}

function createItem(overrides: Partial<MailListItemVO> = {}): MailListItemVO {
  return {
    mailId: 1,
    subject: '实验报告提醒',
    snippet: '请按时提交实验报告',
    sender: user,
    recipient: user,
    sentAt: '2026-06-06 10:00:00',
    read: false,
    priority: 'HIGH',
    priorityLabel: '高',
    spam: true,
    spamLevel: 'HIGH',
    spamLevelLabel: '高垃圾风险',
    riskLevel: 'HIGH',
    riskLabel: '高风险',
    analysisStatus: 'FAILED',
    riskReason: '包含可疑链接',
    ...overrides,
  }
}

describe('MailStatusTags', () => {
  it('renders priority, risk, spam and failed analysis tags', () => {
    const wrapper = mount(MailStatusTags, {
      props: {
        folder: 'spam',
        item: createItem(),
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    expect(wrapper.text()).toContain('高')
    expect(wrapper.text()).toContain('高风险')
    expect(wrapper.text()).toContain('高垃圾风险')
    expect(wrapper.text()).toContain('分析失败')
  })

  it('does not render spam level outside spam folder', () => {
    const wrapper = mount(MailStatusTags, {
      props: {
        folder: 'inbox',
        item: createItem(),
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    expect(wrapper.text()).not.toContain('高垃圾风险')
  })
})
```

- [ ] **Step 2: Run the status tag test to verify it fails**

Run from `frontend`:

```powershell
npm.cmd test -- tests/mail-status-tags.test.ts
```

Expected: FAIL because `MailStatusTags.vue` does not exist.

- [ ] **Step 3: Implement `MailStatusTags.vue`**

Create `frontend/src/components/mail/MailStatusTags.vue`:

```vue
<script setup lang="ts">
import type { MailFolder, MailListItemVO } from '../../api/type'

const props = defineProps<{
  folder: MailFolder
  item: MailListItemVO
}>()

const priorityType = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'info',
} as const

const riskType = {
  SAFE: 'success',
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'danger',
} as const

const spamType = {
  NONE: 'info',
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'danger',
} as const

const analysisLabels = {
  PENDING: '分析中',
  SUCCESS: '已分析',
  FAILED: '分析失败',
} as const

const analysisType = {
  PENDING: 'warning',
  SUCCESS: 'success',
  FAILED: 'danger',
} as const
</script>

<template>
  <div class="flex flex-wrap items-center gap-1.5" data-test="mail-status-tags">
    <el-tag size="small" :type="priorityType[props.item.priority]">
      {{ props.item.priorityLabel }}
    </el-tag>

    <el-tag size="small" :type="riskType[props.item.riskLevel]">
      {{ props.item.riskLabel }}
    </el-tag>

    <el-tag
      v-if="props.folder === 'spam' && props.item.spamLevelLabel"
      size="small"
      :type="spamType[props.item.spamLevel]"
    >
      {{ props.item.spamLevelLabel }}
    </el-tag>

    <el-tag size="small" :type="analysisType[props.item.analysisStatus]">
      {{ analysisLabels[props.item.analysisStatus] }}
    </el-tag>
  </div>
</template>
```

- [ ] **Step 4: Run the status tag test to verify it passes**

Run from `frontend`:

```powershell
npm.cmd test -- tests/mail-status-tags.test.ts
```

Expected: PASS for `mail-status-tags.test.ts`.

- [ ] **Step 5: Commit status tag component**

Run from repo root:

```powershell
git add frontend/src/components/mail/MailStatusTags.vue frontend/tests/mail-status-tags.test.ts
git commit -m "feat: add mail status tags"
```

---

### Task 3: Filter Toolbar Component

**Files:**
- Create: `frontend/src/components/mail/MailFilterToolbar.vue`
- Test: `frontend/tests/mail-filter-toolbar.test.ts`

- [ ] **Step 1: Write the failing filter toolbar tests**

Create `frontend/tests/mail-filter-toolbar.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, it } from 'vitest'

import MailFilterToolbar from '../src/components/mail/MailFilterToolbar.vue'
import { getDefaultMailListState } from '../src/pages/mail/mail-list-query'

describe('MailFilterToolbar', () => {
  it('renders inbox-only filters and emits search with page reset', async () => {
    const wrapper = mount(MailFilterToolbar, {
      props: {
        folder: 'inbox',
        state: getDefaultMailListState('inbox'),
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    expect(wrapper.find('[data-test="filter-read-status"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="filter-sender"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="filter-recipient"]').exists()).toBe(false)

    await wrapper.find('[data-test="filter-keyword"] input').setValue('实验')
    await wrapper.get('[data-test="filter-search"]').trigger('click')

    expect(wrapper.emitted('search')?.[0][0]).toMatchObject({
      page: 1,
      filters: {
        keyword: '实验',
      },
    })
  })

  it('renders sent recipient filter', () => {
    const wrapper = mount(MailFilterToolbar, {
      props: {
        folder: 'sent',
        state: getDefaultMailListState('sent'),
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    expect(wrapper.find('[data-test="filter-recipient"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="filter-sender"]').exists()).toBe(false)
  })

  it('renders spam level and risk level filters', () => {
    const wrapper = mount(MailFilterToolbar, {
      props: {
        folder: 'spam',
        state: getDefaultMailListState('spam'),
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    expect(wrapper.find('[data-test="filter-spam-level"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="filter-risk-level"]').exists()).toBe(true)
  })

  it('emits reset with the current folder default state', async () => {
    const wrapper = mount(MailFilterToolbar, {
      props: {
        folder: 'trash',
        state: getDefaultMailListState('trash'),
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    await wrapper.get('[data-test="filter-reset"]').trigger('click')

    expect(wrapper.emitted('reset')?.[0][0]).toMatchObject({
      page: 1,
      size: 10,
      filters: {
        keyword: '',
      },
    })
  })
})
```

- [ ] **Step 2: Run the filter toolbar test to verify it fails**

Run from `frontend`:

```powershell
npm.cmd test -- tests/mail-filter-toolbar.test.ts
```

Expected: FAIL because `MailFilterToolbar.vue` does not exist.

- [ ] **Step 3: Implement `MailFilterToolbar.vue`**

Create `frontend/src/components/mail/MailFilterToolbar.vue` with this component contract:

```vue
<script setup lang="ts">
import { reactive, watch } from 'vue'

import type { MailFolder } from '../../api/type'
import {
  getDefaultMailListState,
  type MailListState,
} from '../../pages/mail/mail-list-query'

const props = defineProps<{
  folder: MailFolder
  state: MailListState
}>()

const emit = defineEmits<{
  search: [state: MailListState]
  reset: [state: MailListState]
}>()

const localState = reactive<MailListState>(getDefaultMailListState(props.folder))

function assignState(next: MailListState) {
  localState.page = next.page
  localState.size = next.size
  localState.filters = { ...next.filters }
}

watch(
  () => [props.folder, props.state] as const,
  () => assignState(props.state),
  { immediate: true, deep: true },
)

function search() {
  emit('search', {
    ...localState,
    page: 1,
    filters: { ...localState.filters },
  })
}

function reset() {
  emit('reset', getDefaultMailListState(props.folder))
}
</script>

<template>
  <section
    class="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
    data-test="mail-filter-toolbar"
  >
    <el-input
      v-model="localState.filters.keyword"
      class="w-64"
      clearable
      placeholder="搜索主题、正文或联系人"
      data-test="filter-keyword"
      @keyup.enter="search"
    />

    <el-select
      v-if="props.folder === 'inbox'"
      v-model="localState.filters.readStatus"
      class="w-32"
      clearable
      placeholder="已读状态"
      data-test="filter-read-status"
    >
      <el-option label="全部" value="ALL" />
      <el-option label="未读" value="UNREAD" />
      <el-option label="已读" value="READ" />
    </el-select>

    <el-input
      v-if="props.folder === 'inbox'"
      v-model="localState.filters.senderUsername"
      class="w-40"
      clearable
      placeholder="发件人"
      data-test="filter-sender"
      @keyup.enter="search"
    />

    <el-input
      v-if="props.folder === 'sent'"
      v-model="localState.filters.recipientUsername"
      class="w-40"
      clearable
      placeholder="收件人"
      data-test="filter-recipient"
      @keyup.enter="search"
    />

    <el-select
      v-if="props.folder === 'inbox'"
      v-model="localState.filters.priority"
      class="w-32"
      clearable
      placeholder="优先级"
      data-test="filter-priority"
    >
      <el-option label="高" value="HIGH" />
      <el-option label="中" value="MEDIUM" />
      <el-option label="低" value="LOW" />
    </el-select>

    <el-select
      v-if="props.folder === 'spam'"
      v-model="localState.filters.spamLevel"
      class="w-36"
      clearable
      placeholder="垃圾等级"
      data-test="filter-spam-level"
    >
      <el-option label="无" value="NONE" />
      <el-option label="低" value="LOW" />
      <el-option label="中" value="MEDIUM" />
      <el-option label="高" value="HIGH" />
    </el-select>

    <el-select
      v-if="props.folder === 'spam'"
      v-model="localState.filters.riskLevel"
      class="w-36"
      clearable
      placeholder="风险等级"
      data-test="filter-risk-level"
    >
      <el-option label="安全" value="SAFE" />
      <el-option label="低" value="LOW" />
      <el-option label="中" value="MEDIUM" />
      <el-option label="高" value="HIGH" />
    </el-select>

    <el-date-picker
      class="w-72"
      type="daterange"
      start-placeholder="开始时间"
      end-placeholder="结束时间"
      value-format="YYYY-MM-DD HH:mm:ss"
      :model-value="
        localState.filters.startTime && localState.filters.endTime
          ? [localState.filters.startTime, localState.filters.endTime]
          : []
      "
      data-test="filter-date-range"
      @update:model-value="
        (value) => {
          localState.filters.startTime = value?.[0] || ''
          localState.filters.endTime = value?.[1] || ''
        }
      "
    />

    <div class="ml-auto flex items-center gap-2">
      <el-button data-test="filter-reset" @click="reset">重置</el-button>
      <el-button type="primary" data-test="filter-search" @click="search">
        查询
      </el-button>
    </div>
  </section>
</template>
```

- [ ] **Step 4: Run the filter toolbar test to verify it passes**

Run from `frontend`:

```powershell
npm.cmd test -- tests/mail-filter-toolbar.test.ts
```

Expected: PASS for `mail-filter-toolbar.test.ts`.

- [ ] **Step 5: Commit filter toolbar**

Run from repo root:

```powershell
git add frontend/src/components/mail/MailFilterToolbar.vue frontend/tests/mail-filter-toolbar.test.ts
git commit -m "feat: add mail filter toolbar"
```

---

### Task 4: Mail Table Component

**Files:**
- Create: `frontend/src/components/mail/MailTable.vue`
- Test: `frontend/tests/mail-table.test.ts`

- [ ] **Step 1: Write the failing mail table tests**

Create `frontend/tests/mail-table.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, it } from 'vitest'

import MailTable from '../src/components/mail/MailTable.vue'
import type { MailListItemVO } from '../src/api/type'

const sender = {
  username: 'zhangsan',
  nickname: '张三',
  emailAddress: 'zhangsan@mail.com',
  avatarText: '张',
}

const recipient = {
  username: 'lisi',
  nickname: '李四',
  emailAddress: 'lisi@mail.com',
  avatarText: '李',
}

function createItem(overrides: Partial<MailListItemVO> = {}): MailListItemVO {
  return {
    mailId: 7,
    subject: '实验报告提醒',
    snippet: '请按时提交实验报告',
    sender,
    recipient,
    sentAt: '2026-06-06 10:00:00',
    read: false,
    priority: 'HIGH',
    priorityLabel: '高',
    spam: false,
    spamLevel: 'NONE',
    riskLevel: 'SAFE',
    riskLabel: '安全',
    analysisStatus: 'SUCCESS',
    ...overrides,
  }
}

describe('MailTable', () => {
  it('renders inbox sender, unread state, subject and action buttons', async () => {
    const wrapper = mount(MailTable, {
      props: {
        folder: 'inbox',
        records: [createItem()],
        total: 1,
        page: 1,
        size: 10,
        loading: false,
        error: '',
        hasActiveFilters: false,
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    expect(wrapper.text()).toContain('张三')
    expect(wrapper.text()).toContain('实验报告提醒')
    expect(wrapper.find('[data-test="unread-dot"]').exists()).toBe(true)

    await wrapper.get('[data-test="row-view"]').trigger('click')
    expect(wrapper.emitted('view')?.[0][0]).toBe(7)
  })

  it('renders sent recipient and hides delete action', () => {
    const wrapper = mount(MailTable, {
      props: {
        folder: 'sent',
        records: [createItem({ read: null })],
        total: 1,
        page: 1,
        size: 10,
        loading: false,
        error: '',
        hasActiveFilters: false,
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    expect(wrapper.text()).toContain('李四')
    expect(wrapper.find('[data-test="row-delete"]').exists()).toBe(false)
  })

  it('renders restore action for trash', async () => {
    const wrapper = mount(MailTable, {
      props: {
        folder: 'trash',
        records: [createItem({ deletedAt: '2026-06-06 11:00:00' })],
        total: 1,
        page: 1,
        size: 10,
        loading: false,
        error: '',
        hasActiveFilters: false,
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    await wrapper.get('[data-test="row-restore"]').trigger('click')
    expect(wrapper.emitted('restore')?.[0][0]).toBe(7)
  })

  it('renders empty filtered state and emits reset filters', async () => {
    const wrapper = mount(MailTable, {
      props: {
        folder: 'inbox',
        records: [],
        total: 0,
        page: 1,
        size: 10,
        loading: false,
        error: '',
        hasActiveFilters: true,
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    expect(wrapper.text()).toContain('没有符合条件的邮件')
    await wrapper.get('[data-test="table-reset-filters"]').trigger('click')
    expect(wrapper.emitted('resetFilters')).toHaveLength(1)
  })

  it('renders error state and emits reload', async () => {
    const wrapper = mount(MailTable, {
      props: {
        folder: 'inbox',
        records: [],
        total: 0,
        page: 1,
        size: 10,
        loading: false,
        error: '加载失败',
        hasActiveFilters: false,
      },
      global: {
        plugins: [ElementPlus],
      },
    })

    expect(wrapper.text()).toContain('加载失败')
    await wrapper.get('[data-test="table-reload"]').trigger('click')
    expect(wrapper.emitted('reload')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run the mail table test to verify it fails**

Run from `frontend`:

```powershell
npm.cmd test -- tests/mail-table.test.ts
```

Expected: FAIL because `MailTable.vue` does not exist.

- [ ] **Step 3: Implement `MailTable.vue`**

Create `frontend/src/components/mail/MailTable.vue`. The component must define this public contract:

```ts
const props = defineProps<{
  folder: MailFolder
  records: MailListItemVO[]
  total: number
  page: number
  size: number
  loading: boolean
  error: string
  hasActiveFilters: boolean
  operatingMailId?: number
}>()

const emit = defineEmits<{
  view: [mailId: number]
  delete: [mailId: number]
  restore: [mailId: number]
  reload: []
  resetFilters: []
  pageChange: [page: number]
  sizeChange: [size: number]
}>()
```

The template must:

- Use an Element Plus table for non-empty data.
- Render sender for `inbox`, `trash`, and `spam`.
- Render recipient for `sent`.
- Render `[data-test="unread-dot"]` when `item.read === false`.
- Render `MailStatusTags` in the tag column.
- Render `[data-test="row-view"]` for every row.
- Render `[data-test="row-delete"]` only for `inbox` and `spam`.
- Render `[data-test="row-restore"]` only for `trash`.
- Render `[data-test="table-reset-filters"]` in filtered empty state.
- Render `[data-test="table-reload"]` in error state.

Use these helpers inside the component:

```ts
function contactFor(item: MailListItemVO) {
  return props.folder === 'sent' ? item.recipient : item.sender
}

function canDelete() {
  return props.folder === 'inbox' || props.folder === 'spam'
}

function canRestore() {
  return props.folder === 'trash'
}
```

- [ ] **Step 4: Run the mail table test to verify it passes**

Run from `frontend`:

```powershell
npm.cmd test -- tests/mail-table.test.ts
```

Expected: PASS for `mail-table.test.ts`.

- [ ] **Step 5: Commit mail table**

Run from repo root:

```powershell
git add frontend/src/components/mail/MailTable.vue frontend/tests/mail-table.test.ts
git commit -m "feat: add mail table component"
```

---

### Task 5: Mail List Page Integration

**Files:**
- Modify: `frontend/src/pages/mail/MailListPage.vue`
- Test: `frontend/tests/mail-list-page.test.ts`

- [ ] **Step 1: Write the failing page integration tests**

Create `frontend/tests/mail-list-page.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'

import type { MailPageData } from '../src/api/type'
import MailListPage from '../src/pages/mail/MailListPage.vue'
import { createAppRouter } from '../src/router'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  delete: vi.fn(),
  restore: vi.fn(),
}))

vi.mock('../src/api/mail', () => ({
  default: {
    list: mocks.list,
    delete: mocks.delete,
    restore: mocks.restore,
  },
}))

const user = {
  username: 'zhangsan',
  nickname: '张三',
  emailAddress: 'zhangsan@mail.com',
  avatarText: '张',
}

const pageData: MailPageData = {
  page: 1,
  size: 10,
  total: 1,
  totalPages: 1,
  records: [
    {
      mailId: 9,
      subject: '实验报告提醒',
      snippet: '请按时提交实验报告',
      sender: user,
      recipient: user,
      sentAt: '2026-06-06 10:00:00',
      read: false,
      priority: 'HIGH',
      priorityLabel: '高',
      spam: false,
      spamLevel: 'NONE',
      riskLevel: 'SAFE',
      riskLabel: '安全',
      analysisStatus: 'SUCCESS',
    },
  ],
}

async function mountAt(path: string) {
  localStorage.setItem('mail_token', 'token-123')
  mocks.list.mockResolvedValue(pageData)

  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()

  const wrapper = mount(MailListPage, {
    global: {
      plugins: [ElementPlus, router],
    },
  })

  await new Promise((resolve) => window.setTimeout(resolve))

  return { wrapper, router }
}

describe('MailListPage', () => {
  beforeEach(() => {
    localStorage.clear()
    mocks.list.mockReset()
    mocks.delete.mockReset()
    mocks.restore.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('loads inbox with parsed query params', async () => {
    await mountAt('/mail/inbox?page=2&size=20&keyword=实验&readStatus=UNREAD')

    expect(mocks.list).toHaveBeenCalledWith('inbox', {
      page: 2,
      size: 20,
      keyword: '实验',
      readStatus: 'UNREAD',
    })
  })

  it('loads sent with recipientUsername query params', async () => {
    await mountAt('/mail/sent?recipientUsername=lisi')

    expect(mocks.list).toHaveBeenCalledWith('sent', {
      page: 1,
      size: 10,
      recipientUsername: 'lisi',
    })
  })

  it('search updates query and resets page', async () => {
    const { wrapper, router } = await mountAt('/mail/inbox?page=3&size=10')

    await wrapper.find('[data-test="filter-keyword"] input').setValue('实验')
    await wrapper.get('[data-test="filter-search"]').trigger('click')
    await new Promise((resolve) => window.setTimeout(resolve))

    expect(router.currentRoute.value.query).toMatchObject({
      page: '1',
      size: '10',
      keyword: '实验',
    })
  })

  it('clicks table row action and navigates to detail', async () => {
    const { wrapper, router } = await mountAt('/mail/inbox')

    await wrapper.get('[data-test="row-view"]').trigger('click')

    expect(router.currentRoute.value.path).toBe('/mail/9')
  })

  it('shows error state when list request fails', async () => {
    localStorage.setItem('mail_token', 'token-123')
    mocks.list.mockRejectedValue(new Error('网络错误'))

    const router = createAppRouter(createMemoryHistory())
    await router.push('/mail/inbox')
    await router.isReady()

    const wrapper = mount(MailListPage, {
      global: {
        plugins: [ElementPlus, router],
      },
    })

    await new Promise((resolve) => window.setTimeout(resolve))

    expect(wrapper.text()).toContain('网络错误')
  })
})
```

- [ ] **Step 2: Run the page integration test to verify it fails**

Run from `frontend`:

```powershell
npm.cmd test -- tests/mail-list-page.test.ts
```

Expected: FAIL because current `MailListPage.vue` is static and does not call `mailApi.list`.

- [ ] **Step 3: Implement `MailListPage.vue` as the route container**

Replace the static content in `frontend/src/pages/mail/MailListPage.vue` with a container that:

- Imports `mailApi`, `MailFilterToolbar`, `MailTable`, and query helpers.
- Reads `folder` from `route.meta.folder`.
- Parses `route.query` into `MailListState`.
- Calls `mailApi.list(folder, toMailQueryParams(folder, state))`.
- Updates the router Query on search, reset, page change, and size change.
- Navigates to `/mail/${mailId}` for view.
- Calls `mailApi.delete(mailId)` for inbox/spam delete.
- Calls `mailApi.restore(mailId)` for trash restore.

Use this script structure:

```ts
const route = useRoute()
const router = useRouter()

const folder = computed(() => String(route.meta.folder || 'inbox') as MailFolder)
const title = computed(() => String(route.meta.title || '邮件列表'))
const state = computed(() => parseMailListQuery(folder.value, route.query))
const pageData = ref<MailPageData>({ page: 1, size: 10, total: 0, totalPages: 0, records: [] })
const loading = ref(false)
const error = ref('')
const operatingMailId = ref<number>()

async function loadList() {
  loading.value = true
  error.value = ''

  try {
    pageData.value = await mailApi.list(
      folder.value,
      toMailQueryParams(folder.value, state.value),
    )
  } catch (err) {
    error.value = err instanceof Error ? err.message : '邮件列表加载失败'
  } finally {
    loading.value = false
  }
}
```

The template must render:

```vue
<MailFilterToolbar
  :folder="folder"
  :state="state"
  @search="applyState"
  @reset="applyState"
/>

<section class="rounded-lg border border-slate-200 bg-white shadow-sm">
  <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
    <div>
      <h2 class="text-base font-semibold text-slate-950">{{ title }}</h2>
      <p class="mt-1 text-xs text-slate-500">{{ folderNote }}</p>
    </div>
    <div class="text-sm text-slate-500">共 {{ pageData.total }} 封</div>
  </div>

  <MailTable
    :folder="folder"
    :records="pageData.records"
    :total="pageData.total"
    :page="state.page"
    :size="state.size"
    :loading="loading"
    :error="error"
    :has-active-filters="hasActiveMailListFilters(folder, state)"
    :operating-mail-id="operatingMailId"
    @view="openDetail"
    @delete="deleteMail"
    @restore="restoreMail"
    @reload="loadList"
    @reset-filters="applyState(getDefaultMailListState(folder))"
    @page-change="changePage"
    @size-change="changeSize"
  />
</section>
```

- [ ] **Step 4: Run the page integration test to verify it passes**

Run from `frontend`:

```powershell
npm.cmd test -- tests/mail-list-page.test.ts
```

Expected: PASS for `mail-list-page.test.ts`.

- [ ] **Step 5: Run all mail list tests**

Run from `frontend`:

```powershell
npm.cmd test -- tests/mail-list-query.test.ts tests/mail-status-tags.test.ts tests/mail-filter-toolbar.test.ts tests/mail-table.test.ts tests/mail-list-page.test.ts
```

Expected: PASS for the five mail list test files.

- [ ] **Step 6: Commit list page integration**

Run from repo root:

```powershell
git add frontend/src/pages/mail/MailListPage.vue frontend/tests/mail-list-page.test.ts
git commit -m "feat: connect mail list page to api"
```

---

### Task 6: Full Verification

**Files:**
- No new files.

- [ ] **Step 1: Run the full frontend test suite**

Run from `frontend`:

```powershell
npm.cmd test
```

Expected: PASS for all test files.

- [ ] **Step 2: Run the production build**

Run from `frontend`:

```powershell
npm.cmd run build
```

Expected: build succeeds. Existing Vite/Rolldown warnings from dependencies or large chunks may remain; no TypeScript or Vue compilation errors are acceptable.

- [ ] **Step 3: Check git status**

Run from repo root:

```powershell
git status --short
```

Expected: clean working tree after all task commits.

---

## Self-Review

Spec coverage:

- Four folders and route/API mapping are covered by Task 5.
- Query parameter alignment is covered by Task 1.
- Filter toolbar behavior is covered by Task 3.
- Table display, action visibility, empty state, and error state are covered by Task 4.
- URL Query synchronization and navigation are covered by Task 5.
- Tests and build verification are covered by Task 6.

Scope check:

- The plan does not implement mail detail rendering, reply mail, rich-text editing, sidebar statistics, or mobile drawer navigation.
- The plan adds `mail-list-query.ts` to isolate query parsing; this supports the approved list scope and avoids bloating `MailListPage.vue`.

Type consistency:

- `ReadStatus`, `Priority`, `SpamLevel`, and `RiskLevel` are used consistently in `MailQueryParams`, `MailListState`, and query helper tests.
- `MailFolder` remains `inbox | sent | trash | spam`.
- `readStatus` replaces the older `read?: boolean` list query field.
