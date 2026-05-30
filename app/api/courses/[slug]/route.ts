import { getDb } from '@/lib/server/db'
import { serializeAttachment, serializeCourse } from '@/lib/server/serialize'
import { uniqueTags } from '@/lib/server/tags'
import type {
  AttachmentRecord,
  CourseRecord,
  LessonRecord,
  SectionRecord,
} from '@/lib/server/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = getDb()
  const course = db.prepare('SELECT * FROM courses WHERE slug = ?').get(slug) as
    | CourseRecord
    | undefined

  if (!course) {
    return Response.json({ error: 'Course not found' }, { status: 404 })
  }

  const sections = db
    .prepare(
      `
    SELECT * FROM sections
    WHERE course_id = ?
    ORDER BY sort_order ASC, title COLLATE NOCASE ASC
  `,
    )
    .all(course.id) as SectionRecord[]

  const lessons = db
    .prepare(
      `
    SELECT lessons.* FROM lessons
    INNER JOIN sections ON sections.id = lessons.section_id
    WHERE lessons.course_id = ?
    ORDER BY sections.sort_order ASC, lessons.sort_order ASC, lessons.title COLLATE NOCASE ASC
  `,
    )
    .all(course.id) as LessonRecord[]

  const attachments = db
    .prepare(
      `
    SELECT * FROM attachments
    WHERE course_id = ?
    ORDER BY attachment_index ASC, name COLLATE NOCASE ASC
  `,
    )
    .all(course.id) as AttachmentRecord[]

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
          .filter(
            (attachment) => attachment.section_id === section.id && attachment.lesson_id === null,
          )
          .map(serializeAttachment),
      })),
    },
  })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const body = await request.json().catch(() => null)

  if (!body || typeof body !== 'object' || !Array.isArray((body as { tags?: unknown }).tags)) {
    return Response.json({ error: 'Expected a JSON body with a tags array' }, { status: 400 })
  }

  const tags = uniqueTags(
    (body as { tags: unknown[] }).tags.filter((tag): tag is string => typeof tag === 'string'),
  )

  if (tags.length > 24) {
    return Response.json({ error: 'A course can have at most 24 tags' }, { status: 400 })
  }

  if (tags.some((tag) => tag.length > 40)) {
    return Response.json({ error: 'Tags must be 40 characters or fewer' }, { status: 400 })
  }

  const db = getDb()
  const result = db
    .prepare(
      `
    UPDATE courses
    SET tags_json = ?, updated_at = CURRENT_TIMESTAMP
    WHERE slug = ?
  `,
    )
    .run(JSON.stringify(tags), slug)

  if (!result.changes) {
    return Response.json({ error: 'Course not found' }, { status: 404 })
  }

  const course = db.prepare('SELECT * FROM courses WHERE slug = ?').get(slug) as CourseRecord

  return Response.json({ course: serializeCourse(course) })
}
