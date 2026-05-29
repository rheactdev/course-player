import { getDb } from '@/lib/server/db'
import { serializeCourse } from '@/lib/server/serialize'
import type { CourseRecord } from '@/lib/server/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CourseListRow = CourseRecord & {
  sections_count: number
  lessons_count: number
  attachments_count: number
}

export function GET() {
  const rows = getDb().prepare(`
    SELECT
      courses.*,
      (SELECT COUNT(*) FROM sections WHERE sections.course_id = courses.id) AS sections_count,
      (SELECT COUNT(*) FROM lessons WHERE lessons.course_id = courses.id AND lessons.unavailable = 0) AS lessons_count,
      (SELECT COUNT(*) FROM attachments WHERE attachments.course_id = courses.id AND attachments.unavailable = 0) AS attachments_count
    FROM courses
    ORDER BY course_name COLLATE NOCASE ASC
  `).all() as CourseListRow[]

  return Response.json({
    courses: rows.map((row) => ({
      ...serializeCourse(row),
      sectionsCount: row.sections_count,
      lessonsCount: row.lessons_count,
      attachmentsCount: row.attachments_count,
    })),
  })
}
