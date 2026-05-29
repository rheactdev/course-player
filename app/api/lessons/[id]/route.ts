import { getDb } from '@/lib/server/db'
import { serializeAttachment, serializeCourse, serializeProgress } from '@/lib/server/serialize'
import type {
  AttachmentRecord,
  CourseRecord,
  LessonRecord,
  ProgressRecord,
  SectionRecord,
} from '@/lib/server/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lessonId = Number(id)
  if (!Number.isSafeInteger(lessonId) || lessonId < 1) {
    return Response.json({ error: 'Invalid lesson id' }, { status: 400 })
  }

  const db = getDb()
  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId) as LessonRecord | undefined

  if (!lesson) {
    return Response.json({ error: 'Lesson not found' }, { status: 404 })
  }

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(lesson.course_id) as CourseRecord
  const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(lesson.section_id) as SectionRecord
  const attachments = db
    .prepare('SELECT * FROM attachments WHERE lesson_id = ? ORDER BY name COLLATE NOCASE ASC')
    .all(lesson.id) as AttachmentRecord[]
  const progress = db.prepare('SELECT * FROM progress WHERE lesson_id = ?').get(lesson.id) as
    | ProgressRecord
    | undefined

  return Response.json({
    lesson: {
      id: lesson.id,
      courseId: lesson.course_id,
      sectionId: lesson.section_id,
      lessonIndex: lesson.lesson_index,
      title: lesson.title,
      relativePath: lesson.relative_path,
      durationSeconds: lesson.duration_seconds,
      sizeBytes: lesson.size_bytes,
      mtimeMs: lesson.mtime_ms,
      sortOrder: lesson.sort_order,
      unavailable: Boolean(lesson.unavailable),
      course: serializeCourse(course),
      section: {
        id: section.id,
        sectionIndex: section.section_index,
        title: section.title,
        relativePath: section.relative_path,
        sortOrder: section.sort_order,
      },
      attachments: attachments.map(serializeAttachment),
      progress: serializeProgress(progress),
    },
  })
}
