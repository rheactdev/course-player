export type CourseMetadata = {
  courseName?: unknown
  title?: unknown
  coverImage?: unknown
  cover?: unknown
  tags?: unknown
  creator?: unknown
  instructor?: unknown
}

export type CourseRecord = {
  id: number
  slug: string
  course_name: string
  creator: string | null
  tags_json: string
  root_path: string
  cover_path: string | null
  created_at: string
  updated_at: string
  last_scanned_at: string | null
}

export type SectionRecord = {
  id: number
  course_id: number
  section_index: number
  title: string
  relative_path: string
  sort_order: number
}

export type LessonRecord = {
  id: number
  course_id: number
  section_id: number
  lesson_index: number
  title: string
  relative_path: string
  duration_seconds: number | null
  size_bytes: number
  mtime_ms: number
  sort_order: number
  unavailable: number
}

export type AttachmentRecord = {
  id: number
  course_id: number
  section_id: number
  lesson_id: number | null
  attachment_index: number | null
  name: string
  relative_path: string
  extension: string | null
  size_bytes: number
  mtime_ms: number
  unavailable: number
}

export type ProgressRecord = {
  id: number
  lesson_id: number
  position_seconds: number
  duration_seconds: number | null
  watched_intervals_json: string
  watched_seconds: number
  percent_watched: number
  completed: number
  completed_at: string | null
  updated_at: string
}

export type WatchedInterval = [number, number]

export type ScanSummary = {
  scanRunId: number
  status: 'success' | 'failed'
  coursesFound: number
  sectionsFound: number
  lessonsFound: number
  attachmentsFound: number
  filesChanged: number
  errors: string[]
}
