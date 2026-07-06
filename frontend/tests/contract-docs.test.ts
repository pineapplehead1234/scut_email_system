import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const testDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(testDir, '..', '..')

function readProjectFile(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8')
}

describe('final interface contract documents', () => {
  it('keeps the default OpenAPI file synchronized with the final OpenAPI file', () => {
    const defaultContract = JSON.parse(
      readProjectFile('docs/接口/默认模块.openapi.json'),
    )
    const finalContract = JSON.parse(
      readProjectFile('docs/接口/最终默认模块.openapi.json'),
    )

    expect(defaultContract).toEqual(finalContract)
  })

  it('keeps thread APIs read-only in the final contract', () => {
    const finalContract = JSON.parse(
      readProjectFile('docs/接口/最终默认模块.openapi.json'),
    ) as { paths: Record<string, Record<string, unknown>> }

    expect(finalContract.paths['/api/threads']).toHaveProperty('get')
    expect(finalContract.paths['/api/threads/{threadId}']).toEqual({
      get: expect.any(Object),
    })
    expect(finalContract.paths).not.toHaveProperty('/api/threads/statistics')
    expect(finalContract.paths).not.toHaveProperty(
      '/api/threads/{threadId}/read',
    )
    expect(finalContract.paths).not.toHaveProperty(
      '/api/threads/{threadId}/restore',
    )
    expect(finalContract.paths).not.toHaveProperty(
      '/api/threads/{threadId}/analysis/retry',
    )
  })

  it('does not keep stale standalone mail detail route design in docs', () => {
    const docs = [
      'docs/接口/frontend-ui-plan.md',
      'docs/superpowers/specs/2026-06-06-mail-list-design.md',
      'docs/superpowers/specs/2026-07-04-mail-thread-refactor-design.md',
    ].map((path) => readProjectFile(path))

    for (const content of docs) {
      expect(content).not.toContain('/mail/:mailId')
      expect(content).not.toContain('MailDetailPage')
    }
  })
})
