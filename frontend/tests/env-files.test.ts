import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readEnvKeys(filename: string) {
  const content = readFileSync(resolve(process.cwd(), filename), 'utf8')

  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('=')[0])
    .sort()
}

describe('env files', () => {
  it('keeps development and production env files aligned with the example', () => {
    const expectedKeys = readEnvKeys('.env.example')

    expect(readEnvKeys('.env.development')).toEqual(expectedKeys)
    expect(readEnvKeys('.env.production')).toEqual(expectedKeys)
  })
})
