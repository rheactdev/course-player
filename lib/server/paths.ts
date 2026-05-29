import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { getServerConfig } from './config'

const hiddenOrTempExtensions = new Set(['.tmp', '.temp', '.part', '.crdownload'])

export function normalizeRelativePath(value: string) {
  return value.split(path.sep).join('/').replaceAll('\\', '/')
}

export function isIgnoredName(name: string) {
  if (!name || name === '.DS_Store') return true
  if (name.startsWith('.') || name.startsWith('~$')) return true
  if (name.endsWith('~')) return true
  return hiddenOrTempExtensions.has(path.extname(name).toLowerCase())
}

export function hasIgnoredPathSegment(relativePath: string) {
  return normalizeRelativePath(relativePath).split('/').some(isIgnoredName)
}

export function resolveCourseRelativePath(relativePath: string) {
  const config = getServerConfig()
  const normalized = normalizeRelativePath(relativePath)

  if (path.isAbsolute(normalized) || normalized.includes('\0') || hasIgnoredPathSegment(normalized)) {
    return null
  }

  const absolutePath = path.resolve(config.coursesDir, normalized)
  const relativeFromRoot = path.relative(config.coursesDir, absolutePath)

  if (
    relativeFromRoot === '' ||
    relativeFromRoot.startsWith('..') ||
    path.isAbsolute(relativeFromRoot)
  ) {
    return null
  }

  return absolutePath
}

export function getExistingCourseFile(relativePath: string) {
  const absolutePath = resolveCourseRelativePath(relativePath)
  if (!absolutePath || !existsSync(absolutePath)) return null

  const stats = statSync(absolutePath)
  if (!stats.isFile()) return null

  return { absolutePath, stats }
}

export function relativeToCoursesDir(absolutePath: string) {
  return normalizeRelativePath(path.relative(getServerConfig().coursesDir, absolutePath))
}
