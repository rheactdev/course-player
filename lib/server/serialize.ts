import type { AttachmentRecord, CourseRecord, ProgressRecord } from './types'

export function parseTags(tagsJson: string) {
  try {
    const tags = JSON.parse(tagsJson)
    return Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === 'string') : []
  } catch {
    return []
  }
}

export function serializeCourse(course: CourseRecord) {
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

export function serializeAttachment(attachment: AttachmentRecord) {
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

export function serializeProgress(progress: ProgressRecord | null | undefined) {
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
