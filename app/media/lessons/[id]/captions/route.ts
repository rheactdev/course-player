import { getDb } from '@/lib/server/db'
import { serveMatchingVttFile } from '@/lib/server/media'
import type { LessonRecord } from '@/lib/server/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lessonId = Number(id)
  if (!Number.isSafeInteger(lessonId) || lessonId < 1) {
    return new Response('Invalid lesson id', { status: 400 })
  }

  const lesson = getDb().prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId) as
    | LessonRecord
    | undefined

  if (!lesson || lesson.unavailable) {
    return new Response('Not found', { status: 404 })
  }

  const result = serveMatchingVttFile(lesson.relative_path)
  if (!result) return new Response('Not found', { status: 404 })

  return new Response(result.body, { headers: result.headers })
}
