import type { LocationQueryValue } from 'vue-router'

export function firstQueryValue(value: LocationQueryValue | LocationQueryValue[]) {
  return Array.isArray(value) ? value[0] : value
}

export function readString(value: LocationQueryValue | LocationQueryValue[]) {
  const normalized = firstQueryValue(value)

  return typeof normalized === 'string' && normalized.trim()
    ? normalized.trim()
    : undefined
}

export function readPositiveInteger(
  value: LocationQueryValue | LocationQueryValue[],
) {
  const normalized = Number(readString(value))

  return Number.isInteger(normalized) && normalized > 0 ? normalized : undefined
}

export function readEnum<T extends string>(
  value: LocationQueryValue | LocationQueryValue[],
  candidates: T[],
) {
  const normalized = readString(value)

  return normalized && candidates.includes(normalized as T)
    ? (normalized as T)
    : undefined
}
