import { getDb } from '@/lib/server/db'
import { serializeAttachment, serializeCourse } from '@/lib/server/serialize'
import type { AttachmentRecord, CourseRecord, LessonRecord, SectionRecord } from '@/lib/server/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = getDb()
  const course = db.prepare('SELECT * FROM courses WHERE slug = ?').get(slug) as CourseRecord | undefined

  if (!course) {
    return Response.json({ error: 'Course not found' }, { status: 404 })
  }

  const sections = db.prepare(`
    SELECT * FROM sections
    WHERE course_id = ?
    ORDER BY sort_order ASC, title COLLATE NOCASE ASC
  `).all(course.id) as SectionRecord[]

  const lessons = db.prepare(`
    SELECT * FROM lessons
    WHERE course_id = ?
    ORDER BY sort_order ASC, title COLLATE NOCASE ASC
  `).all(course.id) as LessonRecord[]

  const attachments = db.prepare(`
    SELECT * FROM attachments
    WHERE course_id = ?
    ORDER BY attachment_index ASC, name COLLATE NOCASE ASC
  `).all(course.id) as AttachmentRecord[]

  return Response.json({
    course: {
      ...serializeCourse(course),
      sections: sections.map((section) => ({
        id: section.id,
        courseId: section.course_id,
        sectionIndex: section.section_index,
        title: section.title,
        relativePath: section.relative_path,
        sortOrder: section.sort_order,
        lessons: lessons
          .filter((lesson) => lesson.section_id === section.id)
          .map((lesson) => ({
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
            attachments: attachments
              .filter((attachment) => attachment.lesson_id === lesson.id)
              .map(serializeAttachment),
          })),
        attachments: attachments
          .filter((attachment) => attachment.section_id === section.id && attachment.lesson_id === null)
          .map(serializeAttachment),
      })),
    },
  })
}
