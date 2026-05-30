import { getDb } from './db'

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

export function getGlobalTags() {
  const rows = getDb().prepare('SELECT name FROM tags ORDER BY name COLLATE NOCASE ASC').all() as { name: string }[]
  return rows.map((r) => r.name)
}

export function addGlobalTag(name: string) {
  const normalized = normalizeTag(name)
  if (!normalized) return null
  
  const db = getDb()
  db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').run(normalized)
  return normalized
}

export function removeGlobalTag(name: string) {
  const normalized = normalizeTag(name)
  if (!normalized) return

  const db = getDb()
  
  db.prepare('BEGIN IMMEDIATE').run()
  try {
    db.prepare('DELETE FROM tags WHERE name = ?').run(normalized)

    // Remove from courses
    const courses = db.prepare('SELECT id, tags_json FROM courses').all() as { id: number, tags_json: string }[]
    const updateStmt = db.prepare('UPDATE courses SET tags_json = ? WHERE id = ?')
    
    for (const course of courses) {
      const currentTags = parseTagsJson(course.tags_json)
      const newTags = currentTags.filter((t) => t.toLowerCase() !== normalized.toLowerCase())
      if (newTags.length !== currentTags.length) {
        updateStmt.run(JSON.stringify(newTags), course.id)
      }
    }
    
    db.prepare('COMMIT').run()
  } catch (err) {
    db.prepare('ROLLBACK').run()
    throw err
  }
}

