import type { AttachmentRecord, CourseRecord, ProgressRecord } from './types'

export type SerializedCourse = {
  id: number
  slug: string
  courseName: string
  creator: string | null
  tags: string[]
  rootPath: string
  coverPath: string | null
  createdAt: string
  updatedAt: string
  lastScannedAt: string | null
}

export type SerializedAttachment = {
  id: number
  courseId: number
  sectionId: number
  lessonId: number | null
  attachmentIndex: number | null
  name: string
  relativePath: string
  extension: string | null
  sizeBytes: number
  mtimeMs: number
  unavailable: boolean
}

export type SerializedProgress = {
  id: number
  lessonId: number
  positionSeconds: number
  durationSeconds: number | null
  watchedIntervals: unknown
  watchedSeconds: number
  percentWatched: number
  completed: boolean
  completedAt: string | null
  updatedAt: string
}

export function parseTags(tagsJson: string) {
  try {
    const tags = JSON.parse(tagsJson)
    return Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === 'string') : []
  } catch {
    return []
  }
}

export function serializeCourse(course: CourseRecord): SerializedCourse {
  return {
    id: course.id,
    slug: course.slug,
    courseName: course.course_name,
    creator: course.creator,
    tags: parseTags(course.tags_json),
    rootPath: course.root_path,
    coverPath: course.cover_path,
    createdAt: course.created_at,
    updatedAt: course.updated_at,
    lastScannedAt: course.last_scanned_at,
  }
}

export function serializeAttachment(attachment: AttachmentRecord): SerializedAttachment {
  return {
    id: attachment.id,
    courseId: attachment.course_id,
    sectionId: attachment.section_id,
    lessonId: attachment.lesson_id,
    attachmentIndex: attachment.attachment_index,
    name: attachment.name,
    relativePath: attachment.relative_path,
    extension: attachment.extension,
    sizeBytes: attachment.size_bytes,
    mtimeMs: attachment.mtime_ms,
    unavailable: Boolean(attachment.unavailable),
  }
}

export function serializeProgress(progress: ProgressRecord | null | undefined): SerializedProgress | null {
  if (!progress) return null

  return {
    id: progress.id,
    lessonId: progress.lesson_id,
    positionSeconds: progress.position_seconds,
    durationSeconds: progress.duration_seconds,
    watchedIntervals: JSON.parse(progress.watched_intervals_json),
    watchedSeconds: progress.watched_seconds,
    percentWatched: progress.percent_watched,
    completed: Boolean(progress.completed),
    completedAt: progress.completed_at,
    updatedAt: progress.updated_at,
  }
}
