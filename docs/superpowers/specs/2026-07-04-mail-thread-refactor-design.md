# Mail Thread Refactor Design

## Source Of Truth

All frontend API contracts use `docs/接口/最终默认模块.openapi.json` as the source of truth. `docs/接口/默认模块.openapi.json` is synchronized to the same content to avoid split-brain contract reads.

## Final Contract Boundary

The final API model is not a full thread-level replacement of mail operations.

- Thread APIs are read-only for the inbox conversation experience:
  - `GET /api/threads`
  - `GET /api/threads/{threadId}`
- Mail APIs own folder lists, state mutations, and statistics:
  - `GET /api/mails/inbox`
  - `GET /api/mails/sent`
  - `GET /api/mails/trash`
  - `GET /api/mails/spam`
  - `DELETE /api/mails/{mailId}`
  - `PATCH /api/mails/{mailId}/read`
  - `PATCH /api/mails/{mailId}/restore`
  - `GET /api/mails/statistics`
  - `POST /api/mails/{mailId}/analysis/retry`
- Email send and reply use the final payload names:
  - `POST /api/emails/send` uses `{ to, subject, content }`
  - `POST /api/emails/reply` uses `{ mailId, Sessionid, subject?, content }`

## Frontend Routing

- `/mail/inbox` renders `ThreadListPage`.
- `/mail/sent`, `/mail/trash`, and `/mail/spam` render `MailListPage`.
- `/mail/thread/:threadId` renders `ThreadDetailPage`.
- There is no standalone mail-id detail route in the current UI; mail list rows navigate to their owning thread through `threadId`.

## GoF-Oriented Responsibilities

- `email-request-builder.ts` is the Builder/Adapter for final send and reply payloads.
- `mailbox-mutations.ts` is a Facade for side-effecting mail/email operations and statistics refresh.
- `mail-statistics-context.ts` is the typed Observer-style refresh channel used by layout and mutation flows.
- `mailApi` owns final mail endpoints.
- `threadApi` owns only final thread read endpoints.
- `ThreadMessageList` is presentational and receives actions from its parent; `ThreadListPage` currently passes no thread state actions because the final thread contract has no mutation endpoints.
- `MailListPage` owns mail-folder behavior and calls mail mutations by `mailId`.

## Verification Scope

The contract is protected by tests for:

- `emailApi` final payload names.
- `mailApi` final folder/stat/mutation endpoints.
- `threadApi` absence of final-contract-missing mutation methods.
- `ThreadListPage` not passing folder params to `GET /api/threads`.
- `MailListPage` using `mailId` for mutations and navigating rows by `threadId`.
- Layout statistics using `mailApi.statistics()`.
