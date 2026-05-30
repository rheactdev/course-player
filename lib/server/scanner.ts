import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { getServerConfig } from './config'
import { getDb } from './db'
import { isIgnoredName, normalizeRelativePath, relativeToCoursesDir } from './paths'
import { parseTagsJson, uniqueTags } from './tags'
import type {
  CourseMetadata,
  CourseRecord,
  LessonRecord,
  ScanSummary,
  SectionRecord,
} from './types'

const sectionPattern = /^(\d+)\.\s*(.+)$/
const lessonPattern = /^(\d+)\.\s*(.+)\.(mp4|mkv|webm|mov|m4v)$/i
const courseAttachmentPattern = /^(\d+)-(\d+)/
const leadingNumberPattern = /^(\d+)(?:\.\s*|\s+|-|_)?(.+)?$/
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])

type CourseCandidate = {
  courseRoot: string
  folderName: string
  instructorName: string | null
}

type AttachmentTarget = {
  section: SectionRecord
  lesson: LessonRecord | undefined
  attachmentIndex: number | null
}

function listVisibleEntries(directory: string) {
  if (!existsSync(directory)) return []

  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !isIgnoredName(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
}

function readMetadata(courseRoot: string, errors: string[]) {
  const metadataPath = path.join(courseRoot, 'metadata.json')
  if (!existsSync(metadataPath)) return {}

  try {
    return JSON.parse(readFileSync(metadataPath, 'utf8')) as CourseMetadata
  } catch (error) {
    errors.push(`Invalid metadata.json at ${metadataPath}: ${String(error)}`)
    return {}
  }
}

function stringField(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function tagsField(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function mergedCourseTags(rootPath: string, metadataTags: string[]) {
  const existing = getDb()
    .prepare('SELECT tags_json FROM courses WHERE root_path = ?')
    .get(rootPath) as Pick<CourseRecord, 'tags_json'> | undefined

  return uniqueTags([...parseTagsJson(existing?.tags_json), ...metadataTags])
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'course'
}

function uniqueSlug(baseSlug: string, rootPath: string) {
  const db = getDb()
  const existing = db
    .prepare('SELECT slug FROM courses WHERE slug = ? AND root_path = ?')
    .get(baseSlug, rootPath) as Pick<CourseRecord, 'slug'> | undefined
  if (existing) return baseSlug

  let slug = baseSlug
  let counter = 2
  while (db.prepare('SELECT id FROM courses WHERE slug = ?').get(slug)) {
    slug = `${baseSlug}-${counter}`
    counter += 1
  }

  return slug
}

function hasSectionFolders(directory: string) {
  return listVisibleEntries(directory).some(
    (entry) => entry.isDirectory() && sectionPattern.test(entry.name),
  )
}

function discoverCourseCandidates(coursesDir: string): CourseCandidate[] {
  const candidates: CourseCandidate[] = []

  for (const instructorEntry of listVisibleEntries(coursesDir)) {
    if (!instructorEntry.isDirectory()) continue

    const instructorRoot = path.join(coursesDir, instructorEntry.name)

    for (const courseEntry of listVisibleEntries(instructorRoot)) {
      if (!courseEntry.isDirectory()) continue

      const courseRoot = path.join(instructorRoot, courseEntry.name)
      if (!hasSectionFolders(courseRoot)) continue

      candidates.push({
        courseRoot,
        folderName: courseEntry.name,
        instructorName: instructorEntry.name,
      })
    }
  }

  return candidates
}

function findCoverPath(courseRoot: string) {
  const cover = listVisibleEntries(courseRoot).find((entry) => {
    if (!entry.isFile()) return false
    return imageExtensions.has(path.extname(entry.name).toLowerCase())
  })

  return cover ? relativeToCoursesDir(path.join(courseRoot, cover.name)) : null
}

function getCourseByRoot(rootPath: string) {
  return getDb().prepare('SELECT * FROM courses WHERE root_path = ?').get(rootPath) as CourseRecord
}

function getSection(courseId: number, sectionIndex: number) {
  return getDb()
    .prepare('SELECT * FROM sections WHERE course_id = ? AND section_index = ?')
    .get(courseId, sectionIndex) as SectionRecord
}

function getLessonBySectionIndex(sectionId: number, lessonIndex: number) {
  return getDb()
    .prepare('SELECT * FROM lessons WHERE section_id = ? AND lesson_index = ?')
    .get(sectionId, lessonIndex) as LessonRecord | undefined
}

function getSectionByIndex(courseId: number, sectionIndex: number) {
  return getDb()
    .prepare('SELECT * FROM sections WHERE course_id = ? AND section_index = ?')
    .get(courseId, sectionIndex) as SectionRecord | undefined
}

function collectAttachmentFiles(attachmentsRoot: string) {
  const files: string[] = []

  function walk(directory: string) {
    for (const entry of listVisibleEntries(directory)) {
      const absolutePath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        walk(absolutePath)
      } else if (entry.isFile()) {
        files.push(absolutePath)
      }
    }
  }

  if (existsSync(attachmentsRoot)) walk(attachmentsRoot)
  return files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

function attachmentIndexFor(attachmentsRoot: string, absolutePath: string) {
  const relativePath = normalizeRelativePath(path.relative(attachmentsRoot, absolutePath))
  const segments = relativePath.split('/')

  const folderMatch = segments.length > 1 ? /^(\d+)$/.exec(segments[0]) : null
  if (folderMatch) return Number(folderMatch[1])

  const fileMatch = leadingNumberPattern.exec(path.basename(absolutePath))
  return fileMatch ? Number(fileMatch[1]) : null
}

function courseAttachmentTargetFor(
  courseId: number,
  attachmentsRoot: string,
  absolutePath: string,
) {
  const relativePath = normalizeRelativePath(path.relative(attachmentsRoot, absolutePath))
  const segments = relativePath.split('/')
  const indexSource = segments.length > 1 ? segments[0] : path.basename(absolutePath)
  const match = courseAttachmentPattern.exec(indexSource)
  if (!match) return null

  const sectionIndex = Number(match[1])
  const lessonIndex = Number(match[2])
  const section = getSectionByIndex(courseId, sectionIndex)
  if (!section) return null

  return {
    section,
    lesson: getLessonBySectionIndex(section.id, lessonIndex),
    attachmentIndex: lessonIndex,
  } satisfies AttachmentTarget
}

function insertAttachment(
  courseId: number,
  target: AttachmentTarget,
  attachmentAbsolutePath: string,
) {
  const db = getDb()
  const attachmentStats = statSync(attachmentAbsolutePath)
  const attachmentRelativePath = relativeToCoursesDir(attachmentAbsolutePath)
  const attachmentName = path.basename(attachmentAbsolutePath)
  const extension = path.extname(attachmentName).replace(/^\./, '').toLowerCase() || null

  return db
    .prepare(
      `
    INSERT INTO attachments (
      course_id,
      section_id,
      lesson_id,
      attachment_index,
      name,
      relative_path,
      extension,
      size_bytes,
      mtime_ms,
      unavailable,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    ON CONFLICT(relative_path) DO UPDATE SET
      course_id = excluded.course_id,
      section_id = excluded.section_id,
      lesson_id = excluded.lesson_id,
      attachment_index = excluded.attachment_index,
      name = excluded.name,
      extension = excluded.extension,
      size_bytes = excluded.size_bytes,
      mtime_ms = excluded.mtime_ms,
      unavailable = 0,
      updated_at = CURRENT_TIMESTAMP
  `,
    )
    .run(
      courseId,
      target.section.id,
      target.lesson?.id ?? null,
      target.attachmentIndex,
      attachmentName,
      attachmentRelativePath,
      extension,
      attachmentStats.size,
      Math.round(attachmentStats.mtimeMs),
    ).changes
}

export function scanCourseLibrary(): ScanSummary {
  const config = getServerConfig()
  const db = getDb()
  const scanRun = db.prepare('INSERT INTO scan_runs (status) VALUES (?)').run('running')
  const scanRunId = Number(scanRun.lastInsertRowid)
  const errors: string[] = []
  const summary: ScanSummary = {
    scanRunId,
    status: 'success',
    coursesFound: 0,
    sectionsFound: 0,
    lessonsFound: 0,
    attachmentsFound: 0,
    filesChanged: 0,
    errors,
  }

  try {
    db.exec('BEGIN')
    summary.filesChanged += db.prepare('UPDATE lessons SET unavailable = 1').run().changes
    summary.filesChanged += db.prepare('UPDATE attachments SET unavailable = 1').run().changes

    const courseCandidates = discoverCourseCandidates(config.coursesDir)
    const candidateRootPaths = courseCandidates.map((candidate) =>
      relativeToCoursesDir(candidate.courseRoot),
    )

    if (candidateRootPaths.length) {
      const placeholders = candidateRootPaths.map(() => '?').join(', ')
      summary.filesChanged += db
        .prepare(`DELETE FROM courses WHERE root_path NOT IN (${placeholders})`)
        .run(...candidateRootPaths).changes
    } else {
      summary.filesChanged += db.prepare('DELETE FROM courses').run().changes
    }

    for (const candidate of courseCandidates) {
      const { courseRoot } = candidate
      const rootPath = relativeToCoursesDir(courseRoot)
      const metadata = readMetadata(courseRoot, errors)
      const courseName =
        stringField(metadata.courseName) || stringField(metadata.title) || candidate.folderName
      const creator =
        stringField(metadata.creator) ||
        stringField(metadata.instructor) ||
        candidate.instructorName
      const tagsJson = JSON.stringify(mergedCourseTags(rootPath, tagsField(metadata.tags)))
      const coverPath = findCoverPath(courseRoot)
      const slug = uniqueSlug(slugify(courseName), rootPath)

      summary.filesChanged += db
        .prepare(
          `
        INSERT INTO courses (slug, course_name, creator, tags_json, root_path, cover_path, updated_at, last_scanned_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(root_path) DO UPDATE SET
          slug = excluded.slug,
          course_name = excluded.course_name,
          creator = excluded.creator,
          tags_json = excluded.tags_json,
          cover_path = excluded.cover_path,
          updated_at = CURRENT_TIMESTAMP,
          last_scanned_at = CURRENT_TIMESTAMP
      `,
        )
        .run(slug, courseName, creator, tagsJson, rootPath, coverPath).changes

      const course = getCourseByRoot(rootPath)
      summary.coursesFound += 1

      for (const sectionEntry of listVisibleEntries(courseRoot)) {
        if (!sectionEntry.isDirectory() || sectionEntry.name === 'Attachments') continue

        const sectionMatch = sectionPattern.exec(sectionEntry.name)
        if (!sectionMatch) continue

        const sectionRoot = path.join(courseRoot, sectionEntry.name)
        const sectionIndex = Number(sectionMatch[1])
        const sectionTitle = sectionMatch[2].trim()
        const sectionRelativePath = relativeToCoursesDir(sectionRoot)

        summary.filesChanged += db
          .prepare(
            `
          INSERT INTO sections (course_id, section_index, title, relative_path, sort_order, updated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(course_id, section_index) DO UPDATE SET
            title = excluded.title,
            relative_path = excluded.relative_path,
            sort_order = excluded.sort_order,
            updated_at = CURRENT_TIMESTAMP
        `,
          )
          .run(course.id, sectionIndex, sectionTitle, sectionRelativePath, sectionIndex).changes

        const section = getSection(course.id, sectionIndex)
        summary.sectionsFound += 1

        for (const lessonEntry of listVisibleEntries(sectionRoot)) {
          if (!lessonEntry.isFile()) continue

          const lessonMatch = lessonPattern.exec(lessonEntry.name)
          if (!lessonMatch) continue

          const lessonAbsolutePath = path.join(sectionRoot, lessonEntry.name)
          const lessonStats = statSync(lessonAbsolutePath)
          const lessonIndex = Number(lessonMatch[1])
          const lessonTitle = lessonMatch[2].trim()
          const lessonRelativePath = relativeToCoursesDir(lessonAbsolutePath)

          summary.filesChanged += db
            .prepare(
              `
            INSERT INTO lessons (
              course_id,
              section_id,
              lesson_index,
              title,
              relative_path,
              size_bytes,
              mtime_ms,
              sort_order,
              unavailable,
              updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
            ON CONFLICT(section_id, lesson_index) DO UPDATE SET
              title = excluded.title,
              relative_path = excluded.relative_path,
              size_bytes = excluded.size_bytes,
              mtime_ms = excluded.mtime_ms,
              sort_order = excluded.sort_order,
              unavailable = 0,
              updated_at = CURRENT_TIMESTAMP
          `,
            )
            .run(
              course.id,
              section.id,
              lessonIndex,
              lessonTitle,
              lessonRelativePath,
              lessonStats.size,
              Math.round(lessonStats.mtimeMs),
              lessonIndex,
            ).changes

          summary.lessonsFound += 1
        }

        const attachmentsRoot = path.join(sectionRoot, 'Attachments')
        for (const attachmentAbsolutePath of collectAttachmentFiles(attachmentsRoot)) {
          const attachmentIndex = attachmentIndexFor(attachmentsRoot, attachmentAbsolutePath)
          const lesson =
            attachmentIndex === null
              ? undefined
              : getLessonBySectionIndex(section.id, attachmentIndex)

          summary.filesChanged += insertAttachment(
            course.id,
            {
              section,
              lesson,
              attachmentIndex,
            },
            attachmentAbsolutePath,
          )

          summary.attachmentsFound += 1
        }
      }

      const courseAttachmentsRoot = path.join(courseRoot, 'Attachments')
      for (const attachmentAbsolutePath of collectAttachmentFiles(courseAttachmentsRoot)) {
        const target = courseAttachmentTargetFor(
          course.id,
          courseAttachmentsRoot,
          attachmentAbsolutePath,
        )

        if (!target) {
          errors.push(`Could not match attachment to lesson: ${attachmentAbsolutePath}`)
          continue
        }

        summary.filesChanged += insertAttachment(course.id, target, attachmentAbsolutePath)
        summary.attachmentsFound += 1
      }
    }

    db.exec('COMMIT')
    db.prepare(
      `
      UPDATE scan_runs
      SET
        status = ?,
        finished_at = CURRENT_TIMESTAMP,
        courses_found = ?,
        sections_found = ?,
        lessons_found = ?,
        attachments_found = ?,
        files_changed = ?,
        error_log = ?
      WHERE id = ?
    `,
    ).run(
      'success',
      summary.coursesFound,
      summary.sectionsFound,
      summary.lessonsFound,
      summary.attachmentsFound,
      summary.filesChanged,
      errors.length ? JSON.stringify(errors) : null,
      scanRunId,
    )
  } catch (error) {
    db.exec('ROLLBACK')
    summary.status = 'failed'
    errors.push(String(error))
    db.prepare(
      `
      UPDATE scan_runs
      SET status = ?, finished_at = CURRENT_TIMESTAMP, error_log = ?
      WHERE id = ?
    `,
    ).run('failed', JSON.stringify(errors), scanRunId)
  }

  return summary
}
