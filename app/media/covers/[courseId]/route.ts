import { getDb } from '@/lib/server/db'
import { serveCourseFile } from '@/lib/server/media'
import type { CourseRecord } from '@/lib/server/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params
  const id = Number(courseId)
  if (!Number.isSafeInteger(id) || id < 1) {
    return new Response('Invalid course id', { status: 400 })
  }

  const course = getDb().prepare('SELECT * FROM courses WHERE id = ?').get(id) as
    | CourseRecord
    | undefined
  if (!course?.cover_path) {
    return new Response('Not found', { status: 404 })
  }

  const result = serveCourseFile(course.cover_path)
  if (!result) return new Response('Not found', { status: 404 })

  return new Response(result.body, { headers: result.headers })
}
