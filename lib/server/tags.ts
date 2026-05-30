export function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function uniqueTags(tags: string[]) {
  const seen = new Set<string>()
  const result: string[] = []

  for (const tag of tags.map(normalizeTag).filter(Boolean)) {
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(tag)
  }

  return result.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

export function parseTagsJson(tagsJson: string | null | undefined) {
  if (!tagsJson) return []

  try {
    const tags = JSON.parse(tagsJson)
    return Array.isArray(tags)
      ? uniqueTags(tags.filter((tag): tag is string => typeof tag === 'string'))
      : []
  } catch {
    return []
  }
}
